-- Migration: Fix all price columns to NUMERIC (Rupees with decimals)
-- Date: 2026-01-30
-- Purpose: Allow decimal prices in rupees instead of integer paise

-- Step 1: Drop dependent view
DROP VIEW IF EXISTS order_details_full CASCADE;

-- Step 2: Fix order_items table - Convert INTEGER to NUMERIC
ALTER TABLE order_items
  ALTER COLUMN unit_price TYPE NUMERIC(10,2),
  ALTER COLUMN item_total TYPE NUMERIC(10,2);

-- Step 3: Fix orders table - Convert INTEGER to NUMERIC  
ALTER TABLE orders
  ALTER COLUMN order_total TYPE NUMERIC(10,2),
  ALTER COLUMN total_price TYPE NUMERIC(10,2);

-- Note: These columns are already NUMERIC, just ensuring they exist:
-- orders.amount, orders.subtotal, orders.total_gst, orders.gst_5_total, orders.gst_18_total, orders.shipping_cost

-- Step 4: Recreate the view with NUMERIC types
CREATE VIEW order_details_full AS
SELECT 
  o.id AS order_id,
  o.user_id,
  o.customer_id,
  o.status AS order_status,
  o.payment_status,
  o.order_total,
  o.amount,
  o.created_at AS order_date,
  o.updated_at,
  o.shipping_info,
  o.delivery_info,
  o.payment_method,
  o.transaction_id,
  o.order_notes,
  c.name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  c.address AS customer_address,
  oi.id AS item_id,
  oi.product_id,
  oi.variant_id,
  oi.catalog_number,
  oi.quantity,
  oi.unit_price,
  oi.item_total,
  oi.customization_data,
  oi.production_notes,
  p.title AS product_name,
  p.description AS product_description,
  p.image_url AS product_image
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id;

-- Step 5: Grant permissions
GRANT SELECT ON order_details_full TO authenticated;
GRANT SELECT ON order_details_full TO anon;

-- Step 6: Add helpful comment
COMMENT ON VIEW order_details_full IS 'Complete order details with customer and item information. All prices in RUPEES (NUMERIC) not paise (INTEGER).';
