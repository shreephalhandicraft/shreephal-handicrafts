# 💰 "Calculate Once & Save" Billing System - Implementation Guide

## Overview

This guide explains how to implement and use the "Calculate Once & Save" billing approach for the Shreephal Handicrafts e-commerce platform.

---

## 🎯 Why "Calculate Once & Save"?

### Problems with On-Demand Calculation:

1. **Historical Inaccuracy** - If GST rates change, old orders show wrong totals
2. **Legal Issues** - Order totals might not match what customer paid
3. **Performance** - Recalculation on every page load
4. **Product Deletion** - Can't calculate if product is deleted
5. **Inconsistent Invoices** - Same order could show different amounts

### Solution: Calculate Once & Freeze

```
Checkout Time               Future (Anytime)
    ↓                            ↓
┌───────────┐              ┌───────────┐
│ CALCULATE │  -------->  │  USE SAVED │
│    ONCE    │              │   VALUES   │
│   & SAVE   │              │  (FROZEN)  │
└───────────┘              └───────────┘
```

---

## 💾 Database Setup

### Step 1: Run Migration

**File:** `database/migrations/add_billing_columns_to_orders.sql`

#### Via Supabase Dashboard:
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Copy-paste migration SQL
4. Run query

#### Via CLI:
```bash
psql -h your-db.supabase.co -U postgres -d postgres -f database/migrations/add_billing_columns_to_orders.sql
```

### Step 2: Verify Migration

```sql
-- Check orders table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('subtotal', 'total_gst', 'gst_5_total', 'gst_18_total', 'order_total');

-- Expected output:
--  column_name   | data_type 
-- ---------------+-----------
--  subtotal      | numeric
--  total_gst     | numeric
--  gst_5_total   | numeric
--  gst_18_total  | numeric
--  order_total   | numeric
```

---

## 📝 Schema Reference

### `orders` Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  
  -- ... existing columns ...
  
  -- 💰 BILLING SNAPSHOT (frozen at order time)
  subtotal DECIMAL(10,2),        -- Sum of base prices (no GST)
  total_gst DECIMAL(10,2),        -- Total GST amount
  gst_5_total DECIMAL(10,2),      -- GST at 5%
  gst_18_total DECIMAL(10,2),     -- GST at 18%
  shipping_cost DECIMAL(10,2),    -- Shipping charges
  order_total DECIMAL(10,2),      -- Final total
  
  -- Legacy (kept for compatibility)
  amount DECIMAL(10,2),           -- Same as order_total
  total_price INTEGER             -- order_total in paise
);
```

### `order_items` Table

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  product_id UUID,
  variant_id UUID,
  
  -- 💰 PRICING SNAPSHOT (frozen at order time)
  base_price DECIMAL(10,2),       -- Price per unit (no GST)
  gst_rate DECIMAL(5,4),          -- 0.05, 0.18, or 0
  gst_amount DECIMAL(10,2),       -- GST per unit
  item_subtotal DECIMAL(10,2),    -- base_price × quantity
  item_gst_total DECIMAL(10,2),   -- gst_amount × quantity
  item_total DECIMAL(10,2),       -- Line item total
  
  -- Legacy (kept for compatibility)
  unit_price INTEGER,             -- priceWithGST in paise
  total_price INTEGER,            -- item_total in paise
  
  quantity INTEGER,
  customization_data JSONB
);
```

---

## 🛠️ Code Implementation

### 1. At Checkout (Calculate & Save)

**File:** `frontend/src/components/CheckOut/useCheckoutLogic.js`

```javascript
import { calculateOrderTotals, calculateItemPricing } from '@/utils/billingUtils';

const createOrder = async () => {
  // Get cart items
  const cartItems = getCartForCheckout();
  
  // 💰 CALCULATE ONCE (will be frozen in DB)
  const orderTotals = calculateOrderTotals(cartItems);
  const shippingCost = 0; // or calculate from shipping rules
  const finalTotal = orderTotals.grandTotal + shippingCost;
  
  // ✅ SAVE TO DATABASE
  const orderData = {
    user_id: user.id,
    
    // Billing snapshot
    subtotal: orderTotals.subtotal,
    total_gst: orderTotals.totalGST,
    gst_5_total: orderTotals.gst5Total,
    gst_18_total: orderTotals.gst18Total,
    shipping_cost: shippingCost,
    order_total: finalTotal,
    
    // Legacy fields
    amount: finalTotal,
    total_price: Math.round(finalTotal * 100),
    
    // ... other fields
  };
  
  const { data: order } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single();
  
  // Create order items with pricing snapshot
  const orderItemsData = cartItems.map(item => {
    const pricing = calculateItemPricing(item, productData);
    
    return {
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: pricing.quantity,
      
      // Pricing snapshot
      base_price: pricing.basePrice,
      gst_rate: pricing.gstRate,
      gst_amount: pricing.gstAmount,
      item_subtotal: pricing.subtotal,
      item_gst_total: pricing.itemGSTTotal,
      item_total: pricing.itemTotal,
      
      // Legacy
      unit_price: Math.round(pricing.priceWithGST * 100),
      total_price: Math.round(pricing.itemTotal * 100),
    };
  });
  
  await supabase.from('order_items').insert(orderItemsData);
  
  return order;
};
```

### 2. Displaying Orders (Use Saved Values)

**File:** `frontend/src/components/InvoiceGenerator.jsx`

