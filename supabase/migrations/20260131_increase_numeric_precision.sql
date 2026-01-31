-- Increase NUMERIC precision from (10,2) to (12,2) to prevent overflow
-- This allows values up to 9,999,999,999.99 (999 crore) instead of 99,999,999.99 (9.9 crore)

-- Drop dependent views first
DROP VIEW IF EXISTS order_items_with_product_details CASCADE;
DROP VIEW IF EXISTS order_billing_summary CASCADE;
DROP VIEW IF EXISTS order_summary_view CASCADE;

-- Update orders table price columns
ALTER TABLE orders
  ALTER COLUMN subtotal TYPE NUMERIC(12,2),
  ALTER COLUMN total_gst TYPE NUMERIC(12,2),
  ALTER COLUMN gst_5_total TYPE NUMERIC(12,2),
  ALTER COLUMN gst_18_total TYPE NUMERIC(12,2),
  ALTER COLUMN shipping_cost TYPE NUMERIC(12,2),
  ALTER COLUMN order_total TYPE NUMERIC(12,2),
  ALTER COLUMN total_price TYPE NUMERIC(12,2),
  ALTER COLUMN amount TYPE NUMERIC(12,2);

-- Update order_items table price columns
ALTER TABLE order_items
  ALTER COLUMN base_price TYPE NUMERIC(12,2),
  ALTER COLUMN gst_amount TYPE NUMERIC(12,2),
  ALTER COLUMN item_subtotal TYPE NUMERIC(12,2),
  ALTER COLUMN item_gst_total TYPE NUMERIC(12,2),
  ALTER COLUMN item_total TYPE NUMERIC(12,2),
  ALTER COLUMN unit_price TYPE NUMERIC(12,2),
  ALTER COLUMN total_price TYPE NUMERIC(12,2);

-- Update products table price column
ALTER TABLE products
  ALTER COLUMN price TYPE NUMERIC(12,2);

-- Update product_variants table price column
ALTER TABLE product_variants
  ALTER COLUMN price TYPE NUMERIC(12,2);

-- Recreate order_items_with_product_details view
CREATE OR REPLACE VIEW order_items_with_product_details AS
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.variant_id,
  oi.catalog_number,
  oi.quantity,
  oi.base_price,
  oi.gst_rate,
  oi.gst_amount,
  oi.item_subtotal,
  oi.item_gst_total,
  oi.item_total,
  oi.unit_price,
  oi.total_price,
  oi.customization_data,
  oi.created_at,
  p.name as product_name,
  p.description as product_description,
  p.category as product_category,
  p.image_url as product_image,
  pv.size as variant_size,
  pv.color as variant_color,
  pv.sku as variant_sku
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN product_variants pv ON oi.variant_id = pv.id;

-- Recreate order_billing_summary view
CREATE OR REPLACE VIEW order_billing_summary AS
SELECT 
  o.id,
  o.customer_id,
  o.user_id,
  o.status,
  o.payment_status,
  o.payment_method,
  o.subtotal,
  o.total_gst,
  o.gst_5_total,
  o.gst_18_total,
  o.shipping_cost,
  o.order_total,
  o.created_at,
  COUNT(oi.id) as item_count,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.item_total) as calculated_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY 
  o.id, o.customer_id, o.user_id, o.status, o.payment_status, 
  o.payment_method, o.subtotal, o.total_gst, o.gst_5_total, 
  o.gst_18_total, o.shipping_cost, o.order_total, o.created_at;

-- Recreate order_summary_view
CREATE OR REPLACE VIEW order_summary_view AS
SELECT 
  o.id,
  o.customer_id,
  o.user_id,
  o.status,
  o.payment_status,
  o.payment_method,
  o.order_total,
  o.created_at,
  o.updated_at,
  c.name as customer_name,
  c.email as customer_email,
  c.phone as customer_phone,
  COUNT(DISTINCT oi.id) as total_items,
  SUM(oi.quantity) as total_quantity
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY 
  o.id, o.customer_id, o.user_id, o.status, o.payment_status,
  o.payment_method, o.order_total, o.created_at, o.updated_at,
  c.name, c.email, c.phone;

-- Add comment explaining the precision
COMMENT ON COLUMN orders.order_total IS 'Total order amount in rupees. NUMERIC(12,2) allows up to 9,999,999,999.99 (999 crore)';
COMMENT ON COLUMN order_items.total_price IS 'Total price for this line item in rupees. NUMERIC(12,2) allows up to 9,999,999,999.99';
