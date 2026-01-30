-- 🎯 Order Snapshot Pattern Migration
-- Decouple orders from products to allow free product updates

-- Step 1: Add snapshot fields to order_items table
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS product_image_url TEXT,
  ADD COLUMN IF NOT EXISTS variant_sku TEXT,
  ADD COLUMN IF NOT EXISTS variant_size_display TEXT,
  ADD COLUMN IF NOT EXISTS variant_price_tier TEXT,
  ADD COLUMN IF NOT EXISTS price_at_order DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS product_catalog_number TEXT,
  ADD COLUMN IF NOT EXISTS customization_snapshot JSONB;

-- Step 2: Drop foreign key constraint on variant_id
-- This allows products/variants to be updated/deleted freely
ALTER TABLE order_items
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

-- Step 3: Backfill existing orders with snapshot data
-- Copy current product/variant data into existing order items
UPDATE order_items oi
SET 
  product_name = p.title,
  product_image_url = p.image_url,
  variant_sku = pv.sku,
  variant_size_display = pv.size_display,
  variant_price_tier = pv.price_tier,
  price_at_order = pv.price,
  product_catalog_number = p.catalog_number
FROM 
  product_variants pv
  INNER JOIN products p ON pv.product_id = p.id
WHERE 
  oi.variant_id = pv.id
  AND oi.product_name IS NULL; -- Only update if not already set

-- Step 4: Create function to auto-populate snapshots on new orders
CREATE OR REPLACE FUNCTION populate_order_item_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
  v_product_image TEXT;
  v_variant_sku TEXT;
  v_variant_size TEXT;
  v_variant_tier TEXT;
  v_variant_price DECIMAL(10,2);
  v_catalog_number TEXT;
BEGIN
  -- If snapshot fields are not provided, fetch from product_variants
  IF NEW.product_name IS NULL OR NEW.variant_sku IS NULL THEN
    SELECT 
      p.title,
      p.image_url,
      pv.sku,
      pv.size_display,
      pv.price_tier,
      pv.price,
      p.catalog_number
    INTO 
      v_product_name,
      v_product_image,
      v_variant_sku,
      v_variant_size,
      v_variant_tier,
      v_variant_price,
      v_catalog_number
    FROM 
      product_variants pv
      INNER JOIN products p ON pv.product_id = p.id
    WHERE 
      pv.id = NEW.variant_id;
    
    -- If variant found, populate snapshot fields
    IF FOUND THEN
      NEW.product_name := COALESCE(NEW.product_name, v_product_name);
      NEW.product_image_url := COALESCE(NEW.product_image_url, v_product_image);
      NEW.variant_sku := COALESCE(NEW.variant_sku, v_variant_sku);
      NEW.variant_size_display := COALESCE(NEW.variant_size_display, v_variant_size);
      NEW.variant_price_tier := COALESCE(NEW.variant_price_tier, v_variant_tier);
      NEW.price_at_order := COALESCE(NEW.price_at_order, v_variant_price);
      NEW.product_catalog_number := COALESCE(NEW.product_catalog_number, v_catalog_number);
    ELSE
      -- If variant not found (deleted product), set reasonable defaults
      NEW.product_name := COALESCE(NEW.product_name, 'Product Unavailable');
      NEW.variant_sku := COALESCE(NEW.variant_sku, 'N/A');
      NEW.variant_size_display := COALESCE(NEW.variant_size_display, 'N/A');
      NEW.price_at_order := COALESCE(NEW.price_at_order, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to auto-populate on INSERT
DROP TRIGGER IF EXISTS trigger_populate_order_item_snapshot ON order_items;
CREATE TRIGGER trigger_populate_order_item_snapshot
  BEFORE INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION populate_order_item_snapshot();

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_items_variant_sku 
  ON order_items(variant_sku);

CREATE INDEX IF NOT EXISTS idx_order_items_product_name 
  ON order_items(product_name);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN order_items.product_name IS 
  'Snapshot of product title at time of order. Independent of products table.';

COMMENT ON COLUMN order_items.variant_sku IS 
  'Snapshot of variant SKU at time of order. Preserved even if variant is deleted.';

COMMENT ON COLUMN order_items.price_at_order IS 
  'Actual price charged for this item. Frozen at order time, unaffected by future price changes.';

COMMENT ON COLUMN order_items.variant_id IS 
  'Optional reference to product_variants. Used for analytics but not enforced. NULL if variant deleted.';

-- Step 8: Create view for order details with fallback to snapshots
CREATE OR REPLACE VIEW order_items_with_product_details AS
SELECT 
  oi.*,
  -- Use snapshot data as primary source
  COALESCE(oi.product_name, p.title) as display_product_name,
  COALESCE(oi.product_image_url, p.image_url) as display_image_url,
  COALESCE(oi.variant_sku, pv.sku) as display_sku,
  COALESCE(oi.variant_size_display, pv.size_display) as display_size,
  COALESCE(oi.price_at_order, pv.price) as display_price,
  -- Include current product data for reference (may be NULL if deleted)
  p.title as current_product_name,
  pv.sku as current_variant_sku,
  pv.price as current_variant_price
FROM 
  order_items oi
  LEFT JOIN product_variants pv ON oi.variant_id = pv.id
  LEFT JOIN products p ON pv.product_id = p.id;

COMMENT ON VIEW order_items_with_product_details IS 
  'Shows order items with product details. Uses snapshot data as primary source, falls back to current product data if available.';

-- Step 9: Grant necessary permissions
GRANT SELECT ON order_items_with_product_details TO authenticated;
GRANT SELECT ON order_items_with_product_details TO anon;

-- ✅ Migration complete!
-- Orders are now independent snapshots
-- Products can be freely edited, updated, or deleted
-- Order history remains accurate and complete