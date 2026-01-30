# 💰 Centralized Billing System Documentation

## Overview

This project uses a **centralized billing system** with consistent GST calculation across all components. All billing-related calculations are handled by the `billingUtils.js` utility module.

---

## 🎯 GST Rules

The system supports **three GST scenarios** based on product configuration:

| Product Flags | GST Rate | Applied |
|---------------|----------|----------|
| `gst_5pct = true` | **5%** | ✅ Yes |
| `gst_18pct = true` | **18%** | ✅ Yes |
| Both `false` or `null` | **0%** | ❌ No GST |

### Priority
If both flags are somehow `true`, **5% takes priority** over 18%.

---

## 📊 Price Structure

```
┌────────────────────────────────┐
│   Base Price (product.price)   │
└─────────────┬──────────────────┘
             │
             │ × GST Rate (0.05, 0.18, or 0)
             ↓
┌────────────────────────────────┐
│       GST Amount              │
│  (Base Price × GST Rate)     │
└────────────┬───────────────────┘
             │
             │ + Base Price
             ↓
┌────────────────────────────────┐
│    Price with GST             │
│ (What customer pays per unit)│
└────────────┬───────────────────┘
             │
             │ × Quantity
             ↓
┌────────────────────────────────┐
│      Item Total               │
│   (Total for this line)      │
└────────────────────────────────┘
```

---

## 🛠️ Core Functions

### 1. `getGSTRate(product)`
**Returns GST rate as decimal (0.05, 0.18, or 0)**

```javascript
import { getGSTRate } from '@/utils/billingUtils';

const product = { gst_5pct: true };
const rate = getGSTRate(product); // 0.05
```

### 2. `getGSTPercentage(product)`
**Returns GST as percentage (5, 18, or 0)**

```javascript
const percentage = getGSTPercentage(product); // 5
```

### 3. `calculateItemPricing(item, product)`
**Calculates complete pricing breakdown for a single item**

```javascript
const item = {
  price: 1000,
  quantity: 2,
  gst_5pct: true
};

const pricing = calculateItemPricing(item);
// Returns:
// {
//   basePrice: 1000,
//   gstRate: 0.05,
//   gstPercentage: 5,
//   gstAmount: 50,
//   priceWithGST: 1050,
//   quantity: 2,
//   subtotal: 2000,
//   itemGSTTotal: 100,
//   itemTotal: 2100
// }
```

### 4. `calculateOrderTotals(items)`
**Calculates totals from array of items**

```javascript
const items = [
  { price: 1000, quantity: 2, gst_5pct: true },
  { price: 500, quantity: 1, gst_18pct: true },
  { price: 200, quantity: 3 } // No GST
];

const totals = calculateOrderTotals(items);
// Returns:
// {
//   subtotal: 2700,        // 2000 + 500 + 600
//   totalGST: 190,         // 100 + 90
//   gst5Total: 100,        // From first item
//   gst18Total: 90,        // From second item
//   noGSTTotal: 600,       // From third item
//   grandTotal: 2890,      // subtotal + totalGST
//   itemCount: 3,
//   totalQuantity: 6
// }
```

### 5. `formatCurrency(amount)`
**Formats amount in Indian Rupees**

```javascript
formatCurrency(1234.56); // "₹1,234.56"
```

### 6. `createItemSnapshot(item, product)`
**Creates snapshot for order storage**

```javascript
const snapshot = createItemSnapshot(cartItem, productData);
// Returns object ready for order_items table
```

---

## 📝 Usage Examples

### In Cart Component

```javascript
import { calculateItemPricing, formatCurrency } from '@/utils/billingUtils';

function CartItem({ item }) {
  const pricing = calculateItemPricing(item);
  
  return (
    <div>
      <p>Base: {formatCurrency(pricing.basePrice)}</p>
      <p>GST ({pricing.gstPercentage}%): +{formatCurrency(pricing.gstAmount)}</p>
      <p>Total: {formatCurrency(pricing.priceWithGST)}</p>
    </div>
  );
}
```

### In Checkout Summary

```javascript
import { calculateOrderTotals, formatCurrency } from '@/utils/billingUtils';

function CheckoutSummary({ items }) {
  const totals = calculateOrderTotals(items);
  
  return (
    <div>
      <p>Subtotal: {formatCurrency(totals.subtotal)}</p>
      {totals.gst5Total > 0 && (
        <p>GST @5%: +{formatCurrency(totals.gst5Total)}</p>
      )}
      {totals.gst18Total > 0 && (
        <p>GST @18%: +{formatCurrency(totals.gst18Total)}</p>
      )}
      <p><strong>Grand Total: {formatCurrency(totals.grandTotal)}</strong></p>
    </div>
  );
}
```

