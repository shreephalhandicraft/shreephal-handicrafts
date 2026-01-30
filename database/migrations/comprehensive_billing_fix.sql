-- ============================================================================
-- COMPREHENSIVE BILLING SYSTEM FIX - ALL ORDERS
-- ============================================================================
-- This migration fixes ALL billing inconsistencies across the entire database
-- 
-- Issues Fixed:
-- 1. Subtotal incorrectly set to order_total (includes GST when it shouldn't)
-- 2. order_total doesn't match subtotal + GST + shipping
-- 3. total_price (paise) doesn't match order_total × 100
-- 4. Missing GST breakdown (gst_5_total, gst_18_total)
-- 5. Missing order item billing details
--
-- BACKUP RECOMMENDATION: Take database backup before running
-- ============================================================================

-- ===========================================
-- STEP 1: CREATE BACKUP TABLES
-- ===========================================

DROP TABLE IF EXISTS orders_backup_before_billing_fix;
CREATE TABLE orders_backup_before_billing_fix AS 
SELECT * FROM orders;

DROP TABLE IF EXISTS order_items_backup_before_billing_fix;
CREATE TABLE order_items_backup_before_billing_fix AS 
SELECT * FROM order_items;

SELECT 
  'Backup created' AS status,
  (SELECT COUNT(*) FROM orders_backup_before_billing_fix) AS orders_backed_up,
  (SELECT COUNT(*) FROM order_items_backup_before_billing_fix) AS order_items_backed_up;

-- ===========================================
-- STEP 2: ADD/ENSURE BILLING COLUMNS EXIST
-- ===========================================

-- Orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gst_5_total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_18_total NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_gst NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);

-- Ensure total_price is INTEGER (paise)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'total_price' 
    AND data_type != 'integer'
  ) THEN
    ALTER TABLE orders ALTER COLUMN total_price TYPE INTEGER USING total_price::INTEGER;
  END IF;
END $$;

-- Order items table
ALTER TABLE order_items 
  ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS unit_price_with_gst NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS item_subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS item_gst_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS item_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_at_order NUMERIC(10,2);

-- ===========================================
-- STEP 3: ANALYZE CURRENT STATE
-- ===========================================

