-- Migration: Add billing snapshot columns to orders table
-- Purpose: Store immutable pricing snapshot at order time (prevents price changes from affecting past orders)
-- Date: 2026-01-30
-- Fix: GST should be ADDED to subtotal, not subtracted

-- Add new billing snapshot columns to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS total_gst DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS gst_5_total DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS gst_18_total DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS order_total DECIMAL(10, 2);

-- Add comments for documentation
COMMENT ON COLUMN orders.subtotal IS 'Base price without GST (frozen at order time)';
COMMENT ON COLUMN orders.total_gst IS 'Total GST amount (5% + 18%) (frozen at order time)';
COMMENT ON COLUMN orders.gst_5_total IS 'Total GST @5% (frozen at order time)';
COMMENT ON COLUMN orders.gst_18_total IS 'Total GST @18% (frozen at order time)';
COMMENT ON COLUMN orders.shipping_cost IS 'Shipping cost (frozen at order time)';
COMMENT ON COLUMN orders.order_total IS 'Grand total: subtotal + total_gst + shipping_cost (frozen at order time)';

-- ✅ FIX: Correct GST calculation for existing orders
-- If total_price exists (in paise), convert to rupees
-- Assume base price is the amount, GST is calculated on top
UPDATE orders
SET 
  subtotal = COALESCE(amount, total_price / 100.0),  -- Base price
  total_gst = ROUND(COALESCE(amount, total_price / 100.0) * 0.05, 2),  -- 5% GST on base
  gst_5_total = ROUND(COALESCE(amount, total_price / 100.0) * 0.05, 2),  -- All GST is 5% for now
  gst_18_total = 0,  -- No 18% GST for existing orders (we don't know the breakdown)
  shipping_cost = 0,  -- Assume no shipping for old orders
  order_total = ROUND(COALESCE(amount, total_price / 100.0) * 1.05, 2)  -- Base + 5% GST
WHERE order_total IS NULL;

-- Add index for faster queries on order_total
CREATE INDEX IF NOT EXISTS idx_orders_order_total ON orders(order_total);

-- Verify migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_total'
  ) THEN
    RAISE EXCEPTION 'Migration failed: order_total column not created';
  END IF;
  
  RAISE NOTICE 'Migration successful: Billing snapshot columns added to orders table';
  RAISE NOTICE 'Formula: order_total = subtotal + total_gst + shipping_cost';
  RAISE NOTICE 'Example: ₹210 (subtotal) + ₹10.50 (5%% GST) = ₹220.50 (order_total)';
END $$;
