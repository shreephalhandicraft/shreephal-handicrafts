# 🚀 Database Functions - Quick Reference

**Quick lookup for all database functions**  
**Last Updated:** January 24, 2026

---

## 📌 Most Used Functions

### Stock Operations
```javascript
// Decrement stock (during checkout)
await supabase.rpc('decrement_variant_stock', {
  p_variant_id: 'uuid',
  p_quantity: 2
});

// Reserve stock (add to cart)
const { data: reservationId } = await supabase.rpc('reserve_variant_stock', {
  p_variant_id: 'uuid',
  p_user_id: user.id,
  p_quantity: 1
});

// Confirm reservation (checkout complete)
await supabase.rpc('confirm_stock_reservation', {
  p_reservation_id: reservationId
});
```

### Product Calculations
```javascript
// Get base price
const { data: price } = await supabase.rpc('compute_product_base_price', {
  product_uuid: productId
});

// Check if in stock
const { data: inStock } = await supabase.rpc('compute_product_in_stock', {
  product_uuid: productId
});

// Get variant summary
const { data: summary } = await supabase.rpc('get_product_variant_summary', {
  product_uuid: productId
});
```

### Order Operations
```javascript
// Get order summary
const { data: order } = await supabase.rpc('get_order_summary', {
  p_order_id: orderId
});

// Validate order total
const { data: validation } = await supabase.rpc('validate_order_total', {
  p_order_id: orderId
});
```

---

## 📚 Complete Function List

### Stock Management (5 functions)

| Function | Purpose | Returns | Critical |
|----------|---------|---------|----------|
| `decrement_variant_stock` | Atomic stock decrement | `boolean` | ✅ |
| `reserve_variant_stock` | Reserve stock temporarily | `uuid` | ✅ |
| `confirm_stock_reservation` | Confirm reservation | `boolean` | ✅ |
| `expire_old_stock_reservations` | Clean up expired reservations | `integer` | 🔄 Cron |
| `decrement_product_stock` | Legacy stock decrement | `jsonb` | ⚠️ Deprecated |

### Product Calculations (3 functions)

| Function | Purpose | Returns |
|----------|---------|----------|
| `compute_product_base_price` | Get minimum variant price | `integer` |
| `compute_product_in_stock` | Check if any variant in stock | `boolean` |
| `get_product_variant_summary` | Get variant statistics | `jsonb` |

### Order Processing (4 functions)

| Function | Purpose | Returns | Usage |
|----------|---------|---------|-------|
| `backfill_order_items` | Migrate legacy orders | `TABLE` | One-time |
| `extract_customization_files` | Get customization file URLs | `TABLE` | On-demand |
| `get_order_summary` | Get order + items | `jsonb` | Frequent |
| `validate_order_total` | Audit order totals | `jsonb` | Audit |

### Triggers (6 functions)

| Function | Trigger Event | Purpose |
|----------|---------------|----------|
| `update_updated_at_column` | BEFORE UPDATE | Auto-update timestamp |
| `update_product_category_slug` | BEFORE INSERT/UPDATE | Auto-generate slug |
| `update_product_price_on_variant_change` | AFTER INSERT/UPDATE/DELETE | Sync product price |
| `update_product_stock_status_on_variant_change` | AFTER INSERT/UPDATE/DELETE | Sync stock status |
| `prevent_order_items_jsonb_write` | BEFORE INSERT/UPDATE | Block legacy column |
| `handle_new_user` | AFTER INSERT (auth.users) | Create customer profile |

---

## 🎯 Function Selection Guide

### "I need to..."

**Decrease product stock**
```javascript
await supabase.rpc('decrement_variant_stock', {
  p_variant_id: variantId,
  p_quantity: qty
});
```

**Show "Starting from ₹X" price**
```javascript
const { data: price } = await supabase.rpc('compute_product_base_price', {
  product_uuid: productId
});
console.log(`Starting from ₹${price / 100}`);
```

**Check if product available**
```javascript
const { data: available } = await supabase.rpc('compute_product_in_stock', {
  product_uuid: productId
});
if (!available) showOutOfStockMessage();
```

**Reserve stock in cart**
```javascript
const { data: resId } = await supabase.rpc('reserve_variant_stock', {
  p_variant_id: variantId,
  p_user_id: user.id,
  p_quantity: qty
});
localStorage.setItem('reservation', resId);
```

**Get all order details**
```javascript
const { data } = await supabase.rpc('get_order_summary', {
  p_order_id: orderId
});
console.log(data.order, data.items);
```

**Find customization files**
```sql
SELECT * FROM extract_customization_files();
-- Returns all uploaded customization images
```

---

## ⚠️ Important Notes

### Security
- All functions have `GRANT EXECUTE` permissions set
- `authenticated` role can execute most functions
- `service_role` needed for admin functions
- RLS policies still apply to table access

### Performance
- Functions marked `STABLE` are cacheable
- Use `FOR UPDATE` locks in stock functions
- Indexes support all foreign key lookups

### Errors
```javascript
try {
  await supabase.rpc('decrement_variant_stock', {...});
} catch (error) {
  if (error.message.includes('Insufficient stock')) {
    // Handle out of stock
  } else if (error.message.includes('Variant not found')) {
    // Handle invalid variant
  }
}
```

---

## 🔄 Cron Jobs

### Setup (Run once in Supabase SQL Editor)
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule stock reservation cleanup (every 5 minutes)
SELECT cron.schedule(
  'expire-stock-reservations',
  '*/5 * * * *',
  'SELECT expire_old_stock_reservations();'
);

-- Check scheduled jobs
SELECT * FROM cron.job;
```

---

## 📂 File Organization

```
supabase/functions/
├── README.md                      # Comprehensive documentation
├── QUICK_REFERENCE.md             # This file (quick lookup)
├── 01_stock_management.sql        # Stock functions + reservations
├── 02_product_calculations.sql    # Price/stock calculations
├── 03_triggers.sql                # All trigger functions
└── 04_order_processing.sql        # Order migration + utils
```

---

## 🧪 Testing

All SQL files include testing examples at the bottom. Test in transactions:

```sql
BEGIN;
-- Your test code
SELECT decrement_variant_stock('test-id', 1);
ROLLBACK;  -- Don't commit test data
```

---

## 🆘 Troubleshooting

### "Function does not exist"
- Check schema: `SELECT public.function_name();`
- Verify function exists: `SELECT proname FROM pg_proc WHERE proname = 'function_name';`

### "Permission denied"
- Check grants: `\df+ function_name` in psql
- Add permission: `GRANT EXECUTE ON FUNCTION function_name TO authenticated;`

### "Insufficient stock"
- Expected behavior (not an error)
- Check stock: `SELECT stock_quantity FROM product_variants WHERE id = 'uuid';`

### "Variant not found"
- Verify UUID is correct
- Check if variant deleted: `SELECT * FROM product_variants WHERE id = 'uuid';`

---

## 📖 Full Documentation

See [README.md](./README.md) for:
- Detailed function descriptions
- Complete code examples
- Race condition explanations
- Migration guides
- Best practices

---

**Need help?** Check the main README or SQL file comments for detailed examples.
