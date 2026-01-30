-- Migration: Add billing snapshot columns to orders table
-- Purpose: Store immutable pricing snapshot at order time (prevents price changes from affecting past orders)
-- Date: 2026-01-30

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

-- Backfill existing orders with calculated values from total_price (if any exist)
-- Note: This is a best-effort migration. Existing orders may not have accurate GST breakdown.
UPDATE orders
SET 
  order_total = COALESCE(amount, total_price / 100.0),
  subtotal = COALESCE(amount, total_price / 100.0) * 0.85, -- Estimate: assume ~15% avg GST
  total_gst = COALESCE(amount, total_price / 100.0) * 0.15,
  gst_5_total = 0,
  gst_18_total = COALESCE(amount, total_price / 100.0) * 0.15,
  shipping_cost = 0
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
END $$;