### In Invoice Generator

```javascript
import { calculateOrderTotals, calculateItemPricing } from '@/utils/billingUtils';

function Invoice({ order }) {
  const totals = calculateOrderTotals(order.items);
  
  return (
    <div>
      {order.items.map(item => {
        const pricing = calculateItemPricing(item);
        return (
          <div key={item.id}>
            <span>{item.name}</span>
            <span>{pricing.quantity} × {formatCurrency(pricing.basePrice)}</span>
            <span>GST: {pricing.gstPercentage}%</span>
            <span>{formatCurrency(pricing.itemTotal)}</span>
          </div>
        );
      })}
      <div>
        <p>Subtotal: {formatCurrency(totals.subtotal)}</p>
        <p>Total GST: {formatCurrency(totals.totalGST)}</p>
        <p><strong>Grand Total: {formatCurrency(totals.grandTotal)}</strong></p>
      </div>
    </div>
  );
}
```

---

## 📦 Database Schema

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  title TEXT,
  price DECIMAL(10,2),
  gst_5pct BOOLEAN DEFAULT FALSE,   -- ✅ 5% GST flag
  gst_18pct BOOLEAN DEFAULT FALSE,  -- ✅ 18% GST flag
  ...
);
```

### Order Items Table (Snapshot)

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID,
  variant_id UUID,
  
  -- Pricing snapshot (frozen at order time)
  base_price DECIMAL(10,2),      -- Base price without GST
  gst_rate DECIMAL(5,4),          -- 0.05, 0.18, or 0
  gst_amount DECIMAL(10,2),       -- GST per unit
  unit_price DECIMAL(10,2),       -- Price with GST (what customer pays)
  quantity INTEGER,
  item_total DECIMAL(10,2),       -- unit_price × quantity
  
  -- Product snapshot
  product_name TEXT,
  product_image TEXT,
  catalog_number TEXT,
  ...
);
```

---

## ✅ Files Using Billing System

### Core Utilities
- `frontend/src/utils/billingUtils.js` - Main billing logic

### Components
- `frontend/src/contexts/CartContext.jsx` - Cart with GST
- `frontend/src/components/CheckOut/OrderSummary.jsx` - Checkout summary
- `frontend/src/components/InvoiceGenerator.jsx` - Invoice with GST breakdown
- `frontend/src/components/admin/component/orderpagecomponents/OrderDetailsItems.jsx` - Order display

### Hooks
- `frontend/src/components/CheckOut/useCheckoutLogic.js` - Checkout processing

---

## 🔄 Migration from Old System

If you have existing orders with hardcoded tax:

```javascript
// OLD (Hardcoded 8% tax)
const tax = subtotal * 0.08;

// NEW (Product-wise GST)
import { calculateOrderTotals } from '@/utils/billingUtils';
const totals = calculateOrderTotals(items);
const tax = totals.totalGST; // Correct per-product GST
```

---

## 🚨 Important Notes

1. **Always use `billingUtils`** - Never calculate GST manually
2. **Product flags are source of truth** - `gst_5pct` and `gst_18pct` in database
3. **Snapshot pricing in orders** - Store calculated values in `order_items`
4. **GST included in customer price** - `priceWithGST` is what customer pays
5. **No mixed rates per item** - Each product has one GST rate

---

## 🔧 Testing

### Test Scenarios

```javascript
// 1. Product with 5% GST
const product1 = { price: 1000, gst_5pct: true };
const pricing1 = calculateItemPricing({ ...product1, quantity: 1 });
// Expected: basePrice=1000, gstAmount=50, priceWithGST=1050

// 2. Product with 18% GST
const product2 = { price: 500, gst_18pct: true };
const pricing2 = calculateItemPricing({ ...product2, quantity: 2 });
// Expected: basePrice=500, gstAmount=90, itemTotal=1180

// 3. Product with No GST
const product3 = { price: 200 };
const pricing3 = calculateItemPricing({ ...product3, quantity: 3 });
// Expected: basePrice=200, gstAmount=0, itemTotal=600

// 4. Mixed order
const totals = calculateOrderTotals([product1, product2, product3]);
// Expected: subtotal=2600, gst5Total=50, gst18Total=180, grandTotal=2830
```

---

## 📄 Summary

✅ **Centralized** - One source of truth for all billing  
✅ **Flexible** - Supports 5%, 18%, and no GST  
✅ **Consistent** - Same calculations everywhere  
✅ **Accurate** - Proper rounding and decimal handling  
✅ **Maintainable** - Easy to update GST rates if needed  
✅ **Documented** - Clear examples and usage patterns  

---

**Last Updated:** January 29, 2026  
**Version:** 1.0.0
