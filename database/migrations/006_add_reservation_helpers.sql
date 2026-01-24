-- ================================================================
-- MIGRATION 006: Add Reservation Helper Functions
-- ================================================================
-- Purpose: Utility functions for reservation management
-- Date: January 24, 2026
-- Status: ✅ APPLIED
-- ================================================================

BEGIN;

-- ================================================================
-- 1. GET AVAILABLE STOCK (Total - Reserved)
-- ================================================================

CREATE OR REPLACE FUNCTION get_available_stock(
  p_variant_id uuid
)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_total_stock integer;
  v_reserved_stock integer;
BEGIN
  -- Get total stock
  SELECT stock_quantity INTO v_total_stock
  FROM product_variants
  WHERE id = p_variant_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant not found: %', p_variant_id;
  END IF;
  
  -- Calculate reserved stock (unconfirmed, not expired)
  SELECT COALESCE(SUM(quantity), 0) INTO v_reserved_stock
  FROM stock_reservations
  WHERE variant_id = p_variant_id
  AND confirmed = false
  AND expires_at > NOW();
  
  -- Return available = total - reserved (minimum 0)
  RETURN GREATEST(v_total_stock - v_reserved_stock, 0);
END;
$$;

COMMENT ON FUNCTION get_available_stock(uuid) IS
'Get real-time available stock (total stock - active reservations). 
Use for product pages to show accurate availability.
Example: SELECT get_available_stock(''variant-uuid'');';

GRANT EXECUTE ON FUNCTION get_available_stock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_stock(uuid) TO anon;


-- ================================================================
-- 2. EXTEND RESERVATION (Add more time)
-- ================================================================

CREATE OR REPLACE FUNCTION extend_reservation(
  p_reservation_id uuid,
  p_extension_minutes integer DEFAULT 15
)
RETURNS timestamp
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_expiry timestamp;
BEGIN
  -- Validate extension minutes
  IF p_extension_minutes <= 0 OR p_extension_minutes > 60 THEN
    RAISE EXCEPTION 'Extension must be between 1-60 minutes. Received: %', 
      p_extension_minutes;
  END IF;

  -- Update expiry time
  UPDATE stock_reservations
  SET 
    expires_at = NOW() + (p_extension_minutes || ' minutes')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_reservation_id
  AND confirmed = false  -- Can't extend confirmed reservations
  AND expires_at > NOW()  -- Must not be expired already
  RETURNING expires_at INTO v_new_expiry;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation not found, already confirmed, or expired: %', 
      p_reservation_id;
  END IF;
  
  RETURN v_new_expiry;
END;
$$;

COMMENT ON FUNCTION extend_reservation(uuid, integer) IS
'Extend reservation expiry time (default: +15 minutes, max: 60 minutes). 
Use before checkout or when user is actively viewing cart.
Example: SELECT extend_reservation(''reservation-uuid'', 10);';

GRANT EXECUTE ON FUNCTION extend_reservation(uuid, integer) TO authenticated;


-- ================================================================
-- 3. CANCEL RESERVATION (Delete/Release Stock)
-- ================================================================