WITH billing_analysis AS (
  SELECT 
    id,
    subtotal,
    total_gst,
    shipping_cost,
    order_total,
    total_price,
    (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) AS calculated_total,
    ABS(COALESCE(order_total, 0) - (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) AS total_diff,
    ABS(COALESCE(total_price, 0) - ROUND((COALESCE(order_total, 0) * 100))) AS price_paise_diff,
    CASE
      WHEN ABS(COALESCE(order_total, 0) - (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01 
      THEN 'order_total_mismatch'
      WHEN ABS(COALESCE(total_price, 0) - ROUND((COALESCE(order_total, 0) * 100))) > 0 
      THEN 'total_price_mismatch'
      ELSE 'valid'
    END AS issue_type
  FROM orders
)
SELECT 
  'BEFORE FIX - Analysis' AS phase,
  issue_type,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM billing_analysis
GROUP BY issue_type
ORDER BY count DESC;

-- ===========================================
-- STEP 4: FIX ORDER ITEMS BILLING
-- ===========================================

-- Set default GST rate if missing (18% default, 5% for handicrafts)
UPDATE order_items oi
SET gst_rate = COALESCE(
  oi.gst_rate,
  CASE 
    WHEN p.category IS NOT NULL AND (
      p.category ILIKE '%handicraft%' OR 
      p.category ILIKE '%handmade%' OR
      p.category ILIKE '%hand-made%' OR
      p.category ILIKE '%art%' OR
      p.category ILIKE '%craft%' OR
      p.category ILIKE '%decor%'
    ) THEN 5
    ELSE 18
  END
)
FROM products p
WHERE oi.product_id = p.id AND oi.gst_rate IS NULL;

-- Calculate item billing from unit_price (assuming it includes GST)
-- This handles the common scenario where unit_price = price WITH GST
UPDATE order_items
SET
  -- Ensure GST rate is set
  gst_rate = COALESCE(gst_rate, 18),
  
  -- unit_price is in paise, convert to rupees with GST
  unit_price_with_gst = COALESCE(
    unit_price_with_gst,
    CASE 
      WHEN unit_price IS NOT NULL THEN unit_price / 100.0
      ELSE price_at_order
    END
  )
WHERE unit_price_with_gst IS NULL;

-- Calculate base price (reverse calculate from price WITH GST)
UPDATE order_items
SET
  base_price = ROUND(
    unit_price_with_gst / (1 + COALESCE(gst_rate, 18) / 100.0), 
    2
  ),
  price_at_order = COALESCE(price_at_order, unit_price_with_gst)
WHERE base_price IS NULL AND unit_price_with_gst IS NOT NULL;

-- Calculate GST amount and totals
UPDATE order_items
SET
  gst_amount = ROUND(base_price * (COALESCE(gst_rate, 18) / 100.0), 2),
  item_subtotal = ROUND(base_price * quantity, 2),
  item_gst_total = ROUND(base_price * quantity * (COALESCE(gst_rate, 18) / 100.0), 2),
  item_total = ROUND(base_price * quantity * (1 + COALESCE(gst_rate, 18) / 100.0), 2),
  total_price = ROUND(base_price * quantity * (1 + COALESCE(gst_rate, 18) / 100.0) * 100)
WHERE gst_amount IS NULL OR item_subtotal IS NULL;

-- ===========================================
-- STEP 5: FIX ORDERS BILLING
-- ===========================================

-- Calculate order totals from order_items
WITH order_calculations AS (
  SELECT
    o.id,
    COALESCE(SUM(oi.item_subtotal), 0) AS calc_subtotal,
    COALESCE(SUM(CASE WHEN oi.gst_rate = 5 THEN oi.item_gst_total ELSE 0 END), 0) AS calc_gst_5,
    COALESCE(SUM(CASE WHEN oi.gst_rate = 18 THEN oi.item_gst_total ELSE 0 END), 0) AS calc_gst_18,
    COALESCE(SUM(oi.item_gst_total), 0) AS calc_total_gst,
    COALESCE(o.shipping_cost, 0) AS calc_shipping
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  GROUP BY o.id, o.shipping_cost
)
UPDATE orders o
SET
  subtotal = ROUND(oc.calc_subtotal, 2),
  gst_5_total = ROUND(oc.calc_gst_5, 2),
  gst_18_total = ROUND(oc.calc_gst_18, 2),
  total_gst = ROUND(oc.calc_total_gst, 2),
  shipping_cost = oc.calc_shipping,
  
  -- CORRECT FORMULA: order_total = subtotal + total_gst + shipping
  order_total = ROUND(oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping, 2),
  grand_total = ROUND(oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping, 2),
  amount = ROUND(oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping, 2),
  
  -- total_price in PAISE
  total_price = ROUND((oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping) * 100)::INTEGER
FROM order_calculations oc
WHERE o.id = oc.id;

-- ===========================================
-- STEP 6: VERIFICATION
-- ===========================================

-- Rerun analysis to see improvements
WITH billing_analysis AS (
  SELECT 
    id,
    subtotal,
    total_gst,
    shipping_cost,
    order_total,
    total_price,
    (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) AS calculated_total,
    ABS(COALESCE(order_total, 0) - (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) AS total_diff,
    ABS(COALESCE(total_price, 0) - ROUND((COALESCE(order_total, 0) * 100))) AS price_paise_diff,
    CASE
      WHEN ABS(COALESCE(order_total, 0) - (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) < 0.01 
        AND ABS(COALESCE(total_price, 0) - ROUND((COALESCE(order_total, 0) * 100))) = 0
      THEN 'valid'
      WHEN ABS(COALESCE(order_total, 0) - (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) >= 0.01 
      THEN 'order_total_mismatch'
      WHEN ABS(COALESCE(total_price, 0) - ROUND((COALESCE(order_total, 0) * 100))) > 0 
      THEN 'total_price_mismatch'
      ELSE 'valid'
    END AS issue_type
  FROM orders
)
SELECT 
  'AFTER FIX - Analysis' AS phase,
  issue_type,
  COUNT(*) AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) AS percentage
FROM billing_analysis
GROUP BY issue_type
ORDER BY count DESC;

-- Show sample of fixed orders
SELECT 
  'Sample Fixed Orders' AS info,
  id,
  subtotal AS "Subtotal (₹)",
  gst_5_total AS "GST 5% (₹)",
  gst_18_total AS "GST 18% (₹)",
  total_gst AS "Total GST (₹)",
  shipping_cost AS "Shipping (₹)",
  order_total AS "Order Total (₹)",
  total_price AS "Total (paise)",
  ROUND((subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)), 2) AS "Calculated",
  CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) < 0.01 
      AND total_price = ROUND((order_total * 100))
    THEN '✅ VALID'
    ELSE '❌ INVALID'
  END AS "Status",
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- ===========================================
-- STEP 7: CREATE VALIDATION FUNCTION
-- ===========================================

CREATE OR REPLACE FUNCTION validate_order_billing()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure total_gst equals sum of GST components
  NEW.total_gst := COALESCE(NEW.gst_5_total, 0) + COALESCE(NEW.gst_18_total, 0);
  
  -- Ensure order_total equals subtotal + GST + shipping
  NEW.order_total := ROUND(
    COALESCE(NEW.subtotal, 0) + 
    COALESCE(NEW.total_gst, 0) + 
    COALESCE(NEW.shipping_cost, 0), 
    2
  );
  
  -- Sync dependent fields
  NEW.grand_total := NEW.order_total;
  NEW.amount := NEW.order_total;
  
  -- Ensure total_price (paise) matches order_total
  NEW.total_price := ROUND(NEW.order_total * 100)::INTEGER;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS enforce_billing_consistency ON orders;
CREATE TRIGGER enforce_billing_consistency
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_billing();

-- ===========================================
-- STEP 8: CREATE HELPER VIEWS
-- ===========================================

CREATE OR REPLACE VIEW v_order_billing_health AS
SELECT 
  o.id,
  o.created_at,
  o.status,
  o.subtotal,
  o.total_gst,
  o.shipping_cost,
  o.order_total,
  o.total_price,
  ROUND((o.subtotal + COALESCE(o.total_gst, 0) + COALESCE(o.shipping_cost, 0)), 2) AS calculated_total,
  ABS(o.order_total - (o.subtotal + COALESCE(o.total_gst, 0) + COALESCE(o.shipping_cost, 0))) AS total_diff,
  CASE 
    WHEN ABS(o.order_total - (o.subtotal + COALESCE(o.total_gst, 0) + COALESCE(o.shipping_cost, 0))) < 0.01 
      AND o.total_price = ROUND((o.order_total * 100))
    THEN true
    ELSE false
  END AS is_valid,
  CASE 
    WHEN ABS(o.order_total - (o.subtotal + COALESCE(o.total_gst, 0) + COALESCE(o.shipping_cost, 0))) >= 0.01
    THEN 'order_total_mismatch'
    WHEN o.total_price != ROUND((o.order_total * 100))
    THEN 'total_price_mismatch'
    ELSE NULL
  END AS issue_type
FROM orders o;

-- ===========================================
-- STEP 9: FINAL SUMMARY REPORT
-- ===========================================

SELECT '============ BILLING FIX SUMMARY ============' AS "";

SELECT 
  'Total Orders' AS metric,
  COUNT(*) AS value
FROM orders
UNION ALL
SELECT 
  'Valid Billing' AS metric,
  COUNT(*) AS value
FROM v_order_billing_health
WHERE is_valid = true
UNION ALL
SELECT 
  'Invalid Billing' AS metric,
  COUNT(*) AS value
FROM v_order_billing_health
WHERE is_valid = false
UNION ALL
SELECT 
  'Success Rate (%)' AS metric,
  ROUND(100.0 * SUM(CASE WHEN is_valid THEN 1 ELSE 0 END) / COUNT(*), 2) AS value
FROM v_order_billing_health;

-- Show any remaining issues
SELECT 
  'Remaining Issues' AS info,
  id,
  issue_type,
  total_diff,
  order_total,
  calculated_total
FROM v_order_billing_health
WHERE is_valid = false
LIMIT 10;

SELECT '============ MIGRATION COMPLETE ============' AS "";
