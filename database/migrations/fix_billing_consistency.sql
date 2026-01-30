-- ============================================================================
-- BILLING SYSTEM CONSISTENCY FIX
-- ============================================================================
-- This migration fixes billing inconsistencies in the orders and order_items tables.
-- 
-- PROBLEM:
-- - total_price was stored incorrectly (not in paise as expected)
-- - order_total, amount, grand_total had duplicate/inconsistent values
-- - GST was not properly separated by rate (5% vs 18%)
--
-- SOLUTION:
-- - Standardize all monetary values in NUMERIC(10,2) format (rupees)
-- - Use total_price INTEGER field for paise (backward compatibility)
-- - Properly calculate: subtotal, gst_5_total, gst_18_total, total_gst, order_total
-- - Formula: order_total = subtotal + total_gst + shipping_cost
-- ============================================================================

-- Step 1: Ensure all billing columns exist with correct types
-- (Run this if columns are missing or have wrong types)

-- For orders table
ALTER TABLE orders 
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gst_5_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gst_18_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS total_gst NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS grand_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);

-- Ensure total_price is INTEGER (for paise)
ALTER TABLE orders 
  ALTER COLUMN total_price TYPE INTEGER USING total_price::INTEGER;

-- For order_items table
ALTER TABLE order_items 
  ADD COLUMN IF NOT EXISTS base_price NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS gst_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS unit_price_with_gst NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS item_subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS item_gst_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS item_total NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_at_order NUMERIC(10,2);

-- Ensure unit_price and total_price are INTEGER (for paise)
ALTER TABLE order_items 
  ALTER COLUMN unit_price TYPE INTEGER USING unit_price::INTEGER,
  ALTER COLUMN total_price TYPE INTEGER USING total_price::INTEGER;

-- ============================================================================
-- Step 2: Fix existing order_items data
-- ============================================================================
-- Calculate proper billing for each order item
-- Assumes: unit_price field contains price WITH GST in paise
-- Default GST rate: 18% (adjust based on your products)

UPDATE order_items
SET 
  -- Convert unit_price from paise to rupees (this is price WITH GST)
  unit_price_with_gst = unit_price / 100.0,
  
  -- Calculate base price (price WITHOUT GST)
  -- Formula: base_price = unit_price_with_gst / (1 + gst_rate/100)
  base_price = (unit_price / 100.0) / (1 + COALESCE(gst_rate, 18) / 100.0),
  
  -- Calculate GST amount per unit
  gst_amount = ((unit_price / 100.0) / (1 + COALESCE(gst_rate, 18) / 100.0)) * (COALESCE(gst_rate, 18) / 100.0),
  
  -- Calculate item totals
  item_subtotal = (((unit_price / 100.0) / (1 + COALESCE(gst_rate, 18) / 100.0)) * quantity),
  item_gst_total = ((((unit_price / 100.0) / (1 + COALESCE(gst_rate, 18) / 100.0)) * (COALESCE(gst_rate, 18) / 100.0)) * quantity),
  item_total = (unit_price / 100.0) * quantity,
  
  -- Set default GST rate if missing
  gst_rate = COALESCE(gst_rate, 18),
  
  -- Update price_at_order
  price_at_order = unit_price / 100.0
  
WHERE base_price IS NULL OR gst_amount IS NULL;

-- ============================================================================
-- Step 3: Fix existing orders data
-- ============================================================================
-- Recalculate order totals from order_items