CREATE OR REPLACE FUNCTION cancel_reservation(
  p_reservation_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted boolean;
BEGIN
  -- Delete reservation (releases stock immediately)
  DELETE FROM stock_reservations
  WHERE id = p_reservation_id
  AND confirmed = false  -- Can't cancel confirmed reservations
  RETURNING true INTO v_deleted;
  
  IF v_deleted IS NULL THEN
    -- Reservation not found or already confirmed
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

COMMENT ON FUNCTION cancel_reservation(uuid) IS
'Cancel/delete a reservation (releases stock immediately). 
Use when user removes item from cart. Returns false if not found or already confirmed.
Example: SELECT cancel_reservation(''reservation-uuid'');';

GRANT EXECUTE ON FUNCTION cancel_reservation(uuid) TO authenticated;


-- ================================================================
-- 4. CHECK RESERVATION STATUS (Detailed Info)
-- ================================================================

CREATE OR REPLACE FUNCTION check_reservation_status(
  p_reservation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_reservation record;
  v_time_remaining interval;
  v_seconds_remaining integer;
BEGIN
  -- Get reservation details
  SELECT * INTO v_reservation
  FROM stock_reservations
  WHERE id = p_reservation_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'exists', false,
      'error', 'Reservation not found'
    );
  END IF;
  
  -- Calculate time remaining
  v_time_remaining := v_reservation.expires_at - NOW();
  v_seconds_remaining := EXTRACT(EPOCH FROM v_time_remaining)::integer;
  
  RETURN jsonb_build_object(
    'exists', true,
    'reservation_id', v_reservation.id,
    'variant_id', v_reservation.variant_id,
    'user_id', v_reservation.user_id,
    'quantity', v_reservation.quantity,
    'confirmed', v_reservation.confirmed,
    'expires_at', v_reservation.expires_at,
    'created_at', v_reservation.created_at,
    'is_expired', (v_reservation.expires_at < NOW()),
    'time_remaining_seconds', v_seconds_remaining,
    'time_remaining_minutes', ROUND(v_seconds_remaining / 60.0, 1),
    'time_remaining_readable', 
      CASE 
        WHEN v_seconds_remaining < 0 THEN 'Expired'
        WHEN v_seconds_remaining < 60 THEN v_seconds_remaining || ' seconds'
        WHEN v_seconds_remaining < 3600 THEN 
          (v_seconds_remaining / 60) || ' minutes'
        ELSE 
          (v_seconds_remaining / 3600) || ' hours'
      END
  );
END;
$$;

COMMENT ON FUNCTION check_reservation_status(uuid) IS
'Get detailed reservation status including time remaining. 
Use for displaying countdown timers in cart UI.
Example: SELECT check_reservation_status(''reservation-uuid'');';

GRANT EXECUTE ON FUNCTION check_reservation_status(uuid) TO authenticated;


-- ================================================================
-- 5. BATCH CONFIRM RESERVATIONS (Atomic Checkout)
-- ================================================================

CREATE OR REPLACE FUNCTION confirm_multiple_reservations(
  p_reservation_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id uuid;
  v_confirmed_count integer := 0;
  v_failed_count integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_result boolean;
BEGIN
  -- Validate input
  IF p_reservation_ids IS NULL OR array_length(p_reservation_ids, 1) = 0 THEN
    RAISE EXCEPTION 'Reservation IDs array cannot be empty';
  END IF;

  -- Loop through all reservation IDs
  FOREACH v_reservation_id IN ARRAY p_reservation_ids
  LOOP
    BEGIN
      -- Try to confirm each reservation atomically
      v_result := confirm_stock_reservation(v_reservation_id);
      v_confirmed_count := v_confirmed_count + 1;
      
    EXCEPTION WHEN OTHERS THEN
      -- Capture error details
      v_failed_count := v_failed_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'reservation_id', v_reservation_id,
        'error', SQLERRM
      );
    END;
  END LOOP;
  
  -- If ANY failed, raise exception (triggers rollback of ALL changes)
  IF v_failed_count > 0 THEN
    RAISE EXCEPTION 'Batch confirmation failed. Errors: %', v_errors::text;
  END IF;
  
  -- All succeeded
  RETURN jsonb_build_object(
    'success', true,
    'confirmed_count', v_confirmed_count,
    'failed_count', 0,
    'reservation_ids', p_reservation_ids
  );
END;
$$;

COMMENT ON FUNCTION confirm_multiple_reservations(uuid[]) IS
'Confirm multiple reservations atomically (all-or-nothing). 
Use during checkout to confirm entire cart at once.
Example: SELECT confirm_multiple_reservations(ARRAY[''uuid1'', ''uuid2'']::uuid[]);';

GRANT EXECUTE ON FUNCTION confirm_multiple_reservations(uuid[]) TO authenticated;

COMMIT;

-- ================================================================
-- VERIFICATION (Run to confirm)
-- ================================================================
/*
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname IN (
  'get_available_stock',
  'extend_reservation',
  'cancel_reservation',
  'check_reservation_status',
  'confirm_multiple_reservations'
)
ORDER BY proname;

-- Expected: 5 rows
*/

-- ================================================================
-- TESTING EXAMPLES
-- ================================================================
/*
-- Test get_available_stock
SELECT get_available_stock('variant-uuid');

-- Test extend_reservation
SELECT extend_reservation('reservation-uuid', 20);

-- Test check_reservation_status
SELECT check_reservation_status('reservation-uuid');

-- Test cancel_reservation
SELECT cancel_reservation('reservation-uuid');

-- Test batch confirm
SELECT confirm_multiple_reservations(ARRAY[
  'reservation-uuid-1',
  'reservation-uuid-2'
]::uuid[]);
*/
