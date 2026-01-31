-- Migration: Final comprehensive fix for all price columns
-- Date: 2026-01-31
-- Purpose: Drop ALL views, convert columns, recreate views

-- Step 1: Drop ALL dependent views (comprehensive list)
DROP VIEW IF EXISTS order_details_full CASCADE;
DROP VIEW IF EXISTS order_billing_summary CASCADE;
DROP VIEW IF EXISTS order_items_with_product_details CASCADE;

-- Step 2: Alter all price columns in order_items to NUMERIC
ALTER TABLE order_items
  ALTER COLUMN unit_price TYPE NUMERIC(10,2) USING unit_price::NUMERIC(10,2),
  ALTER COLUMN total_price TYPE NUMERIC(10,2) USING total_price::NUMERIC(10,2),
  ALTER COLUMN base_price TYPE NUMERIC(10,2) USING base_price::NUMERIC(10,2),
  ALTER COLUMN gst_amount TYPE NUMERIC(10,2) USING gst_amount::NUMERIC(10,2),
  ALTER COLUMN item_subtotal TYPE NUMERIC(10,2) USING item_subtotal::NUMERIC(10,2),
  ALTER COLUMN item_gst_total TYPE NUMERIC(10,2) USING item_gst_total::NUMERIC(10,2),
  ALTER COLUMN item_total TYPE NUMERIC(10,2) USING item_total::NUMERIC(10,2);

-- Step 3: Alter price columns in orders table to NUMERIC
ALTER TABLE orders
  ALTER COLUMN order_total TYPE NUMERIC(10,2) USING order_total::NUMERIC(10,2),
  ALTER COLUMN total_price TYPE NUMERIC(10,2) USING total_price::NUMERIC(10,2);

-- Step 4: Recreate order_items_with_product_details view
CREATE VIEW order_items_with_product_details AS
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.variant_id,
  oi.catalog_number,
  oi.quantity,
  oi.unit_price,
  oi.total_price,
  oi.base_price,
  oi.gst_rate,
  oi.gst_amount,
  oi.item_subtotal,
  oi.item_gst_total,
  oi.item_total,
  oi.customization_data,
  oi.production_notes,
  oi.created_at,
  p.title AS product_name,
  p.description AS product_description,
  p.image_url AS product_image,
  p.price AS product_base_price,
  p.gst_5pct,
  p.gst_18pct,
  pv.size_display,
  pv.sku,
  pv.stock_quantity
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN product_variants pv ON oi.variant_id = pv.id;

-- Step 5: Recreate order_details_full view
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

-- Step 6: Recreate order_billing_summary view
CREATE VIEW order_billing_summary AS
SELECT 
  o.id AS order_id,
  o.subtotal,
  o.gst_5_total,
  o.gst_18_total,
  o.total_gst,
  o.shipping_cost,
  o.order_total AS grand_total,
  COUNT(oi.id) AS item_count,
  SUM(oi.quantity) AS total_quantity,
  COUNT(CASE WHEN p.gst_5pct = true THEN 1 END) AS items_with_5pct_gst,
  COUNT(CASE WHEN p.gst_18pct = true THEN 1 END) AS items_with_18pct_gst,
  COUNT(CASE WHEN (p.gst_5pct = false AND p.gst_18pct = false) OR (p.gst_5pct IS NULL AND p.gst_18pct IS NULL) THEN 1 END) AS items_with_no_gst,
  o.payment_status,
  o.payment_method,
  o.created_at
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY o.id, o.subtotal, o.gst_5_total, o.gst_18_total, o.total_gst, 
         o.shipping_cost, o.order_total, o.payment_status, o.payment_method, o.created_at;

-- Step 7: Grant permissions on all views
GRANT SELECT ON order_items_with_product_details TO authenticated;
GRANT SELECT ON order_items_with_product_details TO anon;
GRANT SELECT ON order_details_full TO authenticated;
GRANT SELECT ON order_details_full TO anon;
GRANT SELECT ON order_billing_summary TO authenticated;
GRANT SELECT ON order_billing_summary TO anon;

-- Step 8: Add comments
COMMENT ON VIEW order_items_with_product_details IS 'Order items with full product and variant details. All prices in RUPEES (NUMERIC).';
COMMENT ON VIEW order_details_full IS 'Complete order details with customer and item information. All prices in RUPEES (NUMERIC).';
COMMENT ON VIEW order_billing_summary IS 'Order billing summary with GST breakdown. All prices in RUPEES (NUMERIC).';

-- Step 9: Verification - uncomment to check after migration
/*
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
  AND (column_name LIKE '%price%' OR column_name LIKE '%total%' OR column_name = 'gst_amount')
ORDER BY column_name;
*/
