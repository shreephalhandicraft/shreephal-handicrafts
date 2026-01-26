-- ================================================================
-- ORDER PROCESSING & MIGRATION FUNCTIONS
-- ================================================================
-- Purpose: Handle order migrations and data extraction
-- Last Updated: January 24, 2026
-- ================================================================

-- ================================================================
-- 1. BACKFILL ORDER ITEMS (ONE-TIME MIGRATION)
-- ================================================================

CREATE OR REPLACE FUNCTION backfill_order_items()
RETURNS TABLE(
  order_id uuid,
  items_created integer,
  status text
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_order record;
  v_item jsonb;
  v_items_count integer;
BEGIN
  -- Loop through all orders with items in JSONB
  FOR v_order IN 
    SELECT id, items, user_id 
    FROM orders 
    WHERE items IS NOT NULL 
    AND items != 'null'::jsonb
    AND jsonb_array_length(items) > 0
  LOOP
    v_items_count := 0;
    
    BEGIN
      -- Extract each item from JSONB array
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
      LOOP
        -- Insert into order_items table
        INSERT INTO order_items (
          order_id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          total_price,
          customization_data
        ) VALUES (
          v_order.id,
          (v_item->>'productId')::uuid,
          (v_item->>'variantId')::uuid,
          COALESCE((v_item->>'quantity')::integer, 1),
          COALESCE((v_item->>'price')::numeric, 0),
          COALESCE((v_item->>'quantity')::integer, 1) * COALESCE((v_item->>'price')::numeric, 0),
          CASE 
            WHEN v_item->'customization' IS NOT NULL 
            THEN v_item->'customization'
            ELSE NULL
          END
        )
        ON CONFLICT (order_id, product_id, variant_id) DO NOTHING;  -- Skip duplicates
        
        v_items_count := v_items_count + 1;
      END LOOP;
      
      -- Return success for this order
      order_id := v_order.id;
      items_created := v_items_count;
      status := 'success';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return error for this order
      order_id := v_order.id;
      items_created := 0;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$;

COMMENT ON FUNCTION backfill_order_items() IS
'One-time migration: Extract items from orders.items JSONB and populate order_items table. 
Run after deploying new schema. Returns report of processed orders.';

GRANT EXECUTE ON FUNCTION backfill_order_items() TO service_role;


-- ================================================================
-- 2. EXTRACT CUSTOMIZATION FILES
-- ================================================================

CREATE OR REPLACE FUNCTION extract_customization_files()
RETURNS TABLE(
  order_item_id uuid,
  file_url text,
  cloudinary_public_id text
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.id AS order_item_id,
    oi.customization_data->>'uploadedImage' AS file_url,
    -- Extract Cloudinary public_id from URL
    regexp_replace(
      oi.customization_data->>'uploadedImage',
      '^https?://res\.cloudinary\.com/[^/]+/image/upload/v\d+/',
      ''
    ) AS cloudinary_public_id
  FROM order_items oi
  WHERE oi.customization_data IS NOT NULL
  AND oi.customization_data->>'uploadedImage' IS NOT NULL
  AND oi.customization_data->>'uploadedImage' != '';
END;
$$;

COMMENT ON FUNCTION extract_customization_files() IS
'Extract all customization file URLs from order items. 
Useful for file auditing, cleanup, and Cloudinary storage management.';

GRANT EXECUTE ON FUNCTION extract_customization_files() TO authenticated;
GRANT EXECUTE ON FUNCTION extract_customization_files() TO service_role;


-- ================================================================
-- 3. GET ORDER SUMMARY WITH ITEMS
-- ================================================================

CREATE OR REPLACE FUNCTION get_order_summary(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_order jsonb;
  v_items jsonb;
BEGIN
  -- Get order details
  SELECT jsonb_build_object(
    'id', o.id,
    'user_id', o.user_id,
    'total_price', o.total_price,
    'payment_status', o.payment_status,
    'order_status', o.status,
    'payment_method', o.payment_method,
    'created_at', o.created_at,
    'shipping_info', o.shipping_info
  ) INTO v_order
  FROM orders o
  WHERE o.id = p_order_id;

  -- Get order items
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'variant_id', oi.variant_id,
      'quantity', oi.quantity,
      'unit_price', oi.unit_price,
      'total_price', oi.total_price,
      'has_customization', (oi.customization_data IS NOT NULL)
    )
  ) INTO v_items
  FROM order_items oi
  WHERE oi.order_id = p_order_id;

  -- Combine order + items
  RETURN jsonb_build_object(
    'order', v_order,
    'items', COALESCE(v_items, '[]'::jsonb),
    'item_count', COALESCE(jsonb_array_length(v_items), 0)
  );
END;
$$;

COMMENT ON FUNCTION get_order_summary(uuid) IS
'Get complete order summary including items. 
Useful for order confirmation emails and admin dashboard.';

GRANT EXECUTE ON FUNCTION get_order_summary(uuid) TO authenticated;


-- ================================================================
-- 4. VALIDATE ORDER TOTAL
-- ================================================================

CREATE OR REPLACE FUNCTION validate_order_total(
  p_order_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_order_total numeric;
  v_items_total numeric;
  v_difference numeric;
BEGIN
  -- Get order total
  SELECT total_price INTO v_order_total
  FROM orders
  WHERE id = p_order_id;

  -- Calculate sum of order items
  SELECT COALESCE(SUM(total_price), 0) INTO v_items_total
  FROM order_items
  WHERE order_id = p_order_id;

  v_difference := v_order_total - v_items_total;

  RETURN jsonb_build_object(
    'order_id', p_order_id,
    'order_total', v_order_total,
    'items_total', v_items_total,
    'difference', v_difference,
    'is_valid', (ABS(v_difference) < 1),  -- Allow 1 rupee tolerance for rounding
    'status', CASE
      WHEN ABS(v_difference) < 1 THEN 'valid'
      WHEN v_difference > 0 THEN 'order_total_higher'
      ELSE 'items_total_higher'
    END
  );
END;
$$;

COMMENT ON FUNCTION validate_order_total(uuid) IS
'Validate that order total matches sum of order items. 
Useful for auditing and detecting data inconsistencies.';

GRANT EXECUTE ON FUNCTION validate_order_total(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_order_total(uuid) TO service_role;


-- ================================================================
-- TESTING GUIDE
-- ================================================================

/*
-- 1. Test backfill_order_items (migration)
BEGIN;

-- Create test order with legacy JSONB items
INSERT INTO orders (id, user_id, total_price, items)
VALUES (
  'test-order-001',
  auth.uid(),
  10000,
  '[
    {
      "productId": "product-001",
      "variantId": "variant-001",
      "quantity": 2,
      "price": 5000
    }
  ]'::jsonb
);

-- Run migration
SELECT * FROM backfill_order_items();

-- Verify order_items created
SELECT * FROM order_items WHERE order_id = 'test-order-001';

ROLLBACK;


-- 2. Test extract_customization_files
BEGIN;

INSERT INTO order_items (
  order_id,
  product_id,
  variant_id,
  quantity,
  unit_price,
  total_price,
  customization_data
) VALUES (
  'test-order-002',
  'product-001',
  'variant-001',
  1,
  5000,
  5000,
  '{
    "uploadedImage": "https://res.cloudinary.com/demo/image/upload/v1234567890/custom/file.jpg"
  }'::jsonb
);

SELECT * FROM extract_customization_files();

ROLLBACK;


-- 3. Test get_order_summary
BEGIN;

-- Create order with items
INSERT INTO orders (id, user_id, total_price)
VALUES ('test-order-003', auth.uid(), 15000);

INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, total_price)
VALUES 
  ('test-order-003', 'product-001', 'variant-001', 2, 5000, 10000),
  ('test-order-003', 'product-002', 'variant-002', 1, 5000, 5000);

SELECT get_order_summary('test-order-003');
-- Should show order details + 2 items

ROLLBACK;


-- 4. Test validate_order_total
BEGIN;

-- Create order with mismatched total
INSERT INTO orders (id, user_id, total_price)
VALUES ('test-order-004', auth.uid(), 10000);

INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, total_price)
VALUES ('test-order-004', 'product-001', 'variant-001', 1, 5000, 5000);

SELECT validate_order_total('test-order-004');
-- Should show: order_total_higher (10000 vs 5000)

ROLLBACK;
*/
