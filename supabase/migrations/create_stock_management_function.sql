-- ====================================
-- STOCK MANAGEMENT FUNCTION
-- ====================================
-- This function atomically decrements product stock
-- and prevents race conditions using row-level locking

CREATE OR REPLACE FUNCTION decrement_product_stock(
  variant_id UUID,
  quantity INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock with row lock (prevents concurrent updates)
  SELECT stock_quantity INTO current_stock
  FROM product_variants
  WHERE id = variant_id
  FOR UPDATE;

  -- Check if variant exists
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product variant not found: %', variant_id;
  END IF;

  -- Check if enough stock is available
  IF current_stock < quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_stock, quantity;
  END IF;

  -- Decrement stock atomically
  UPDATE product_variants
  SET 
    stock_quantity = stock_quantity - quantity,
    updated_at = NOW()
  WHERE id = variant_id;

  -- Return success
  RETURN TRUE;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and re-raise
    RAISE;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO anon;

-- ====================================
-- COMMENTS FOR DOCUMENTATION
-- ====================================
COMMENT ON FUNCTION decrement_product_stock IS 'Atomically decrements product variant stock quantity with row locking to prevent race conditions';
