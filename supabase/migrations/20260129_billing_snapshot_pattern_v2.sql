-- 💰 Billing Snapshot Pattern Migration v2
-- FIXED: Use 'order_total' instead of 'grand_total' to match code

-- ========================================
-- PART 1: ORDER_ITEMS TABLE UPDATES
-- ========================================

-- Add billing snapshot columns to order_items
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),           -- Price without GST
  ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,4),              -- 0.05, 0.18, or 0 (stored as decimal)
  ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2),           -- GST per unit
  ADD COLUMN IF NOT EXISTS unit_price_with_gst DECIMAL(10,2),  -- Price customer pays per unit (base + GST)
  ADD COLUMN IF NOT EXISTS item_subtotal DECIMAL(10,2),        -- base_price × quantity
  ADD COLUMN IF NOT EXISTS item_gst_total DECIMAL(10,2),       -- gst_amount × quantity
  ADD COLUMN IF NOT EXISTS item_total DECIMAL(10,2);           -- Total for this line item (with GST)

-- Backfill existing order_items with calculated values
UPDATE order_items
SET 
  base_price = COALESCE(base_price, unit_price / 100.0),
  gst_rate = COALESCE(gst_rate, 0),
  gst_amount = COALESCE(gst_amount, 0),
  unit_price_with_gst = COALESCE(unit_price_with_gst, unit_price / 100.0),
  item_subtotal = COALESCE(item_subtotal, (unit_price / 100.0) * quantity),
  item_gst_total = COALESCE(item_gst_total, 0),
  item_total = COALESCE(item_total, total_price / 100.0)
WHERE 
  base_price IS NULL;

-- ========================================
-- PART 2: ORDERS TABLE UPDATES
-- ========================================

-- Add billing summary columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),             -- Sum of all base prices
  ADD COLUMN IF NOT EXISTS gst_5_total DECIMAL(10,2),          -- Total GST @5%
  ADD COLUMN IF NOT EXISTS gst_18_total DECIMAL(10,2),         -- Total GST @18%
  ADD COLUMN IF NOT EXISTS total_gst DECIMAL(10,2),            -- Sum of all GST
  ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2),        -- Shipping charges
  ADD COLUMN IF NOT EXISTS order_total DECIMAL(10,2);          -- ✅ FIXED: Changed from grand_total to order_total

-- Backfill existing orders with calculated totals from order_items
UPDATE orders o
SET
  subtotal = COALESCE(subtotal, (
    SELECT COALESCE(SUM(item_subtotal), 0)
    FROM order_items 
    WHERE order_id = o.id
  )),
  gst_5_total = COALESCE(gst_5_total, (
    SELECT COALESCE(SUM(item_gst_total), 0)
    FROM order_items 
    WHERE order_id = o.id AND gst_rate = 0.05
  )),
  gst_18_total = COALESCE(gst_18_total, (
    SELECT COALESCE(SUM(item_gst_total), 0)
    FROM order_items 
    WHERE order_id = o.id AND gst_rate = 0.18
  )),
  total_gst = COALESCE(total_gst, (
    SELECT COALESCE(SUM(item_gst_total), 0)
    FROM order_items 
    WHERE order_id = o.id
  )),
  shipping_cost = COALESCE(shipping_cost, 0),
  order_total = COALESCE(order_total, amount)  -- ✅ FIXED: order_total instead of grand_total
WHERE
  subtotal IS NULL;

-- ========================================
-- PART 3: TRIGGER FUNCTIONS
-- ========================================

-- Function to calculate and populate billing snapshot for order_items
CREATE OR REPLACE FUNCTION populate_order_item_billing()
RETURNS TRIGGER AS $$
DECLARE
  v_product_gst_5 BOOLEAN;
  v_product_gst_18 BOOLEAN;
  v_calculated_gst_rate DECIMAL(5,4);
  v_calculated_base_price DECIMAL(10,2);
  v_calculated_gst_amount DECIMAL(10,2);
  v_calculated_unit_price DECIMAL(10,2);
BEGIN
  -- If billing fields are not provided, calculate them
  IF NEW.base_price IS NULL OR NEW.gst_rate IS NULL THEN
    
    -- Get GST flags from product
    SELECT 
      p.gst_5pct,
      p.gst_18pct
    INTO 
      v_product_gst_5,
      v_product_gst_18
    FROM 
      product_variants pv
      INNER JOIN products p ON pv.product_id = p.id
    WHERE 
      pv.id = NEW.variant_id;
    
    -- Determine GST rate (5% priority over 18%)
    IF v_product_gst_5 = TRUE THEN
      v_calculated_gst_rate := 0.05;
    ELSIF v_product_gst_18 = TRUE THEN
      v_calculated_gst_rate := 0.18;
    ELSE
      v_calculated_gst_rate := 0;
    END IF;
    
    -- If unit_price is provided in paise, convert and extract base
    IF NEW.unit_price IS NOT NULL THEN
      v_calculated_unit_price := NEW.unit_price / 100.0;
      -- Reverse calculate base price from unit price with GST
      v_calculated_base_price := ROUND(v_calculated_unit_price / (1 + v_calculated_gst_rate), 2);
      v_calculated_gst_amount := ROUND(v_calculated_base_price * v_calculated_gst_rate, 2);
    ELSE
      -- Fallback: use price_at_order or 0
      v_calculated_base_price := COALESCE(NEW.price_at_order, 0);
      v_calculated_gst_amount := ROUND(v_calculated_base_price * v_calculated_gst_rate, 2);
      v_calculated_unit_price := v_calculated_base_price + v_calculated_gst_amount;
    END IF;
    
    -- Populate calculated fields
    NEW.base_price := COALESCE(NEW.base_price, v_calculated_base_price);
    NEW.gst_rate := COALESCE(NEW.gst_rate, v_calculated_gst_rate);
    NEW.gst_amount := COALESCE(NEW.gst_amount, v_calculated_gst_amount);
    NEW.unit_price_with_gst := COALESCE(NEW.unit_price_with_gst, v_calculated_unit_price);
  END IF;
  
  -- Calculate line item totals
  NEW.item_subtotal := ROUND(NEW.base_price * NEW.quantity, 2);
  NEW.item_gst_total := ROUND(NEW.gst_amount * NEW.quantity, 2);
  NEW.item_total := ROUND(NEW.unit_price_with_gst * NEW.quantity, 2);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create/replace trigger for order_items
