-- ================================================================
-- DATABASE TRIGGER FUNCTIONS
-- ================================================================
-- Purpose: Auto-update fields, maintain data consistency
-- Last Updated: January 24, 2026
-- ================================================================

-- ================================================================
-- 1. AUTO-UPDATE TIMESTAMP TRIGGER
-- ================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column() IS
'Automatically update updated_at column to current timestamp on row update.';

-- Apply to tables
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_variants_updated_at ON product_variants;
CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ================================================================
-- 2. AUTO-GENERATE SLUG FROM NAME
-- ================================================================

CREATE OR REPLACE FUNCTION update_product_category_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert name to URL-friendly slug
  -- Example: "Premium Gifts & Awards" -> "premium-gifts-awards"
  NEW.slug = lower(
    regexp_replace(
      regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'),  -- Remove special chars
      '\s+', '-', 'g'  -- Replace spaces with hyphens
    )
  );
  
  -- Trim leading/trailing hyphens
  NEW.slug = trim(both '-' from NEW.slug);
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_product_category_slug() IS
'Automatically generate URL-friendly slug from category name.';

-- Apply to product_categories table (if exists)
DROP TRIGGER IF EXISTS generate_product_category_slug ON product_categories;
CREATE TRIGGER generate_product_category_slug
  BEFORE INSERT OR UPDATE OF name ON product_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_product_category_slug();


-- ================================================================
-- 3. SYNC PRODUCT BASE PRICE ON VARIANT CHANGE
-- ================================================================

CREATE OR REPLACE FUNCTION update_product_price_on_variant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  -- Get product_id from NEW or OLD record
  IF TG_OP = 'DELETE' THEN
    v_product_id = OLD.product_id;
  ELSE
    v_product_id = NEW.product_id;
  END IF;

  -- Update product base_price to minimum variant price
  UPDATE products
  SET base_price = compute_product_base_price(v_product_id)
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_product_price_on_variant_change() IS
'Automatically update product base_price when variant prices change.';

DROP TRIGGER IF EXISTS sync_product_base_price ON product_variants;
CREATE TRIGGER sync_product_base_price
  AFTER INSERT OR UPDATE OF price, is_active OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_price_on_variant_change();


-- ================================================================
-- 4. SYNC PRODUCT STOCK STATUS ON VARIANT CHANGE
-- ================================================================

CREATE OR REPLACE FUNCTION update_product_stock_status_on_variant_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_product_id uuid;
BEGIN
  -- Get product_id from NEW or OLD record
  IF TG_OP = 'DELETE' THEN
    v_product_id = OLD.product_id;
  ELSE
    v_product_id = NEW.product_id;
  END IF;

  -- Update product in_stock status
  UPDATE products
  SET in_stock = compute_product_in_stock(v_product_id)
  WHERE id = v_product_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION update_product_stock_status_on_variant_change() IS
'Automatically update product in_stock status when variant stock changes.';

DROP TRIGGER IF EXISTS sync_product_stock_status ON product_variants;
CREATE TRIGGER sync_product_stock_status
  AFTER INSERT OR UPDATE OF stock_quantity, is_active OR DELETE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_status_on_variant_change();


-- ================================================================
-- 5. PREVENT WRITING TO DEPRECATED JSONB COLUMN
-- ================================================================

CREATE OR REPLACE FUNCTION prevent_order_items_jsonb_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Block writes to deprecated orders.items column
  IF NEW.items IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot write to orders.items (deprecated). Use order_items table instead.';
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION prevent_order_items_jsonb_write() IS
'Prevent writes to deprecated orders.items JSONB column. Enforces use of order_items table.';

DROP TRIGGER IF EXISTS block_legacy_items_column ON orders;
CREATE TRIGGER block_legacy_items_column
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION prevent_order_items_jsonb_write();


-- ================================================================
-- 6. AUTO-CREATE CUSTOMER PROFILE ON USER SIGNUP
-- ================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create customer profile for new auth user
  INSERT INTO customers (
    user_id,
    email,
    name,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.created_at
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Prevent duplicates

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION handle_new_user() IS
'Automatically create customer profile when user signs up via Supabase Auth.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();


-- ================================================================
-- TESTING GUIDE
-- ================================================================

/*
-- 1. Test auto-update timestamp
BEGIN;

INSERT INTO products (id, title, description)
VALUES ('test-product-001', 'Original Title', 'Description');

SELECT created_at, updated_at FROM products WHERE id = 'test-product-001';
-- created_at and updated_at should be equal

-- Wait 2 seconds, then update
SELECT pg_sleep(2);

UPDATE products SET title = 'Updated Title' WHERE id = 'test-product-001';

SELECT created_at, updated_at FROM products WHERE id = 'test-product-001';
-- updated_at should be 2+ seconds after created_at

ROLLBACK;


-- 2. Test slug generation
BEGIN;

INSERT INTO product_categories (name) VALUES ('Premium Gifts & Awards');

SELECT name, slug FROM product_categories WHERE name = 'Premium Gifts & Awards';
-- Expected slug: 'premium-gifts-awards'

ROLLBACK;


-- 3. Test product price sync
BEGIN;

INSERT INTO products (id, title, base_price) VALUES ('test-product-002', 'Test', 0);

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity)
VALUES 
  ('variant-1', 'test-product-002', 'SKU-1', 10000, 5),
  ('variant-2', 'test-product-002', 'SKU-2', 15000, 3);

SELECT base_price FROM products WHERE id = 'test-product-002';
-- Expected: 10000 (auto-synced)

UPDATE product_variants SET price = 8000 WHERE id = 'variant-1';

SELECT base_price FROM products WHERE id = 'test-product-002';
-- Expected: 8000 (auto-updated)

ROLLBACK;


-- 4. Test stock status sync
BEGIN;

INSERT INTO products (id, title, in_stock) VALUES ('test-product-003', 'Test', false);

INSERT INTO product_variants (id, product_id, sku, price, stock_quantity)
VALUES ('variant-3', 'test-product-003', 'SKU-3', 10000, 0);

SELECT in_stock FROM products WHERE id = 'test-product-003';
-- Expected: false

UPDATE product_variants SET stock_quantity = 5 WHERE id = 'variant-3';

SELECT in_stock FROM products WHERE id = 'test-product-003';
-- Expected: true (auto-updated)

ROLLBACK;


-- 5. Test prevent JSONB write
BEGIN;

INSERT INTO orders (user_id, total_price, items)
VALUES (auth.uid(), 1000, '[{"productId": "test"}]');
-- Expected: ERROR - Cannot write to orders.items (deprecated)

ROLLBACK;
*/