```javascript
const InvoiceGenerator = ({ order }) => {
  // ✅ USE SAVED VALUES (not recalculated)
  const subtotal = order.subtotal;           // From DB
  const totalGST = order.total_gst;          // From DB
  const gst5 = order.gst_5_total || 0;       // From DB
  const gst18 = order.gst_18_total || 0;     // From DB
  const shipping = order.shipping_cost || 0; // From DB
  const grandTotal = order.order_total;      // From DB
  
  return (
    <div>
      <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
      {gst5 > 0 && <p>GST @5%: +₹{gst5.toFixed(2)}</p>}
      {gst18 > 0 && <p>GST @18%: +₹{gst18.toFixed(2)}</p>}
      {totalGST > 0 && <p>Total GST: ₹{totalGST.toFixed(2)}</p>}
      {shipping > 0 && <p>Shipping: ₹{shipping.toFixed(2)}</p>}
      <p><strong>Grand Total: ₹{grandTotal.toFixed(2)}</strong></p>
      
      {/* Order items */}
      {order.items.map(item => (
        <div key={item.id}>
          <span>{item.product_name}</span>
          <span>Base: ₹{item.base_price}</span>
          <span>GST ({Math.round(item.gst_rate * 100)}%): +₹{item.item_gst_total}</span>
          <span>Total: ₹{item.item_total}</span>
        </div>
      ))}
    </div>
  );
};
```

### 3. Admin Order View

**File:** `frontend/src/components/admin/OrderDetailsItems.jsx`

```javascript
const OrderDetailsItems = ({ order }) => {
  // ✅ USE SAVED VALUES
  const totals = {
    subtotal: order.subtotal || 0,
    totalGST: order.total_gst || 0,
    gst5Total: order.gst_5_total || 0,
    gst18Total: order.gst_18_total || 0,
    grandTotal: order.order_total || order.amount || 0,
  };
  
  return (
    <div>
      <h3>Order Totals</h3>
      <p>Subtotal: ₹{totals.subtotal}</p>
      <p>GST @5%: ₹{totals.gst5Total}</p>
      <p>GST @18%: ₹{totals.gst18Total}</p>
      <p>Total GST: ₹{totals.totalGST}</p>
      <p><strong>Total: ₹{totals.grandTotal}</strong></p>
    </div>
  );
};
```

---

## 🔄 Migration of Existing Orders (Optional)

If you have existing orders with old calculation:

### Option 1: Leave As-Is

- Old orders will have NULL in new columns
- Display logic should fallback to `amount` field
- Future orders use new system

### Option 2: Migrate Old Orders

```sql
-- WARNING: This assumes old orders had 8% flat tax
UPDATE orders
SET 
  subtotal = amount / 1.08,
  total_gst = amount - (amount / 1.08),
  order_total = amount
WHERE subtotal IS NULL;
```

---

## ✅ Testing Checklist

### Test Scenarios:

1. **Place order with 5% GST product**
   - [ ] Order created with correct `gst_5_total`
   - [ ] `total_gst` = `gst_5_total`
   - [ ] `order_total` = `subtotal` + `total_gst`

2. **Place order with 18% GST product**
   - [ ] Order created with correct `gst_18_total`
   - [ ] `total_gst` = `gst_18_total`

3. **Place order with no GST product**
   - [ ] `total_gst` = 0
   - [ ] `gst_5_total` = 0
   - [ ] `gst_18_total` = 0
   - [ ] `order_total` = `subtotal`

4. **Place order with mixed GST products**
   - [ ] `gst_5_total` > 0
   - [ ] `gst_18_total` > 0
   - [ ] `total_gst` = `gst_5_total` + `gst_18_total`

5. **View old order (before migration)**
   - [ ] Displays correctly (fallback to `amount`)

6. **View new order**
   - [ ] Shows correct totals from DB
   - [ ] Invoice matches order summary
   - [ ] Admin panel shows same values

### SQL Verification:

```sql
-- Check a recent order
SELECT 
  id,
  subtotal,
  gst_5_total,
  gst_18_total,
  total_gst,
  shipping_cost,
  order_total,
  -- Verify calculation
  (subtotal + total_gst + COALESCE(shipping_cost, 0)) as calculated_total,
  -- Should match:
  order_total - (subtotal + total_gst + COALESCE(shipping_cost, 0)) as difference
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Difference should be 0.00
```

---

## 📊 Performance Benefits

### Before (On-Demand Calculation):
```
Order Page Load:
1. Fetch order from DB
2. Fetch all order items
3. Fetch product data for each item (for GST flags)
4. Calculate totals for each item
5. Sum up order totals
6. Display

Total: ~5 database queries + calculations
```

### After (Saved Values):
```
Order Page Load:
1. Fetch order from DB (with totals)
2. Fetch order items (with pricing)
3. Display

Total: 2 database queries, 0 calculations
```

**Result:** ~60% faster page loads

---

## ⚠️ Important Notes

1. **Never recalculate order totals** after order creation
2. **Always use saved values** for display/invoices
3. **Only calculate during checkout** (before payment)
4. **Validate calculations** before saving
5. **Handle NULL values** for old orders

---

## 🔗 Related Files

- `frontend/src/utils/billingUtils.js` - Calculation functions
- `frontend/src/components/CheckOut/useCheckoutLogic.js` - Order creation
- `frontend/src/components/InvoiceGenerator.jsx` - Invoice display
- `frontend/src/contexts/CartContext.jsx` - Cart with GST
- `database/migrations/add_billing_columns_to_orders.sql` - Schema migration
- `docs/BILLING_SYSTEM.md` - Billing system documentation

---

## 👥 Support

If you encounter issues:

1. Check migration ran successfully
2. Verify new columns exist in database
3. Check console logs during order creation
4. Verify data in database after order
5. Test with different product GST configurations

---

**Last Updated:** January 29, 2026  
**Version:** 1.0.0
