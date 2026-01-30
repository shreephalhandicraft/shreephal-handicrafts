# Billing System Consistency Fix

## Overview

This document explains the billing system fixes implemented to ensure consistency across the `orders` and `order_items` tables.

## Problem Statement

### Issues Identified

1. **Inconsistent `total_price` field**: Stored in rupees instead of paise, causing confusion
2. **Duplicate fields**: `order_total`, `amount`, and `grand_total` all representing the same value
3. **Missing GST separation**: No breakdown of 5% vs 18% GST
4. **Incorrect calculations**: `order_total` didn't match `subtotal + GST + shipping`

### Example of the Problem

```javascript
// Before (Incorrect)
{
  "order_total": "210.00",    // Correct in rupees
  "subtotal": "210.00",
  "total_gst": "4.50",
  "total_price": 21000,        // WRONG! Should be 21450 (210 + 4.5 = 214.5 × 100)
  "amount": "210.00"           // Missing GST in calculation
}
```

## Solution

### Correct Billing Formula

```
order_total = subtotal + total_gst + shipping_cost

Where:
- subtotal = Sum of all item base_prices (without GST)
- total_gst = gst_5_total + gst_18_total
- shipping_cost = Delivery charges
- total_price = order_total × 100 (in paise)
```

### Database Schema

#### Orders Table - Billing Fields

| Field | Type | Description |
|-------|------|-------------|
| `subtotal` | NUMERIC(10,2) | Sum of all items' base prices (without GST) |
| `gst_5_total` | NUMERIC(10,2) | Total 5% GST amount |
| `gst_18_total` | NUMERIC(10,2) | Total 18% GST amount |
| `total_gst` | NUMERIC(10,2) | gst_5_total + gst_18_total |
| `shipping_cost` | NUMERIC(10,2) | Shipping charges |
| `order_total` | NUMERIC(10,2) | **Final amount** = subtotal + total_gst + shipping_cost |
| `grand_total` | NUMERIC(10,2) | Same as order_total (for compatibility) |
| `amount` | NUMERIC(10,2) | Same as order_total (for compatibility) |
| `total_price` | INTEGER | order_total in paise (order_total × 100) |

#### Order Items Table - Billing Fields

| Field | Type | Description |
|-------|------|-------------|
| `base_price` | NUMERIC(10,2) | Price per unit WITHOUT GST |
| `gst_rate` | NUMERIC(5,2) | GST percentage (5 or 18) |
| `gst_amount` | NUMERIC(10,2) | GST amount per unit |
| `unit_price_with_gst` | NUMERIC(10,2) | base_price + gst_amount |
| `item_subtotal` | NUMERIC(10,2) | base_price × quantity |
| `item_gst_total` | NUMERIC(10,2) | gst_amount × quantity |
| `item_total` | NUMERIC(10,2) | item_subtotal + item_gst_total |
| `unit_price` | INTEGER | unit_price_with_gst in paise (legacy) |
| `total_price` | INTEGER | item_total in paise (legacy) |

## Implementation

### 1. New Utility: `billingUtils.js`

Created centralized billing calculation logic:

```javascript
import { calculateOrderBilling, calculateItemBilling } from '@/utils/billingUtils';

// Calculate item billing
const itemBilling = calculateItemBilling({
  price: 100,      // Base price (without GST)
  quantity: 2,
  gstRate: 18
});
// Returns: {
//   base_price: 100.00,
//   gst_rate: 18,
//   gst_amount: 18.00,
//   unit_price_with_gst: 118.00,
//   item_subtotal: 200.00,
//   item_gst_total: 36.00,
//   item_total: 236.00
// }

// Calculate order billing
const orderBilling = calculateOrderBilling(orderItems, shippingCost);
// Returns: {
//   subtotal: 200.00,
//   gst_5_total: 0.00,
//   gst_18_total: 36.00,
//   total_gst: 36.00,
//   shipping_cost: 50.00,
//   order_total: 286.00,
//   amount: 286.00,
//   total_price: 28600  // in paise
// }
```

### 2. Updated: `orderService.js`

Modified order creation to use proper billing:

```javascript
// Old (Incorrect)
export const calculateOrderTotals = (cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.priceWithGst * item.quantity);
  }, 0);
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
};

// New (Correct)
export const calculateOrderTotals = (cartItems, shippingCost) => {
  const itemsWithBilling = cartItems.map(item => ({
    ...item,
    gstRate: item.gstRate || getGSTRate(item.category),
    billing: calculateItemBilling({
      price: item.price,
      quantity: item.quantity,
      gstRate: item.gstRate
    })
  }));
  
  return calculateOrderBilling(itemsWithBilling, shippingCost);
  // Returns proper GST-separated totals
};
```

