-- ================================================================
-- PRODUCT CALCULATION FUNCTIONS
-- ================================================================
-- Purpose: Compute product prices, stock status, and related data
-- Last Updated: January 24, 2026
-- ================================================================

-- ================================================================
-- 1. COMPUTE PRODUCT BASE PRICE
-- ================================================================

CREATE OR REPLACE FUNCTION compute_product_base_price(
  product_uuid uuid
)
RETURNS integer
LANGUAGE plpgsql
STABLE  -- Function result doesn't change within a transaction
AS $$
DECLARE
  v_min_price integer;
BEGIN
  -- Get minimum price from all active variants
  SELECT MIN(price) INTO v_min_price
  FROM product_variants
  WHERE product_id = product_uuid
  AND is_active = true;

  -- Return 0 if no variants found
  RETURN COALESCE(v_min_price, 0);
END;
$$;

COMMENT ON FUNCTION compute_product_base_price(uuid) IS
'Calculate the minimum price across all active variants of a product. 
Returns price in smallest currency unit (paise). Returns 0 if no variants found.';

GRANT EXECUTE ON FUNCTION compute_product_base_price(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION compute_product_base_price(uuid) TO anon;


-- ================================================================
-- 2. COMPUTE PRODUCT STOCK STATUS
-- ================================================================

CREATE OR REPLACE FUNCTION compute_product_in_stock(
  product_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  -- Check if ANY active variant has stock > 0
  RETURN EXISTS (
    SELECT 1
    FROM product_variants
    WHERE product_id = product_uuid
    AND stock_quantity > 0
    AND is_active = true
  );
END;
$$;

COMMENT ON FUNCTION compute_product_in_stock(uuid) IS
'Check if any active variant of a product is in stock. 
Returns true if at least one variant has stock_quantity > 0.';

GRANT EXECUTE ON FUNCTION compute_product_in_stock(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION compute_product_in_stock(uuid) TO anon;


-- ================================================================
-- 3. GET PRODUCT VARIANT SUMMARY (Bonus Helper)
-- ================================================================

CREATE OR REPLACE FUNCTION get_product_variant_summary(
  product_uuid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_variants', COUNT(*),
    'active_variants', COUNT(*) FILTER (WHERE is_active = true),
    'in_stock_variants', COUNT(*) FILTER (WHERE stock_quantity > 0 AND is_active = true),
    'min_price', MIN(price) FILTER (WHERE is_active = true),
    'max_price', MAX(price) FILTER (WHERE is_active = true),
    'total_stock', SUM(stock_quantity) FILTER (WHERE is_active = true),
    'price_range', CASE
      WHEN MIN(price) = MAX(price) THEN jsonb_build_object('single', MIN(price))
      ELSE jsonb_build_object('min', MIN(price), 'max', MAX(price))
    END
  ) INTO v_summary
  FROM product_variants
  WHERE product_id = product_uuid;

  RETURN COALESCE(v_summary, '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION get_product_variant_summary(uuid) IS
'Get comprehensive summary of product variants including price range, stock counts, etc. 
Useful for product listing pages.';

GRANT EXECUTE ON FUNCTION get_product_variant_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_variant_summary(uuid) TO anon;


-- ================================================================
-- TESTING GUIDE
-- ================================================================

/*
-- 1. Test compute_product_base_price
BEGIN;

INSERT INTO products (id, title, description)
VALUES ('test-product-001', 'Test Product', 'Description');

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity, is_active)
VALUES 
  ('variant-1', 'test-product-001', 'SKU-1', 10000, 5, true),
  ('variant-2', 'test-product-001', 'SKU-2', 15000, 3, true),
  ('variant-3', 'test-product-001', 'SKU-3', 8000, 0, true);

SELECT compute_product_base_price('test-product-001');
-- Expected: 8000 (minimum price)

ROLLBACK;


-- 2. Test compute_product_in_stock
BEGIN;

INSERT INTO products (id, title, description)
VALUES ('test-product-002', 'Test Product 2', 'Description');

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity, is_active)
VALUES 
  ('variant-4', 'test-product-002', 'SKU-4', 10000, 0, true),
  ('variant-5', 'test-product-002', 'SKU-5', 15000, 0, true);

SELECT compute_product_in_stock('test-product-002');
-- Expected: false (all variants out of stock)

-- Add stock to one variant
UPDATE product_variants SET stock_quantity = 5 WHERE id = 'variant-4';

SELECT compute_product_in_stock('test-product-002');
-- Expected: true

ROLLBACK;


-- 3. Test get_product_variant_summary
BEGIN;

INSERT INTO products (id, title, description)
VALUES ('test-product-003', 'Test Product 3', 'Description');

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity, is_active)
VALUES 
  ('variant-6', 'test-product-003', 'SKU-6', 10000, 5, true),
  ('variant-7', 'test-product-003', 'SKU-7', 20000, 3, true),
  ('variant-8', 'test-product-003', 'SKU-8', 15000, 0, false);

SELECT get_product_variant_summary('test-product-003');
-- Expected: 
-- {
--   "total_variants": 3,
--   "active_variants": 2,
--   "in_stock_variants": 2,
--   "min_price": 10000,
--   "max_price": 20000,
--   "total_stock": 8,
--   "price_range": {"min": 10000, "max": 20000}
-- }

ROLLBACK;
*/
