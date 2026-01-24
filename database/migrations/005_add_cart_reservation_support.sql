-- ================================================================
-- MIGRATION 005: Add Stock Reservation Support to Cart
-- ================================================================
-- Purpose: Link cart items to stock reservations
-- Date: January 24, 2026
-- Status: ✅ APPLIED
-- ================================================================

BEGIN;

-- ================================================================
-- 1. ADD RESERVATION_ID COLUMN
-- ================================================================

ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS reservation_id uuid;

-- ================================================================
-- 2. ADD FOREIGN KEY CONSTRAINT
-- ================================================================

ALTER TABLE cart_items
ADD CONSTRAINT fk_cart_items_reservation
FOREIGN KEY (reservation_id) 
REFERENCES stock_reservations(id)
ON DELETE SET NULL;  -- If reservation deleted, set cart item reservation_id to NULL

-- ================================================================
-- 3. ADD INDEX FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_cart_items_reservation_id
ON cart_items(reservation_id)
WHERE reservation_id IS NOT NULL;

-- ================================================================
-- 4. ADD COLUMN COMMENT
-- ================================================================

COMMENT ON COLUMN cart_items.reservation_id IS
'Links cart item to stock reservation in stock_reservations table. 
Reservation expires in 15 minutes if not confirmed during checkout.
NULL means no active reservation (legacy cart items or reservation expired).';

-- ================================================================
-- 5. VERIFY CHANGES
-- ================================================================

-- Show updated schema
DO $$
DECLARE
  v_column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' AND column_name = 'reservation_id'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✅ Migration 005 successful: reservation_id column added to cart_items';
  ELSE
    RAISE EXCEPTION '❌ Migration 005 failed: reservation_id column not found';
  END IF;
END $$;

COMMIT;

-- ================================================================
-- VERIFICATION QUERY (Run to confirm)
-- ================================================================
/*
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
AND column_name = 'reservation_id';

-- Expected output:
-- column_name: reservation_id
-- data_type: uuid
-- is_nullable: YES
*/

-- ================================================================
-- ROLLBACK (if needed)
-- ================================================================
/*
BEGIN;
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS fk_cart_items_reservation;
DROP INDEX IF EXISTS idx_cart_items_reservation_id;
ALTER TABLE cart_items DROP COLUMN IF EXISTS reservation_id;
COMMIT;
*/
