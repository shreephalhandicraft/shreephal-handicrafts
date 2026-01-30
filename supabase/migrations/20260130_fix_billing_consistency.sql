-- Migration: Fix billing consistency across the application
-- Purpose: Ensure all order displays use order_total (snapshot) instead of legacy total_price (paise)
-- Date: 2026-01-30

-- Drop existing view if it exists
DROP VIEW IF EXISTS orders_with_item_summary CASCADE;

-- Recreate view with correct billing fields
-- ✅ FIX: Use order_total (snapshot) instead of total_price (paise)
CREATE OR REPLACE VIEW orders_with_item_summary AS
SELECT 
  o.id AS order_id,
  o.user_id,
  o.customer_id,
  o.status,
  o.payment_status,
  o.payment_method,
  o.created_at,
  o.updated_at,
  
  -- ✅ BILLING SNAPSHOT FIELDS (correct amounts in rupees)
  o.order_total,              -- Grand total with GST (₹214.50)
  o.subtotal,                 -- Base price without GST (₹210.00)
  o.total_gst,                -- Total GST amount (₹4.50)
  o.gst_5_total,              -- GST @5% breakdown
  o.gst_18_total,             -- GST @18% breakdown  
  o.shipping_cost,            -- Shipping cost
  
  -- ⚠️ LEGACY FIELDS (for backward compatibility, but should NOT be used for display)
  o.total_price,              -- Legacy: amount in paise (21450 paise = ₹214.50)
  o.amount,                   -- Legacy: amount in rupees but may be inconsistent
  
  -- Order metadata
  o.requires_customization,
  o.production_status,
  o.shipping_info,
  o.delivery_info,
  o.order_notes,
  o.transaction_id,
  o.upi_reference,
  o.customization_details,
  
  -- Customer info
  c.name AS customer_name,
  c.email AS customer_email,
  c.phone AS customer_phone,
  
  -- Order summary (calculated from order_items)
  COUNT(DISTINCT oi.id) AS total_items,
  COALESCE(SUM(oi.quantity), 0) AS total_quantity,
  
  -- First product info (for preview)
  MAX(p.name) FILTER (WHERE row_num = 1) AS first_product_name,
  MAX(p.image_url) FILTER (WHERE row_num = 1) AS first_product_image,
  MAX(p.catalog_number) FILTER (WHERE row_num = 1) AS first_catalog_number,
  
  -- Estimated delivery
  COALESCE(
    (o.delivery_info->>'estimatedDays')::integer,
    7
  ) AS estimated_delivery_days
  
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
LEFT JOIN (
  SELECT 
    oi.*,
    ROW_NUMBER() OVER (PARTITION BY oi.order_id ORDER BY oi.created_at) AS row_num
  FROM order_items oi
) oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY 
  o.id,
  o.user_id,
  o.customer_id,
  o.status,
  o.payment_status,
  o.payment_method,
  o.created_at,
  o.updated_at,
  o.order_total,
  o.subtotal,
  o.total_gst,
  o.gst_5_total,
  o.gst_18_total,
  o.shipping_cost,
  o.total_price,
  o.amount,
  o.requires_customization,
  o.production_status,
  o.shipping_info,
  o.delivery_info,
  o.order_notes,
  o.transaction_id,
  o.upi_reference,
  o.customization_details,
  c.name,
  c.email,
  c.phone;

-- Grant access to authenticated users
GRANT SELECT ON orders_with_item_summary TO authenticated;
GRANT SELECT ON orders_with_item_summary TO anon;

-- Add helpful comments
COMMENT ON VIEW orders_with_item_summary IS 'Order summary view with billing snapshot. ALWAYS use order_total for displays, NOT total_price or amount.';

-- Verification
DO $$
DECLARE
  view_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_name = 'orders_with_item_summary'
  ) INTO view_exists;
  
  IF NOT view_exists THEN
    RAISE EXCEPTION 'Migration failed: orders_with_item_summary view not created';
  END IF;
  
  RAISE NOTICE 'Migration successful: orders_with_item_summary view updated with billing snapshot fields';
END $$;
