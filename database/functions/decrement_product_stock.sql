-- ============================================================================
-- FUNCTION: decrement_product_stock
-- PURPOSE: Atomically decrement product stock with validation
-- USAGE: Called after successful order creation to reduce stock
-- ============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS decrement_product_stock(UUID, INTEGER);

-- Create the function
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_variant_id UUID,
  p_quantity INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  -- Validate quantity is positive
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Quantity must be positive',
      'error_code', 'INVALID_QUANTITY'
    );
  END IF;

  -- Get current stock with row lock (prevents race conditions)
  SELECT stock_quantity INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  -- Check if variant exists
  IF v_current_stock IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Product variant not found',
      'error_code', 'VARIANT_NOT_FOUND'
    );
  END IF;

  -- Check if enough stock available
  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Insufficient stock',
      'error_code', 'INSUFFICIENT_STOCK',
      'available', v_current_stock,
      'requested', p_quantity
    );
  END IF;

  -- Calculate new stock
  v_new_stock := v_current_stock - p_quantity;

  -- Decrement stock
  UPDATE product_variants
  SET 
    stock_quantity = v_new_stock,
    updated_at = NOW()
  WHERE id = p_variant_id;

  -- Return success
  RETURN jsonb_build_object(
    'success', TRUE,
    'previous_stock', v_current_stock,
    'new_stock', v_new_stock,
    'decremented', p_quantity
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Handle any unexpected errors
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'error_code', 'UNKNOWN_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;

-- ============================================================================
-- USAGE EXAMPLES:
-- ============================================================================

-- Example 1: Successful decrement
-- SELECT decrement_product_stock('variant-uuid-here', 2);
-- Returns: {"success": true, "previous_stock": 10, "new_stock": 8, "decremented": 2}

-- Example 2: Insufficient stock
-- SELECT decrement_product_stock('variant-uuid-here', 100);
-- Returns: {"success": false, "error": "Insufficient stock", "error_code": "INSUFFICIENT_STOCK", "available": 5, "requested": 100}

-- Example 3: Invalid quantity
-- SELECT decrement_product_stock('variant-uuid-here', -1);
-- Returns: {"success": false, "error": "Quantity must be positive", "error_code": "INVALID_QUANTITY"}