DROP TRIGGER IF EXISTS trigger_populate_order_item_billing ON order_items;
CREATE TRIGGER trigger_populate_order_item_billing
  BEFORE INSERT OR UPDATE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION populate_order_item_billing();

-- Function to update order totals when order_items change
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update parent order totals
  UPDATE orders
  SET
    subtotal = (
      SELECT COALESCE(SUM(item_subtotal), 0)
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    gst_5_total = (
      SELECT COALESCE(SUM(item_gst_total), 0)
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND gst_rate = 0.05
    ),
    gst_18_total = (
      SELECT COALESCE(SUM(item_gst_total), 0)
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
        AND gst_rate = 0.18
    ),
    total_gst = (
      SELECT COALESCE(SUM(item_gst_total), 0)
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    order_total = (  -- ✅ FIXED: order_total instead of grand_total
      SELECT 
        COALESCE(SUM(item_subtotal), 0) + 
        COALESCE(SUM(item_gst_total), 0) + 
        COALESCE(shipping_cost, 0)
      FROM order_items
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update order totals
DROP TRIGGER IF EXISTS trigger_update_order_totals ON order_items;
CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

-- ========================================
-- PART 4: INDEXES & CONSTRAINTS
-- ========================================

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_gst_rate 
  ON order_items(gst_rate);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id_gst 
  ON order_items(order_id, gst_rate);

CREATE INDEX IF NOT EXISTS idx_orders_order_total 
  ON orders(order_total);  -- ✅ FIXED: order_total instead of grand_total

-- Add check constraints (skip if they already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_gst_rate_valid'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT check_gst_rate_valid 
        CHECK (gst_rate IN (0, 0.05, 0.18));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_prices_non_negative'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT check_prices_non_negative 
        CHECK (base_price >= 0 AND gst_amount >= 0 AND item_total >= 0);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_order_totals_non_negative'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT check_order_totals_non_negative 
        CHECK (subtotal >= 0 AND total_gst >= 0 AND order_total >= 0);  -- ✅ FIXED
  END IF;
END $$;

-- ========================================
-- PART 5: DOCUMENTATION
-- ========================================

-- Add column comments
COMMENT ON COLUMN order_items.base_price IS 
  'Product base price without GST at time of order (frozen snapshot)';

COMMENT ON COLUMN order_items.gst_rate IS 
  'GST rate applied: 0 (none), 0.05 (5%), or 0.18 (18%). Frozen at order time.';

COMMENT ON COLUMN order_items.gst_amount IS 
  'GST amount per unit (base_price × gst_rate)';

COMMENT ON COLUMN order_items.unit_price_with_gst IS 
  'Final price customer pays per unit including GST (base_price + gst_amount)';

COMMENT ON COLUMN order_items.item_total IS 
  'Total for this line item: (base_price + gst_amount) × quantity';

COMMENT ON COLUMN orders.subtotal IS 
  'Sum of all item base prices (before GST)';

COMMENT ON COLUMN orders.gst_5_total IS 
  'Total GST collected @5% rate';

COMMENT ON COLUMN orders.gst_18_total IS 
  'Total GST collected @18% rate';

COMMENT ON COLUMN orders.total_gst IS 
  'Sum of all GST (gst_5_total + gst_18_total + any other rates)';

COMMENT ON COLUMN orders.order_total IS   -- ✅ FIXED: order_total instead of grand_total
  'Final order total: subtotal + total_gst + shipping_cost';

-- ========================================
-- PART 6: HELPER VIEW
-- ========================================

-- Create view for order billing breakdown
CREATE OR REPLACE VIEW order_billing_summary AS
SELECT 
  o.id as order_id,
  o.subtotal,
  o.gst_5_total,
  o.gst_18_total,
  o.total_gst,
  o.shipping_cost,
  o.order_total,  -- ✅ FIXED: order_total instead of grand_total
  
  -- Item count and quantity
  COUNT(oi.id) as item_count,
  COALESCE(SUM(oi.quantity), 0) as total_quantity,
  
  -- Categorize items by GST rate
  COUNT(CASE WHEN oi.gst_rate = 0.05 THEN 1 END) as items_with_5pct_gst,
  COUNT(CASE WHEN oi.gst_rate = 0.18 THEN 1 END) as items_with_18pct_gst,
  COUNT(CASE WHEN oi.gst_rate = 0 THEN 1 END) as items_with_no_gst,
  
  -- Order metadata
  o.payment_status,
  o.payment_method,
  o.created_at
FROM 
  orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY 
  o.id;

COMMENT ON VIEW order_billing_summary IS 
  'Complete billing breakdown for each order with GST categorization';

-- Grant permissions
GRANT SELECT ON order_billing_summary TO authenticated;
GRANT SELECT ON order_billing_summary TO anon;

-- ✅ Migration complete!
-- FIXED: All references to 'grand_total' changed to 'order_total' to match code
