# 📚 Database Functions Reference

**Last Updated:** January 24, 2026  
**Total Functions:** 15  
**Purpose:** Complete reference for all database functions, triggers, and stored procedures

---

## 📖 Table of Contents

### Core Functions
1. [Stock Management](#1-stock-management)
2. [Order Processing](#2-order-processing)
3. [Product Calculations](#3-product-calculations)
4. [Data Migration](#4-data-migration)
5. [Triggers](#5-triggers)

---

## 1. Stock Management

### 1.1 `decrement_variant_stock()` 🔒 **CRITICAL**

**Purpose:** Atomically decrements stock with row-level locking to prevent overselling (race conditions)

**Signature:**
```sql
CREATE FUNCTION decrement_variant_stock(
  p_variant_id uuid,
  p_quantity integer
) RETURNS boolean
```

**Usage:**
```javascript
// Frontend (JavaScript/TypeScript)
const { data, error } = await supabase.rpc('decrement_variant_stock', {
  p_variant_id: 'variant-uuid-here',
  p_quantity: 2
});

if (error) {
  console.error('Stock decrement failed:', error.message);
  // Error messages:
  // - "Variant not found: <uuid>"
  // - "Insufficient stock. Available: X, Requested: Y"
}
```

**SQL Direct Call:**
```sql
SELECT decrement_variant_stock(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  1
);
-- Returns: true (success) or raises exception
```

**How It Works:**
```sql
BEGIN
  -- 🔒 Lock the row (prevents concurrent reads)
  SELECT stock_quantity INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;
  
  -- Check stock availability
  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;
  
  -- Atomic update
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id;
  
  RETURN true;
END;
```

**Race Condition Prevention:**
```
User A                          User B
------------------------------------------------
Call function                   Call function
Lock row 🔒                      Wait for lock...
Read stock: 1                   (Still waiting)
Update stock: 0                 (Still waiting)
Commit & release lock 🔓         Lock acquired 🔒
                                Read stock: 0
                                Check: 0 < 1 ❌
                                Throw exception
                                User B sees "Out of stock" ✅
```

**When to Use:**
- ✅ During checkout (before payment)
- ✅ When confirming orders
- ✅ Admin manual stock adjustments

**When NOT to Use:**
- ❌ During cart updates (use `reserve_variant_stock` instead)
- ❌ For display purposes (query `product_variants` directly)

---

### 1.2 `decrement_product_stock()` ⚠️ **LEGACY**

**Purpose:** Old stock decrement function (kept for backward compatibility)

**Signature:**
```sql
CREATE FUNCTION decrement_product_stock(
  variant_id uuid,
  quantity integer
) RETURNS jsonb
```

**Status:** ⚠️ **DEPRECATED** - Use `decrement_variant_stock()` instead

**Migration Guide:**
```javascript
// OLD (don't use):
const { data } = await supabase.rpc('decrement_product_stock', {
  variant_id: 'uuid',
  quantity: 1
});

// NEW (use this):
const { data } = await supabase.rpc('decrement_variant_stock', {
  p_variant_id: 'uuid',
  p_quantity: 1
});
```

---

### 1.3 `reserve_variant_stock()`

**Purpose:** Reserve stock temporarily (for cart items, expires after timeout)

**Signature:**
```sql
CREATE FUNCTION reserve_variant_stock(
  p_variant_id uuid,
  p_user_id uuid,
  p_quantity integer,
  p_order_id uuid DEFAULT NULL
) RETURNS uuid  -- Returns reservation_id
```

**Usage:**
```javascript
// Reserve stock when adding to cart
const { data: reservationId, error } = await supabase.rpc('reserve_variant_stock', {
  p_variant_id: variantId,
  p_user_id: user.id,
  p_quantity: 2,
  p_order_id: null  // Optional: link to order
});

// Store reservation ID for later confirmation
localStorage.setItem('reservationId', reservationId);
```

**Flow:**
```
1. User adds item to cart → reserve_variant_stock()
2. Stock reserved for 15 minutes
3. User proceeds to checkout → confirm_stock_reservation()
4. OR timeout expires → expire_old_stock_reservations() (cron job)
```

**Database Table:**
```sql
CREATE TABLE stock_reservations (
  id uuid PRIMARY KEY,
  variant_id uuid REFERENCES product_variants(id),
  user_id uuid,
  quantity integer,
  order_id uuid,
  expires_at timestamp DEFAULT NOW() + INTERVAL '15 minutes',
  confirmed boolean DEFAULT false,
  created_at timestamp DEFAULT NOW()
);
```

---

### 1.4 `confirm_stock_reservation()`

**Purpose:** Confirm a stock reservation (convert to actual stock decrement)

**Signature:**
```sql
CREATE FUNCTION confirm_stock_reservation(
  p_reservation_id uuid
) RETURNS boolean
```

**Usage:**
```javascript
// During checkout confirmation
const reservationId = localStorage.getItem('reservationId');

const { data, error } = await supabase.rpc('confirm_stock_reservation', {
  p_reservation_id: reservationId
});

if (data === true) {
  // Reservation confirmed, stock decremented
  // Proceed with payment
}
```

**How It Works:**
```sql
BEGIN
  -- Mark reservation as confirmed
  UPDATE stock_reservations
  SET confirmed = true
  WHERE id = p_reservation_id;
  
  -- Decrement actual stock
  UPDATE product_variants
  SET stock_quantity = stock_quantity - (
    SELECT quantity FROM stock_reservations WHERE id = p_reservation_id
  )
  WHERE id = (
    SELECT variant_id FROM stock_reservations WHERE id = p_reservation_id
  );
  
  RETURN true;
END;
```

---

### 1.5 `expire_old_stock_reservations()`

**Purpose:** Clean up expired stock reservations (cron job)

**Signature:**
```sql
CREATE FUNCTION expire_old_stock_reservations()
RETURNS integer  -- Returns count of expired reservations
```

**Usage:**
```sql
-- Run via cron job (every 5 minutes)
SELECT expire_old_stock_reservations();
-- Returns: 5 (deleted 5 expired reservations)
```

**Setup Cron Job (Supabase):**
```sql
-- Using pg_cron extension
SELECT cron.schedule(
  'expire-stock-reservations',  -- Job name
  '*/5 * * * *',                -- Every 5 minutes
  'SELECT expire_old_stock_reservations();'
);
```

**Manual Cleanup:**
```sql
-- Delete expired reservations manually
DELETE FROM stock_reservations
WHERE expires_at < NOW()
AND confirmed = false;
```

---

## 2. Order Processing

### 2.1 `backfill_order_items()`

**Purpose:** Migrate legacy orders to new `order_items` table (one-time migration)

**Signature:**
```sql
CREATE FUNCTION backfill_order_items()
RETURNS TABLE(
  order_id uuid,
  items_created integer,
  status text
)
```

**Usage:**
```sql
-- Run once to migrate all orders
SELECT * FROM backfill_order_items();

-- Output:
--  order_id                              | items_created | status
-- ---------------------------------------|---------------|--------
--  a1b2c3d4-e5f6-7890-abcd-ef1234567890 | 3             | success
--  b2c3d4e5-f6a7-8901-bcde-f12345678901 | 2             | success
```

**How It Works:**
```sql
FOR order_row IN SELECT * FROM orders WHERE items IS NOT NULL LOOP
  -- Extract items from JSONB
  FOR item IN SELECT * FROM jsonb_array_elements(order_row.items) LOOP
    -- Insert into order_items table
    INSERT INTO order_items (
      order_id,
      product_id,
      variant_id,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      order_row.id,
      item->>'productId',
      item->>'variantId',
      (item->>'quantity')::integer,
      (item->>'price')::numeric,
      (item->>'quantity')::integer * (item->>'price')::numeric
    );
  END LOOP;
END LOOP;
```

**When to Use:**
- ✅ After deploying new schema (one-time migration)
- ✅ To populate `order_items` from legacy `orders.items` JSONB

**When NOT to Use:**
- ❌ On every order creation (use direct INSERT instead)
- ❌ In production code (migration tool only)

---

### 2.2 `extract_customization_files()`

**Purpose:** Extract file URLs from order items customization data

**Signature:**
```sql
CREATE FUNCTION extract_customization_files()
RETURNS TABLE(
  order_item_id uuid,
  file_url text,
  cloudinary_public_id text
)
```

**Usage:**
```sql
-- Get all customization files
SELECT * FROM extract_customization_files();

-- Output:
--  order_item_id                         | file_url                          | cloudinary_public_id
-- ---------------------------------------|-----------------------------------|----------------------
--  a1b2c3d4-e5f6-7890-abcd-ef1234567890 | https://res.cloudinary.com/...    | shrifal/custom/abc123
```

**Use Cases:**
- Admin review of customization uploads
- File cleanup/maintenance
- Cloudinary storage audit

---

## 3. Product Calculations

### 3.1 `compute_product_base_price()`

**Purpose:** Calculate the minimum price across all variants of a product

**Signature:**
```sql
CREATE FUNCTION compute_product_base_price(
  product_uuid uuid
) RETURNS integer  -- Returns price in paise (smallest currency unit)
```

**Usage:**
```javascript
// Get product base price
const { data: basePrice, error } = await supabase.rpc('compute_product_base_price', {
  product_uuid: productId
});

console.log(`Starting from ₹${basePrice / 100}`);
// Output: "Starting from ₹299"
```

**SQL:**
```sql
SELECT compute_product_base_price('product-uuid');
-- Returns: 29900 (₹299.00)
```

**How It Works:**
```sql
RETURN (
  SELECT MIN(price)
  FROM product_variants
  WHERE product_id = product_uuid
  AND is_active = true
);
```

---

### 3.2 `compute_product_in_stock()`

**Purpose:** Check if ANY variant of a product is in stock

**Signature:**
```sql
CREATE FUNCTION compute_product_in_stock(
  product_uuid uuid
) RETURNS boolean
```

**Usage:**
```javascript
// Check product availability
const { data: inStock, error } = await supabase.rpc('compute_product_in_stock', {
  product_uuid: productId
});

if (inStock) {
  showAddToCartButton();
} else {
  showOutOfStockMessage();
}
```

**SQL:**
```sql
SELECT compute_product_in_stock('product-uuid');
-- Returns: true (at least one variant has stock > 0)
```

**How It Works:**
```sql
RETURN EXISTS (
  SELECT 1
  FROM product_variants
  WHERE product_id = product_uuid
  AND stock_quantity > 0
  AND is_active = true
);
```

---

## 4. Data Migration

### 4.1 `prevent_order_items_jsonb_write()` 🔒 **TRIGGER**

**Purpose:** Prevent writes to deprecated `orders.items` JSONB column (enforce new schema)

**Type:** BEFORE INSERT/UPDATE Trigger

**Usage:** Automatic (trigger-based)

**How It Works:**
```sql
CREATE TRIGGER prevent_legacy_items_write
BEFORE INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION prevent_order_items_jsonb_write();

-- Function:
CREATE FUNCTION prevent_order_items_jsonb_write()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.items IS NOT NULL THEN
    RAISE EXCEPTION 'Cannot write to orders.items. Use order_items table instead.';
  END IF;
  RETURN NEW;
END;
$$;
```

**Error Example:**
```sql
INSERT INTO orders (user_id, items, total_price)
VALUES ('user-id', '[{"productId": "123"}]', 1000);

-- ERROR: Cannot write to orders.items. Use order_items table instead.
```

---

## 5. Triggers

### 5.1 `handle_new_user()` 🔒 **AUTH TRIGGER**

**Purpose:** Auto-create customer profile when user registers

**Type:** AFTER INSERT Trigger on `auth.users`

**Usage:** Automatic

**How It Works:**
```sql
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- Function:
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customers (user_id, email, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.created_at
  );
  RETURN NEW;
END;
$$;
```

**Flow:**
```
1. User signs up → auth.users INSERT
2. Trigger fires → handle_new_user()
3. customers table row created automatically
```

---

### 5.2 `update_updated_at_column()` 🔒 **UNIVERSAL TRIGGER**

**Purpose:** Auto-update `updated_at` timestamp on row changes

**Type:** BEFORE UPDATE Trigger (applied to multiple tables)

**Tables Using This:**
- `products`
- `product_variants`
- `orders`
- `customers`
- `cart_items`

**Usage:** Automatic

**How It Works:**
```sql
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function:
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

**Example:**
```sql
UPDATE products SET title = 'New Title' WHERE id = 'product-id';
-- updated_at automatically set to current timestamp ✅
```

---

### 5.3 `update_product_category_slug()` 🔒 **AUTO-SLUG TRIGGER**

**Purpose:** Auto-generate URL-friendly slug from category name

**Type:** BEFORE INSERT/UPDATE Trigger

**Usage:** Automatic

**How It Works:**
```sql
CREATE FUNCTION update_product_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert name to slug: "Premium Gifts" → "premium-gifts"
  NEW.slug = lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  RETURN NEW;
END;
$$;
```

**Example:**
```sql
INSERT INTO product_categories (name) VALUES ('Premium Gifts');
-- slug automatically set to 'premium-gifts' ✅
```

---

### 5.4 `update_product_price_on_variant_change()` 🔒 **PRICE SYNC TRIGGER**

**Purpose:** Update `products.base_price` when variant prices change

**Type:** AFTER INSERT/UPDATE/DELETE Trigger on `product_variants`

**Usage:** Automatic

**How It Works:**
```sql
CREATE FUNCTION update_product_price_on_variant_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate minimum price
  UPDATE products
  SET base_price = (
    SELECT MIN(price)
    FROM product_variants
    WHERE product_id = NEW.product_id
    AND is_active = true
  )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;
```

**Example:**
```sql
-- Product has 3 variants: ₹100, ₹200, ₹300
-- products.base_price = ₹100

UPDATE product_variants SET price = 50 WHERE id = 'variant-1';
-- products.base_price automatically updated to ₹50 ✅
```

---

### 5.5 `update_product_stock_status_on_variant_change()` 🔒 **STOCK SYNC TRIGGER**

**Purpose:** Update `products.in_stock` when variant stock changes

**Type:** AFTER INSERT/UPDATE/DELETE Trigger on `product_variants`

**Usage:** Automatic

**How It Works:**
```sql
CREATE FUNCTION update_product_stock_status_on_variant_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if ANY variant has stock
  UPDATE products
  SET in_stock = EXISTS (
    SELECT 1
    FROM product_variants
    WHERE product_id = NEW.product_id
    AND stock_quantity > 0
    AND is_active = true
  )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;
```

**Example:**
```sql
-- Product has 2 variants: stock = 0, stock = 5
-- products.in_stock = true

UPDATE product_variants SET stock_quantity = 0 WHERE stock_quantity = 5;
-- products.in_stock automatically updated to false ✅
```

---

## 📊 Function Usage Summary

### Production Critical (Use Always)
| Function | Purpose | When to Use |
|----------|---------|-------------|
| `decrement_variant_stock()` | Atomic stock decrement | Checkout, order confirmation |
| `reserve_variant_stock()` | Reserve stock temporarily | Add to cart |
| `confirm_stock_reservation()` | Confirm reservation | Checkout completion |
| `compute_product_base_price()` | Get minimum price | Product listing pages |
| `compute_product_in_stock()` | Check availability | Product cards, filters |

### Maintenance Functions
| Function | Purpose | Frequency |
|----------|---------|----------|
| `expire_old_stock_reservations()` | Clean up reservations | Cron: Every 5 min |
| `backfill_order_items()` | Migrate legacy data | One-time migration |
| `extract_customization_files()` | Audit file uploads | On-demand |

### Deprecated
| Function | Status | Use Instead |
|----------|--------|-------------|
| `decrement_product_stock()` | ⚠️ Legacy | `decrement_variant_stock()` |

---

## 🔧 How to Create New Functions

### Template:
```sql
CREATE OR REPLACE FUNCTION your_function_name(
  p_param1 datatype,
  p_param2 datatype
)
RETURNS return_type
LANGUAGE plpgsql
AS $$
DECLARE
  v_variable datatype;
BEGIN
  -- Your logic here
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error: %', SQLERRM;
END;
$$;

-- Add documentation
COMMENT ON FUNCTION your_function_name(datatype, datatype) IS
'Brief description of what this function does';

-- Grant permissions
GRANT EXECUTE ON FUNCTION your_function_name(datatype, datatype) TO authenticated;
```

### Best Practices:
1. ✅ Use `p_` prefix for parameters
2. ✅ Use `v_` prefix for variables
3. ✅ Add `COMMENT` for documentation
4. ✅ Handle exceptions explicitly
5. ✅ Use row-level locking for concurrent operations
6. ✅ Test with `BEGIN; ... ROLLBACK;` before deploying

---

## 🧪 Testing Functions

### Unit Test Template:
```sql
-- Create test data
BEGIN;

INSERT INTO product_variants (id, product_id, price, stock_quantity)
VALUES ('test-variant', 'test-product', 1000, 5);

-- Test function
SELECT decrement_variant_stock('test-variant', 2);

-- Verify result
SELECT stock_quantity FROM product_variants WHERE id = 'test-variant';
-- Expected: 3

-- Cleanup
ROLLBACK;
```

### Concurrent Test:
```sql
-- Terminal 1:
BEGIN;
SELECT decrement_variant_stock('variant-with-1-stock', 1);
-- Wait 10 seconds
COMMIT;

-- Terminal 2 (run immediately):
BEGIN;
SELECT decrement_variant_stock('same-variant-id', 1);
-- Should wait, then throw "Insufficient stock"
COMMIT;
```

---

## 🚨 Common Errors

### Error: "Variant not found"
**Cause:** Invalid `variant_id` passed to function  
**Fix:** Verify variant exists: `SELECT id FROM product_variants WHERE id = 'uuid';`

### Error: "Insufficient stock"
**Cause:** Not enough stock available  
**Fix:** Check stock: `SELECT stock_quantity FROM product_variants WHERE id = 'uuid';`

### Error: "Permission denied for function"
**Cause:** User doesn't have EXECUTE permission  
**Fix:** `GRANT EXECUTE ON FUNCTION function_name TO authenticated;`

### Error: "Function does not exist"
**Cause:** Function not created or wrong schema  
**Fix:** Create function or specify schema: `SELECT public.function_name();`

---

## 📞 Support

For questions or issues:
1. Check this documentation first
2. Review function source code in `/supabase/functions/`
3. Test functions in Supabase SQL Editor
4. Check database logs for detailed error messages

---

**Maintained by:** Development Team  
**Last Review:** January 24, 2026  
**Version:** 1.0.0
