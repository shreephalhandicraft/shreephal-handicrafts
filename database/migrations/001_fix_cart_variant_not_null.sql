-- CRITICAL BUG #1: cart_items.variant_id Should Be NOT NULL
-- ================================================================
-- Problem: Database allows NULL variant_id, but frontend expects it required
-- Impact: Orders fail silently, stock decrement fails, checkout errors
-- Risk: HIGH - Data integrity failure

-- Step 1: Clean existing NULL values (IMPORTANT: Run this first!)
BEGIN;

-- Option A: Delete cart items with NULL variant_id
-- Recommended for production (safer)
DELETE FROM cart_items WHERE variant_id IS NULL;

-- Option B: If you want to preserve data (risky - needs manual intervention)
-- Uncomment this instead of DELETE if you want to investigate first:
-- SELECT * FROM cart_items WHERE variant_id IS NULL;
-- Then manually assign default variants or delete

-- Step 2: Add NOT NULL constraint
ALTER TABLE cart_items 
ALTER COLUMN variant_id SET NOT NULL;

-- Step 3: Add helpful comment
COMMENT ON COLUMN cart_items.variant_id IS 
'Required. Product variant (size/color/etc). Cannot be NULL. Users must select variant before adding to cart.';

COMMIT;

-- Verification Query
-- Run this after migration to confirm:
-- SELECT column_name, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'cart_items' AND column_name = 'variant_id';
-- Expected: is_nullable = 'NO'

-- Rollback (if needed)
-- ALTER TABLE cart_items ALTER COLUMN variant_id DROP NOT NULL;
