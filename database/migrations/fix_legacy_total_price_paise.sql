-- Migration: Convert legacy total_price from paise to rupees
-- Date: 2026-01-30
-- Purpose: Fix inconsistency where old orders stored prices in paise while new orders store in rupees

-- ========================================
-- STEP 1: Fix Orders Table
-- ========================================

-- Update total_price: Convert from paise to rupees
-- Only update if total_price appears to be in paise (unreasonably high values > 1000)
-- This assumes no single order legitimately costs more than ₹1000 in the old data
UPDATE orders
SET total_price = total_price / 100.0
WHERE total_price > 1000  -- Likely stored in paise
  AND order_total IS NULL  -- Old orders without snapshot
  AND created_at < '2026-01-30 10:57:00+00';  -- Before the fix was deployed

-- ========================================
-- STEP 2: Fix Order Items Table  
-- ========================================

-- Update total_price: Convert from paise to rupees
UPDATE order_items
SET total_price = total_price / 100.0
WHERE total_price > 1000  -- Likely stored in paise
  AND item_total IS NULL  -- Old items without snapshot
  AND created_at < '2026-01-30 10:57:00+00';  -- Before the fix

-- Update unit_price: Convert from paise to rupees
UPDATE order_items  
SET unit_price = unit_price / 100.0
WHERE unit_price > 1000  -- Likely stored in paise
  AND base_price IS NULL  -- Old items without snapshot
  AND created_at < '2026-01-30 10:57:00+00';  -- Before the fix

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check orders table consistency
SELECT 
  order_id,
  ROUND(order_total::numeric, 2) as order_total_snapshot,
  ROUND(total_price::numeric, 2) as total_price_legacy,
  ROUND(amount::numeric, 2) as amount_legacy,
  CASE 
    WHEN order_total IS NOT NULL THEN 'New (has snapshot)'
    WHEN total_price > 1000 THEN 'OLD - NEEDS FIX (still in paise)'
    ELSE 'Fixed or small order'
  END as status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- Check order_items table consistency  
SELECT
  oi.id,
  oi.order_id,
  ROUND(oi.base_price::numeric, 2) as base_price_snapshot,
  ROUND(oi.unit_price::numeric, 2) as unit_price_legacy,
  ROUND(oi.total_price::numeric, 2) as total_price_legacy,
  ROUND(oi.item_total::numeric, 2) as item_total_snapshot,
  CASE
    WHEN oi.item_total IS NOT NULL THEN 'New (has snapshot)'
    WHEN oi.total_price > 1000 OR oi.unit_price > 1000 THEN 'OLD - NEEDS FIX'
    ELSE 'Fixed or small order'
  END as status,
  oi.created_at
FROM order_items oi
ORDER BY oi.created_at DESC
LIMIT 20;

-- Summary report
SELECT 
  'Orders' as table_name,
  COUNT(*) FILTER (WHERE order_total IS NOT NULL) as with_snapshot,
  COUNT(*) FILTER (WHERE order_total IS NULL AND total_price <= 1000) as legacy_fixed,
  COUNT(*) FILTER (WHERE order_total IS NULL AND total_price > 1000) as legacy_needs_fix,
  COUNT(*) as total_orders
FROM orders
UNION ALL
SELECT
  'Order Items' as table_name,
  COUNT(*) FILTER (WHERE item_total IS NOT NULL) as with_snapshot,
  COUNT(*) FILTER (WHERE item_total IS NULL AND total_price <= 1000) as legacy_fixed,
  COUNT(*) FILTER (WHERE item_total IS NULL AND total_price > 1000) as legacy_needs_fix,
  COUNT(*) as total_items
FROM order_items;
