-- Migration: Add billing columns to orders and order_items tables
-- Purpose: Store calculated totals for historical accuracy and legal compliance
-- Date: 2026-01-29

-- =====================================================
-- ORDERS TABLE: Add billing summary columns
-- =====================================================

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_gst DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_5_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_18_total DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_total DECIMAL(10,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN orders.subtotal IS 'Sum of all item base prices (without GST)';
COMMENT ON COLUMN orders.total_gst IS 'Total GST amount across all items';
COMMENT ON COLUMN orders.gst_5_total IS 'Total GST collected at 5% rate';
COMMENT ON COLUMN orders.gst_18_total IS 'Total GST collected at 18% rate';
COMMENT ON COLUMN orders.shipping_cost IS 'Shipping/delivery charges';
COMMENT ON COLUMN orders.order_total IS 'Final total: subtotal + total_gst + shipping_cost';

-- =====================================================
-- ORDER_ITEMS TABLE: Add pricing snapshot columns
-- =====================================================

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS item_subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS item_gst_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS item_total DECIMAL(10,2);

-- Add comments
COMMENT ON COLUMN order_items.base_price IS 'Product base price per unit (without GST) at order time';
COMMENT ON COLUMN order_items.gst_rate IS 'GST rate applied (0.05, 0.18, or 0)';
COMMENT ON COLUMN order_items.gst_amount IS 'GST amount per unit';
COMMENT ON COLUMN order_items.item_subtotal IS 'base_price × quantity';
COMMENT ON COLUMN order_items.item_gst_total IS 'gst_amount × quantity';
COMMENT ON COLUMN order_items.item_total IS 'Total for this line item (item_subtotal + item_gst_total)';

-- =====================================================
-- PRODUCTS TABLE: Ensure GST columns exist
-- =====================================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS gst_5pct BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gst_18pct BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN products.gst_5pct IS 'Apply 5% GST to this product';
COMMENT ON COLUMN products.gst_18pct IS 'Apply 18% GST to this product';

-- =====================================================
-- CREATE INDEX for faster queries
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_subtotal ON orders(subtotal);
CREATE INDEX IF NOT EXISTS idx_orders_order_total ON orders(order_total);
CREATE INDEX IF NOT EXISTS idx_order_items_gst_rate ON order_items(gst_rate);

-- =====================================================
-- DATA MIGRATION: Update existing orders (optional)
-- =====================================================
-- Note: This attempts to recalculate old orders
-- Run only if you want to fix historical data
-- WARNING: This assumes old orders had 8% flat tax

-- Uncomment to run:
/*
UPDATE orders
SET 
  subtotal = amount / 1.08,  -- Reverse 8% tax
  total_gst = amount - (amount / 1.08),
  order_total = amount
WHERE subtotal IS NULL OR subtotal = 0;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check orders table structure
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'orders' 
-- AND column_name IN ('subtotal', 'total_gst', 'order_total');

-- Check order_items table structure  
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'order_items'
-- AND column_name IN ('base_price', 'gst_rate', 'gst_amount');
