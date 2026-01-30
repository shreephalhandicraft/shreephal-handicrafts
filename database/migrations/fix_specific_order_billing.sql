-- ============================================================================
-- FIX SPECIFIC BILLING ISSUE: Subtotal incorrectly set to order_total
-- ============================================================================
-- 
-- PROBLEM IDENTIFIED:
-- Order 894e2739-cc39-4be1-bbf7-144a273a9416 has:
--   subtotal: 210.00 (WRONG - this is the final total)
--   total_gst: 4.50
--   order_total: 210.00 (should be 214.50)
--   total_price: 21000 (should be 21450)
--
-- ROOT CAUSE:
-- The subtotal field was set to the final amount instead of base price.
-- Correct formula: order_total = subtotal + total_gst + shipping_cost
--
-- ============================================================================

-- Step 1: Identify affected orders
-- These are orders where subtotal + total_gst ≠ order_total

SELECT 
  id AS order_id,
  subtotal,
  total_gst,
  shipping_cost,
  order_total,
  (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) AS calculated_total,
  ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) AS difference
FROM orders
WHERE ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01
ORDER BY created_at DESC;

-- Step 2: Fix the specific order
-- Order ID: 894e2739-cc39-4be1-bbf7-144a273a9416

UPDATE orders
SET
  -- Recalculate subtotal from order_total and total_gst
  -- subtotal = order_total - total_gst - shipping_cost
  subtotal = CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01
    THEN order_total - COALESCE(total_gst, 0) - COALESCE(shipping_cost, 0)
    ELSE subtotal
  END,
  
  -- Recalculate order_total correctly
  order_total = CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01
    THEN subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)
    ELSE order_total
  END,
  
  -- Update dependent fields
  grand_total = CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01
    THEN subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)
    ELSE grand_total
  END,
  
  amount = CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01
    THEN subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)
    ELSE amount
  END,
  
  -- Update total_price (in paise)
  total_price = CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01
    THEN ROUND((subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) * 100)::INTEGER
    ELSE total_price
  END
  
WHERE id = '894e2739-cc39-4be1-bbf7-144a273a9416';

-- Step 3: Fix ALL affected orders (use with caution)
-- Uncomment the below query ONLY after verifying the logic is correct

/*
UPDATE orders
SET
  -- The issue: subtotal was set to order_total (final amount)
  -- Fix: subtotal = order_total - total_gst - shipping_cost
  subtotal = order_total - COALESCE(total_gst, 0) - COALESCE(shipping_cost, 0),
  
  -- Then recalculate order_total properly
  order_total = (order_total - COALESCE(total_gst, 0) - COALESCE(shipping_cost, 0)) 
                + COALESCE(total_gst, 0) 
                + COALESCE(shipping_cost, 0),
  
  -- Update dependent fields
  grand_total = order_total,
  amount = order_total,
  total_price = ROUND(order_total * 100)::INTEGER
  
WHERE ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) > 0.01;
*/

-- Step 4: Verification for Order 894e2739

SELECT 
  'Order 894e2739 - AFTER FIX' AS check_point,
  id,
  subtotal AS "Subtotal (base price)",
  total_gst AS "Total GST",
  shipping_cost AS "Shipping",
  (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) AS "Calculated Total",
  order_total AS "Stored order_total",
  total_price AS "total_price (paise)",
  ROUND((subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) * 100) AS "Expected total_price",
  CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) < 0.01 
    THEN '✅ VALID'
    ELSE '❌ INVALID'
  END AS "Validation Status"
FROM orders
WHERE id = '894e2739-cc39-4be1-bbf7-144a273a9416';

-- Step 5: Complete verification for all orders

SELECT 
  id,
  subtotal,
  total_gst,
  shipping_cost,
  order_total,
  total_price,
  ROUND((subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) * 100) AS expected_total_price,
  CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) < 0.01 
      AND total_price = ROUND((subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0)) * 100)
    THEN '✅ VALID'
    ELSE '❌ INVALID'
  END AS status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- ALTERNATIVE APPROACH: If subtotal was meant to be the amount paid
-- ============================================================================
-- If the business logic is:
-- - "subtotal" field actually stores what customer paid (order_total)
-- - Then we need to back-calculate the base price

-- This approach:
-- 1. Treats current "order_total" as the correct final amount
-- 2. Calculates what the base subtotal should be

/*
UPDATE orders
SET
  -- Current order_total is what customer actually paid
  -- Back-calculate: subtotal = order_total - total_gst - shipping_cost
  subtotal = order_total - COALESCE(total_gst, 0) - COALESCE(shipping_cost, 0),
  
  -- Verify order_total is correct
  grand_total = order_total,
  amount = order_total,
  
  -- Update total_price to match
  total_price = ROUND(order_total * 100)::INTEGER
  
WHERE id = '894e2739-cc39-4be1-bbf7-144a273a9416';
*/

-- Expected result for Order 894e2739:
-- subtotal: 205.50 (210.00 - 4.50)
-- total_gst: 4.50
-- shipping_cost: 0.00
-- order_total: 210.00 (205.50 + 4.50 + 0)
-- total_price: 21000 (210.00 × 100)

-- ============================================================================
-- Summary Statistics
-- ============================================================================

SELECT 
  COUNT(*) AS total_orders,
  SUM(CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) < 0.01 
    THEN 1 ELSE 0 
  END) AS valid_orders,
  SUM(CASE 
    WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) >= 0.01 
    THEN 1 ELSE 0 
  END) AS invalid_orders,
  ROUND(
    SUM(CASE 
      WHEN ABS(order_total - (subtotal + COALESCE(total_gst, 0) + COALESCE(shipping_cost, 0))) < 0.01 
      THEN 1 ELSE 0 
    END)::NUMERIC / COUNT(*) * 100, 
    2
  ) AS valid_percentage
FROM orders;
