# Database Migrations

## Order Billing System Migration

### File: `add_billing_columns_to_orders.sql`

**Purpose:** Add columns to store calculated billing totals for historical accuracy.

**Tables Modified:**
1. `orders` - Added billing summary columns
2. `order_items` - Added pricing snapshot columns  
3. `products` - Ensured GST flag columns exist

### How to Run

#### Option 1: Via Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `add_billing_columns_to_orders.sql`
3. Paste and run

#### Option 2: Via psql CLI
```bash
psql -h your-db-host -U postgres -d postgres -f add_billing_columns_to_orders.sql
```

#### Option 3: Via Supabase CLI
```bash
supabase db push
```

### Columns Added to `orders`

| Column | Type | Description |
|--------|------|-------------|
| `subtotal` | DECIMAL(10,2) | Sum of base prices (no GST) |
| `total_gst` | DECIMAL(10,2) | Total GST across all items |
| `gst_5_total` | DECIMAL(10,2) | GST collected at 5% |
| `gst_18_total` | DECIMAL(10,2) | GST collected at 18% |
| `shipping_cost` | DECIMAL(10,2) | Shipping charges |
| `order_total` | DECIMAL(10,2) | Final total |

### Columns Added to `order_items`

| Column | Type | Description |
|--------|------|-------------|
| `base_price` | DECIMAL(10,2) | Price per unit (no GST) |
| `gst_rate` | DECIMAL(5,4) | GST rate (0.05/0.18/0) |
| `gst_amount` | DECIMAL(10,2) | GST per unit |
| `item_subtotal` | DECIMAL(10,2) | base_price × quantity |
| `item_gst_total` | DECIMAL(10,2) | gst_amount × quantity |
| `item_total` | DECIMAL(10,2) | Line item total |

### Verification

After running migration:

```sql
-- Verify orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('subtotal', 'total_gst', 'order_total');

-- Verify order_items table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'order_items'
AND column_name IN ('base_price', 'gst_rate', 'gst_amount');
```

### Rollback (if needed)

```sql
ALTER TABLE orders 
DROP COLUMN IF EXISTS subtotal,
DROP COLUMN IF EXISTS total_gst,
DROP COLUMN IF EXISTS gst_5_total,
DROP COLUMN IF EXISTS gst_18_total,
DROP COLUMN IF EXISTS shipping_cost,
DROP COLUMN IF EXISTS order_total;

ALTER TABLE order_items
DROP COLUMN IF EXISTS base_price,
DROP COLUMN IF EXISTS gst_rate,
DROP COLUMN IF EXISTS gst_amount,
DROP COLUMN IF EXISTS item_subtotal,
DROP COLUMN IF EXISTS item_gst_total,
DROP COLUMN IF EXISTS item_total;
```

### Notes

- ✅ Safe to run multiple times (uses `IF NOT EXISTS`)
- ✅ Adds indexes for performance
- ✅ Existing data not affected
- ✅ New orders will use new columns
- ⚠️ Old orders will have NULL in new columns (unless migrated)
