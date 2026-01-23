-- CRITICAL BUG #2: Stock Decrement Race Condition Fix
-- ================================================================
-- Problem: Read-then-update allows 2 users to buy last item simultaneously
-- Impact: Overselling products, negative stock, customer disputes
-- Risk: CRITICAL at scale (10+ concurrent checkouts)

-- Solution: Atomic stock decrement function with row-level locking

BEGIN;

-- Drop existing function if it exists (for clean migration)
DROP FUNCTION IF EXISTS decrement_variant_stock(uuid, integer);

-- Create race-condition-safe stock decrement function
CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_stock integer;
BEGIN
  -- ✅ SELECT FOR UPDATE locks the row (prevents concurrent reads)
  SELECT stock_quantity INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE; -- 🔒 Critical: Row-level lock

  -- Check if variant exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found: %', p_variant_id;
  END IF;

  -- Check if enough stock
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
  END IF;

  -- ✅ Atomic update (within same transaction as SELECT FOR UPDATE)
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id;

  RETURN true;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION decrement_variant_stock(uuid, integer) IS
'Atomically decrements stock with row-level locking to prevent race conditions. Returns true on success, throws exception on insufficient stock.';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION decrement_variant_stock(uuid, integer) TO authenticated;

COMMIT;

-- Verification Test
-- Run this to test the function:
/*
BEGIN;
-- Get a variant with stock
SELECT id, stock_quantity FROM product_variants WHERE stock_quantity > 0 LIMIT 1;

-- Test decrement (replace with actual variant_id)
SELECT decrement_variant_stock('your-variant-id-here', 1);

-- Verify stock decreased
SELECT id, stock_quantity FROM product_variants WHERE id = 'your-variant-id-here';

ROLLBACK; -- Don't commit test
*/

-- Concurrent Test (Open 2 psql windows and run simultaneously):
/*
Window 1:
BEGIN;
SELECT decrement_variant_stock('variant-with-1-stock', 1);
-- Wait 5 seconds
COMMIT;

Window 2 (run immediately after Window 1 starts):
BEGIN;
SELECT decrement_variant_stock('same-variant-id', 1);
-- Should wait for Window 1 to commit, then fail with insufficient stock
COMMIT;
*/
