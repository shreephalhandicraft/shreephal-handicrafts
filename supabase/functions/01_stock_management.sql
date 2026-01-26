-- ================================================================
-- STOCK MANAGEMENT FUNCTIONS
-- ================================================================
-- Purpose: Handle inventory, reservations, and stock operations
-- Last Updated: January 24, 2026
-- ================================================================

-- ================================================================
-- 1. ATOMIC STOCK DECREMENT (CRITICAL - PREVENTS OVERSELLING)
-- ================================================================

CREATE OR REPLACE FUNCTION decrement_variant_stock(
  p_variant_id uuid,
  p_quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock integer;
BEGIN
  -- Input validation
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive. Received: %', p_quantity;
  END IF;

  -- 🔒 CRITICAL: Row-level lock prevents race conditions
  -- This ensures only ONE transaction can decrement stock at a time
  SELECT stock_quantity INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;  -- Lock the row until transaction commits

  -- Check if variant exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found: %', p_variant_id;
  END IF;

  -- Check if enough stock available
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', 
      v_current_stock, p_quantity;
  END IF;

  -- ✅ Atomic update (within same transaction as SELECT FOR UPDATE)
  UPDATE product_variants
  SET 
    stock_quantity = stock_quantity - p_quantity,
    updated_at = NOW()
  WHERE id = p_variant_id;

  -- Log the stock change (optional - for audit trail)
  INSERT INTO stock_history (variant_id, change_amount, change_type, created_at)
  VALUES (p_variant_id, -p_quantity, 'decrement', NOW())
  ON CONFLICT DO NOTHING; -- Ignore if table doesn't exist

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise with detailed error message
    RAISE EXCEPTION 'Stock decrement failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION decrement_variant_stock(uuid, integer) IS
'Atomically decrements stock with row-level locking to prevent race conditions. 
Use this function during checkout to ensure accurate stock management.
Returns true on success, throws exception on insufficient stock or errors.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION decrement_variant_stock(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_variant_stock(uuid, integer) TO service_role;


-- ================================================================
-- 2. STOCK RESERVATION SYSTEM
-- ================================================================

-- Create stock reservations table (if not exists)
CREATE TABLE IF NOT EXISTS stock_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES product_variants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  expires_at timestamp NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  confirmed boolean DEFAULT false,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- Index for efficient cleanup
CREATE INDEX IF NOT EXISTS idx_stock_reservations_expires 
  ON stock_reservations(expires_at) WHERE confirmed = false;

CREATE INDEX IF NOT EXISTS idx_stock_reservations_user 
  ON stock_reservations(user_id);


-- Reserve stock temporarily
CREATE OR REPLACE FUNCTION reserve_variant_stock(
  p_variant_id uuid,
  p_user_id uuid,
  p_quantity integer,
  p_order_id uuid DEFAULT NULL
)
RETURNS uuid  -- Returns reservation_id
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id uuid;
  v_current_stock integer;
  v_reserved_stock integer;
BEGIN
  -- Input validation
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantity must be positive';
  END IF;

  -- Lock variant row
  SELECT stock_quantity INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found: %', p_variant_id;
  END IF;

  -- Calculate currently reserved stock (not yet confirmed)
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM stock_reservations
  WHERE variant_id = p_variant_id
  AND confirmed = false
  AND expires_at > NOW();

  -- Check if enough stock available (considering existing reservations)
  IF (v_current_stock - v_reserved_stock) < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %, Reserved: %',
      v_current_stock, p_quantity, v_reserved_stock;
  END IF;

  -- Create reservation
  INSERT INTO stock_reservations (
    variant_id,
    user_id,
    order_id,
    quantity,
    expires_at
  ) VALUES (
    p_variant_id,
    p_user_id,
    p_order_id,
    p_quantity,
    NOW() + INTERVAL '15 minutes'
  )
  RETURNING id INTO v_reservation_id;

  RETURN v_reservation_id;
END;
$$;

COMMENT ON FUNCTION reserve_variant_stock(uuid, uuid, integer, uuid) IS
'Temporarily reserve stock for a user (expires in 15 minutes). 
Use when adding items to cart. Returns reservation_id for later confirmation.';

GRANT EXECUTE ON FUNCTION reserve_variant_stock(uuid, uuid, integer, uuid) TO authenticated;


-- Confirm stock reservation
CREATE OR REPLACE FUNCTION confirm_stock_reservation(
  p_reservation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation record;
BEGIN
  -- Get reservation details
  SELECT * INTO v_reservation
  FROM stock_reservations
  WHERE id = p_reservation_id
  FOR UPDATE;  -- Lock reservation

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found: %', p_reservation_id;
  END IF;

  -- Check if already confirmed
  IF v_reservation.confirmed THEN
    RAISE NOTICE 'Reservation already confirmed';
    RETURN true;
  END IF;

  -- Check if expired
  IF v_reservation.expires_at < NOW() THEN
    RAISE EXCEPTION 'Reservation expired at %', v_reservation.expires_at;
  END IF;

  -- Decrement actual stock
  PERFORM decrement_variant_stock(
    v_reservation.variant_id,
    v_reservation.quantity
  );

  -- Mark reservation as confirmed
  UPDATE stock_reservations
  SET 
    confirmed = true,
    updated_at = NOW()
  WHERE id = p_reservation_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Reservation confirmation failed: %', SQLERRM;
END;
$$;

COMMENT ON FUNCTION confirm_stock_reservation(uuid) IS
'Confirm a stock reservation and decrement actual stock. 
Use during checkout completion.';

GRANT EXECUTE ON FUNCTION confirm_stock_reservation(uuid) TO authenticated;


-- Expire old reservations (cron job)
CREATE OR REPLACE FUNCTION expire_old_stock_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM stock_reservations
  WHERE expires_at < NOW()
  AND confirmed = false;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE 'Expired % reservations', v_deleted_count;
  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION expire_old_stock_reservations() IS
'Delete expired stock reservations (cron job - run every 5 minutes). 
Returns count of deleted reservations.';

GRANT EXECUTE ON FUNCTION expire_old_stock_reservations() TO authenticated;
GRANT EXECUTE ON FUNCTION expire_old_stock_reservations() TO service_role;


-- ================================================================
-- 3. LEGACY FUNCTION (DEPRECATED)
-- ================================================================

-- Old stock decrement (kept for backward compatibility)
CREATE OR REPLACE FUNCTION decrement_product_stock(
  variant_id uuid,
  quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result boolean;
BEGIN
  -- ⚠️ DEPRECATED: Use decrement_variant_stock() instead
  -- This wrapper exists for backward compatibility only
  
  v_result := decrement_variant_stock(variant_id, quantity);
  
  RETURN jsonb_build_object(
    'success', v_result,
    'message', 'Stock decremented successfully',
    'deprecated', true,
    'use_instead', 'decrement_variant_stock()'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'deprecated', true
    );
END;
$$;

COMMENT ON FUNCTION decrement_product_stock(uuid, integer) IS
'⚠️ DEPRECATED: Use decrement_variant_stock() instead. 
This function exists for backward compatibility only.';


-- ================================================================
-- SETUP CRON JOB (Run in Supabase SQL Editor)
-- ================================================================

/*
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job (every 5 minutes)
SELECT cron.schedule(
  'expire-stock-reservations',     -- Job name
  '*/5 * * * *',                    -- Cron schedule (every 5 minutes)
  'SELECT expire_old_stock_reservations();'
);

-- Check scheduled jobs
SELECT * FROM cron.job;

-- Remove job (if needed)
SELECT cron.unschedule('expire-stock-reservations');
*/


-- ================================================================
-- TESTING GUIDE
-- ================================================================

/*
-- 1. Test atomic stock decrement
BEGIN;

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity)
VALUES (
  'test-variant-001',
  'test-product-001',
  'TEST-SKU',
  1000,
  10
);

SELECT decrement_variant_stock('test-variant-001', 3);
-- Expected: true

SELECT stock_quantity FROM product_variants WHERE id = 'test-variant-001';
-- Expected: 7

ROLLBACK;


-- 2. Test insufficient stock error
BEGIN;

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity)
VALUES ('test-variant-002', 'test-product-002', 'TEST-SKU-2', 1000, 2);

SELECT decrement_variant_stock('test-variant-002', 5);
-- Expected: ERROR - Insufficient stock. Available: 2, Requested: 5

ROLLBACK;


-- 3. Test stock reservation
BEGIN;

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity)
VALUES ('test-variant-003', 'test-product-003', 'TEST-SKU-3', 1000, 5);

-- Reserve stock
SELECT reserve_variant_stock(
  'test-variant-003',
  auth.uid(),
  2,
  NULL
) AS reservation_id \gset

SELECT * FROM stock_reservations WHERE id = :'reservation_id';

-- Confirm reservation
SELECT confirm_stock_reservation(:'reservation_id');

SELECT stock_quantity FROM product_variants WHERE id = 'test-variant-003';
-- Expected: 3

ROLLBACK;


-- 4. Test concurrent access (requires 2 terminals)
-- Terminal 1:
BEGIN;
SELECT decrement_variant_stock('variant-with-1-stock', 1);
-- Wait 10 seconds
COMMIT;

-- Terminal 2 (run immediately):
BEGIN;
SELECT decrement_variant_stock('same-variant-id', 1);
-- Should wait for Terminal 1, then fail with insufficient stock
COMMIT;
*/