WITH order_calculations AS (
  SELECT
    o.id,
    
    -- Sum all item subtotals (base prices)
    COALESCE(SUM(oi.item_subtotal), 0) AS calc_subtotal,
    
    -- Sum GST by rate
    COALESCE(SUM(CASE WHEN oi.gst_rate = 5 THEN oi.item_gst_total ELSE 0 END), 0) AS calc_gst_5_total,
    COALESCE(SUM(CASE WHEN oi.gst_rate = 18 THEN oi.item_gst_total ELSE 0 END), 0) AS calc_gst_18_total,
    
    -- Total GST
    COALESCE(SUM(oi.item_gst_total), 0) AS calc_total_gst,
    
    -- Shipping (from orders table or default to 0)
    COALESCE(o.shipping_cost, 0) AS calc_shipping_cost
    
  FROM orders o
  LEFT JOIN order_items oi ON o.id = oi.order_id
  GROUP BY o.id, o.shipping_cost
)
UPDATE orders o
SET
  subtotal = oc.calc_subtotal,
  gst_5_total = oc.calc_gst_5_total,
  gst_18_total = oc.calc_gst_18_total,
  total_gst = oc.calc_total_gst,
  shipping_cost = oc.calc_shipping_cost,
  
  -- CORRECTED FORMULA: order_total = subtotal + total_gst + shipping
  order_total = ROUND((oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping_cost)::NUMERIC, 2),
  grand_total = ROUND((oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping_cost)::NUMERIC, 2),
  amount = ROUND((oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping_cost)::NUMERIC, 2),
  
  -- total_price in PAISE (for legacy compatibility)
  total_price = ROUND((oc.calc_subtotal + oc.calc_total_gst + oc.calc_shipping_cost) * 100)::INTEGER
  
FROM order_calculations oc
WHERE o.id = oc.id;

-- ============================================================================
-- Step 4: Add validation check
-- ============================================================================
-- Query to verify billing consistency

SELECT 
  id,
  subtotal,
  total_gst,
  shipping_cost,
  order_total,
  amount,
  total_price,
  -- Check if order_total = subtotal + total_gst + shipping_cost
  ROUND((COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))::NUMERIC, 2) AS calculated_total,
  -- Check if values match
  CASE 
    WHEN ROUND((COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))::NUMERIC, 2) = order_total 
    THEN '✅ VALID'
    ELSE '❌ INVALID'
  END AS validation_status,
  -- Check if total_price matches (in paise)
  CASE 
    WHEN ROUND(order_total * 100)::INTEGER = total_price 
    THEN '✅ VALID'
    ELSE '❌ INVALID'
  END AS total_price_status
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- Step 5: Add database constraints (optional but recommended)
-- ============================================================================

-- Add check constraint to ensure order_total is calculated correctly
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS check_order_total_calculation,
  ADD CONSTRAINT check_order_total_calculation 
  CHECK (
    ABS(order_total - (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) < 0.01
  );

-- Add check constraint to ensure total_gst is sum of gst_5_total and gst_18_total
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS check_total_gst_calculation,
  ADD CONSTRAINT check_total_gst_calculation 
  CHECK (
    ABS(total_gst - (COALESCE(gst_5_total, 0) + COALESCE(gst_18_total, 0))) < 0.01
  );

-- ============================================================================
-- Step 6: Create helpful views (optional)
-- ============================================================================

-- View for order billing summary
CREATE OR REPLACE VIEW order_billing_summary AS
SELECT 
  o.id AS order_id,
  o.created_at,
  o.status,
  o.subtotal,
  o.gst_5_total,
  o.gst_18_total,
  o.total_gst,
  o.shipping_cost,
  o.order_total,
  o.total_price AS total_price_paise,
  o.payment_status,
  COUNT(oi.id) AS item_count,
  SUM(oi.quantity) AS total_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.created_at, o.status, o.subtotal, o.gst_5_total, o.gst_18_total, 
         o.total_gst, o.shipping_cost, o.order_total, o.total_price, o.payment_status;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- 1. Check for any orders with billing mismatches
SELECT 
  'Billing Mismatch Count' AS check_type,
  COUNT(*) AS count
FROM orders
WHERE ABS(order_total - (COALESCE(subtotal, 0) + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) >= 0.01;

-- 2. Check GST calculation
SELECT 
  'GST Mismatch Count' AS check_type,
  COUNT(*) AS count
FROM orders
WHERE ABS(total_gst - (COALESCE(gst_5_total, 0) + COALESCE(gst_18_total, 0))) >= 0.01;

-- 3. Sample of corrected orders
SELECT 
  id AS order_id,
  order_total,
  subtotal,
  total_gst,
  shipping_cost,
  total_price / 100.0 AS total_price_rupees,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
