-- CRITICAL BUG #3: Payment Idempotency Not Enforced
-- ================================================================
-- Problem: Retry/network issues can create duplicate orders for same payment
-- Impact: Double-charging users, duplicate orders, stock corruption
-- Risk: CRITICAL - Legal liability, refund disputes

-- Solution: Add unique constraint on transaction_id + idempotency checks

BEGIN;

-- Step 1: Clean existing duplicate transaction_ids (if any)
-- Find duplicates first:
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT transaction_id
    FROM orders
    WHERE transaction_id IS NOT NULL
    GROUP BY transaction_id
    HAVING COUNT(*) > 1
  ) AS dupes;

  IF duplicate_count > 0 THEN
    RAISE WARNING 'Found % duplicate transaction_ids. Manual review required before adding constraint.', duplicate_count;
    RAISE WARNING 'Run: SELECT transaction_id, COUNT(*) FROM orders WHERE transaction_id IS NOT NULL GROUP BY transaction_id HAVING COUNT(*) > 1;';
  ELSE
    RAISE NOTICE 'No duplicate transaction_ids found. Safe to add constraint.';
  END IF;
END $$;

-- Step 2: Add unique constraint (will fail if duplicates exist)
-- If this fails, manually resolve duplicates first
ALTER TABLE orders
ADD CONSTRAINT unique_transaction_id UNIQUE (transaction_id);

-- Step 3: Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id 
ON orders(transaction_id) 
WHERE transaction_id IS NOT NULL;

-- Step 4: Add helpful comment
COMMENT ON CONSTRAINT unique_transaction_id ON orders IS
'Ensures each payment transaction can only create one order (idempotency). Prevents double-charging during retries.';

COMMIT;

-- Verification Query
-- Run this after migration:
/*
SELECT
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'orders'
AND constraint_name = 'unique_transaction_id';
-- Expected: 1 row with constraint_type = 'UNIQUE'
*/

-- Test Idempotency (should fail on second insert)
/*
BEGIN;
-- First insert (should succeed)
INSERT INTO orders (user_id, transaction_id, total_amount, order_status, payment_status)
VALUES ('some-user-id', 'test_txn_12345', 100, 'pending', 'completed');

-- Second insert with same transaction_id (should fail)
INSERT INTO orders (user_id, transaction_id, total_amount, order_status, payment_status)
VALUES ('some-user-id', 'test_txn_12345', 100, 'pending', 'completed');
-- Expected: ERROR: duplicate key value violates unique constraint "unique_transaction_id"

ROLLBACK; -- Don't commit test
*/

-- Rollback (if needed)
-- ALTER TABLE orders DROP CONSTRAINT IF EXISTS unique_transaction_id;
-- DROP INDEX IF EXISTS idx_orders_transaction_id;
