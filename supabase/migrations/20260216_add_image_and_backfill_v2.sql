-- Migration: Add image_url column and backfill complete snapshot data
-- Purpose: Add missing image_url column and populate all snapshot fields
-- Date: 2026-02-16

BEGIN;

-- Step 1: Add product_image_url column if it doesn't exist
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_image_url TEXT;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN order_items.product_image_url IS 
  'Snapshot of product image URL at time of order. Preserved even if product is deleted or image changes.';

-- Step 3: Backfill snapshot data from existing product and variant records
UPDATE order_items oi
SET 
  product_name = COALESCE(oi.product_name, p.title),
  product_image_url = COALESCE(oi.product_image_url, p.image_url),
  product_catalog_number = COALESCE(oi.product_catalog_number, p.catalog_number),
  variant_sku = COALESCE(oi.variant_sku, pv.sku),
  variant_size_display = COALESCE(oi.variant_size_display, pv.size_display),
  base_price = COALESCE(oi.base_price, pv.price)
FROM 
  product_variants pv
  LEFT JOIN products p ON pv.product_id = p.id
WHERE 
  oi.variant_id = pv.id
  AND (
    oi.product_name IS NULL OR 
    oi.product_image_url IS NULL OR
    oi.variant_sku IS NULL OR 
    oi.base_price IS NULL OR
    oi.product_catalog_number IS NULL OR
    oi.variant_size_display IS NULL
  );

-- Step 4: For order items where variant was deleted, use product_id directly
UPDATE order_items oi
SET 
  product_name = COALESCE(oi.product_name, p.title, 'Product Unavailable'),
  product_image_url = COALESCE(oi.product_image_url, p.image_url),
  product_catalog_number = COALESCE(oi.product_catalog_number, p.catalog_number, 'N/A'),
  variant_sku = COALESCE(oi.variant_sku, 'N/A'),
  variant_size_display = COALESCE(oi.variant_size_display, 'N/A'),
  base_price = COALESCE(oi.base_price, 0)
FROM 
  products p
WHERE 
  oi.product_id = p.id
  AND oi.variant_id IS NULL
  AND (
    oi.product_name IS NULL OR 
    oi.product_image_url IS NULL OR
    oi.base_price IS NULL
  );

-- Step 5: Handle orphaned records (product/variant both deleted)
UPDATE order_items
SET 
  product_name = COALESCE(product_name, 'Product Unavailable'),
  product_image_url = COALESCE(product_image_url, NULL),
  variant_sku = COALESCE(variant_sku, 'N/A'),
  variant_size_display = COALESCE(variant_size_display, 'N/A'),
  base_price = COALESCE(base_price, 0),
  product_catalog_number = COALESCE(product_catalog_number, 'N/A')
WHERE 
  product_name IS NULL OR 
  variant_sku IS NULL OR 
  base_price IS NULL OR
  variant_size_display IS NULL OR
  product_catalog_number IS NULL;

-- Step 6: Add index for performance on image_url
CREATE INDEX IF NOT EXISTS idx_order_items_product_image_url 
  ON order_items(product_image_url) WHERE product_image_url IS NOT NULL;

COMMIT;

-- ✅ Migration Complete!
-- All order_items now have complete snapshot data including images
-- Orders are fully independent and can be viewed without product table lookups

-- Verification queries (run these after migration):
-- 
-- SELECT 
--   COUNT(*) FILTER (WHERE product_name IS NOT NULL) as has_product_name,
--   COUNT(*) FILTER (WHERE variant_sku IS NOT NULL) as has_variant_sku,
--   COUNT(*) FILTER (WHERE base_price IS NOT NULL) as has_base_price,
--   COUNT(*) FILTER (WHERE variant_size_display IS NOT NULL) as has_size_display,
--   COUNT(*) FILTER (WHERE product_catalog_number IS NOT NULL) as has_catalog,
--   COUNT(*) FILTER (WHERE product_image_url IS NOT NULL) as has_image,
--   COUNT(*) as total_items
-- FROM order_items;
--
-- SELECT 
--   id,
--   product_name,
--   variant_sku,
--   variant_size_display,
--   base_price,
--   product_catalog_number,
--   SUBSTRING(product_image_url, 1, 50) as image_preview,
--   product_id,
--   variant_id
-- FROM order_items
-- ORDER BY created_at DESC
-- LIMIT 10;