### 3. Database Migration

Run the migration script to fix existing data:

```bash
psql -U your_user -d your_database -f database/migrations/fix_billing_consistency.sql
```

Or use Supabase SQL Editor:
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration script
4. Execute

## Verification

### Check Billing Consistency

```sql
SELECT 
  id,
  order_total,
  subtotal,
  total_gst,
  shipping_cost,
  (subtotal + total_gst + shipping_cost) AS calculated_total,
  CASE 
    WHEN ABS(order_total - (subtotal + total_gst + shipping_cost)) < 0.01 
    THEN '✅ VALID'
    ELSE '❌ INVALID'
  END AS status
FROM orders
ORDER BY created_at DESC
LIMIT 20;
```

### Example of Corrected Data

```json
{
  "order_id": "894e2739-cc39-4be1-bbf7-144a273a9416",
  "subtotal": "200.00",        // Base price without GST
  "gst_5_total": "0.00",
  "gst_18_total": "10.00",     // 18% of 200 = 36 (corrected from example)
  "total_gst": "10.00",
  "shipping_cost": "0.00",
  "order_total": "210.00",     // 200 + 10 + 0 = 210 ✅
  "amount": "210.00",
  "total_price": 21000          // 210 × 100 = 21000 ✅
}
```

## GST Rate Configuration

### Default Rates

- **5% GST**: Handicrafts, handmade items, art, decor
- **18% GST**: Other items

### Customize GST Rates

Edit `frontend/src/utils/billingUtils.js`:

```javascript
export const getGSTRate = (category) => {
  const lowGSTCategories = [
    'handicrafts', 
    'handmade', 
    'art', 
    'decor',
    'your-custom-category'  // Add your categories here
  ];
  
  if (category && lowGSTCategories.some(cat => 
    category.toLowerCase().includes(cat)
  )) {
    return 5;
  }
  
  return 18; // Default
};
```

## Testing

### Unit Tests

```javascript
import { calculateItemBilling, calculateOrderBilling } from './billingUtils';

test('calculates item billing correctly', () => {
  const result = calculateItemBilling({
    price: 100,
    quantity: 2,
    gstRate: 18
  });
  
  expect(result.base_price).toBe(100);
  expect(result.gst_amount).toBe(18);
  expect(result.item_total).toBe(236); // (100 + 18) × 2
});

test('calculates order billing correctly', () => {
  const items = [
    { price: 100, quantity: 1, gstRate: 18 },
    { price: 50, quantity: 2, gstRate: 5 }
  ];
  
  const result = calculateOrderBilling(items, 50);
  
  expect(result.subtotal).toBe(200);      // 100 + (50×2)
  expect(result.gst_18_total).toBe(18);   // 18% of 100
  expect(result.gst_5_total).toBe(5);     // 5% of 100
  expect(result.order_total).toBe(273);   // 200 + 23 + 50
});
```

## Migration Checklist

- [x] Created `billingUtils.js` utility
- [x] Updated `orderService.js` with new billing logic
- [x] Created database migration script
- [ ] Run migration on development database
- [ ] Verify existing orders are corrected
- [ ] Test new order creation
- [ ] Test order items creation
- [ ] Verify GST calculations
- [ ] Run migration on production database
- [ ] Update any reports/dashboards using billing fields

## Backward Compatibility

### Legacy Fields Maintained

- `total_price` (INTEGER): Still exists in paise for legacy code
- `amount`: Still populated (same as order_total)
- `grand_total`: Still populated (same as order_total)
- `unit_price` in order_items: Still in paise

### Recommended Cleanup (Future)

Once all systems are updated:

```sql
-- Remove redundant fields
ALTER TABLE orders 
  DROP COLUMN grand_total,
  DROP COLUMN amount;
  
-- Keep total_price for external integrations if needed
```

## Support

For issues or questions:
1. Check verification queries in migration script
2. Review `docs/BILLING_SYSTEM_FIX.md`
3. Contact development team

## References

- Migration Script: `database/migrations/fix_billing_consistency.sql`
- Billing Utils: `frontend/src/utils/billingUtils.js`
- Order Service: `frontend/src/services/orderService.js`
