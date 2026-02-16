-- Migration: Backfill Order Item Snapshots
-- Purpose: Populate snapshot fields for existing orders after removing FK constraints
-- Date: 2026-02-16
-- Author: System Migration

-- This migration ensures all existing order_items have snapshot data
-- so they remain visible even if products/variants are modified or deleted

BEGIN;

-- Step 1: Backfill snapshot data from existing product and variant records
UPDATE order_items oi
SET 
  product_name = COALESCE(oi.product_name, p.title),
  product_image_url = COALESCE(oi.product_image_url, p.image_url),
  product_catalog = COALESCE(oi.product_catalog, p.catalog_number),
  variant_sku = COALESCE(oi.variant_sku, pv.sku),
  variant_size_c = COALESCE(oi.variant_size_c, pv.size_display),
  base_price = COALESCE(oi.base_price, pv.price),
  updated_at = NOW()
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
    oi.product_catalog IS NULL
  );

-- Step 2: For order items where variant was deleted, use product_id directly
UPDATE order_items oi
SET 
  product_name = COALESCE(oi.product_name, p.title, 'Product Unavailable'),
  product_image_url = COALESCE(oi.product_image_url, p.image_url),
  product_catalog = COALESCE(oi.product_catalog, p.catalog_number, 'N/A'),
  variant_sku = COALESCE(oi.variant_sku, 'N/A'),
  base_price = COALESCE(oi.base_price, 0),
  updated_at = NOW()
FROM 
  products p
WHERE 
  oi.product_id = p.id
  AND oi.variant_id IS NULL
  AND (
    oi.product_name IS NULL OR 
    oi.base_price IS NULL
  );

-- Step 3: Handle orphaned records (product/variant both deleted)
UPDATE order_items
SET 
  product_name = COALESCE(product_name, 'Product Unavailable'),
  variant_sku = COALESCE(variant_sku, 'N/A'),
  base_price = COALESCE(base_price, 0),
  product_catalog = COALESCE(product_catalog, 'N/A'),
  updated_at = NOW()
WHERE 
  product_name IS NULL OR 
  variant_sku IS NULL OR 
  base_price IS NULL;

COMMIT;

-- Verification Query - Run this after migration
-- SELECT 
--   COUNT(*) FILTER (WHERE product_name IS NOT NULL) as has_product_name,
--   COUNT(*) FILTER (WHERE variant_sku IS NOT NULL) as has_variant_sku,
--   COUNT(*) FILTER (WHERE base_price IS NOT NULL) as has_base_price,
--   COUNT(*) FILTER (WHERE product_image_url IS NOT NULL) as has_product_image,
--   COUNT(*) FILTER (WHERE product_catalog IS NOT NULL) as has_catalog,
--   COUNT(*) as total_items
-- FROM order_items;

-- Sample data check - Run this to see the backfilled data
-- SELECT 
--   id,
--   product_name,
--   variant_sku,
--   base_price,
--   product_catalog,
--   product_image_url,
--   product_id,
--   variant_id
-- FROM order_items
-- ORDER BY created_at DESC
-- LIMIT 10;
