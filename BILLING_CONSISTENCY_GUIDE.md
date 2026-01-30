# Billing Consistency Guide

**Created:** 2026-01-30  
**Purpose:** Ensure all order displays (user-facing and admin) use consistent billing amounts

---

## 🚨 Problem Statement

### **Issue:**
Orders were showing **incorrect amounts** because different parts of the application were using different database fields:

| Field | Type | Value Example | Issue |
|-------|------|---------------|-------|
| `total_price` | INTEGER | 21450 | Stored in **paise**, displayed as rupees (₹21450 instead of ₹214.50) ❌ |
| `amount` | DECIMAL | 214.50 | Inconsistent - sometimes correct, sometimes not ⚠️ |
| `order_total` | DECIMAL | 220.50 | **CORRECT** - Billing snapshot with GST ✅ |

### **Root Cause:**
- **Legacy fields** (`total_price`, `amount`) were used inconsistently
- **No centralized billing logic** - each component calculated differently
- **Missing GST snapshot** - price changes affected historical orders

---

## ✅ Solution

### **1. Database Schema Update**

**New billing snapshot columns** added to `orders` table:

```sql
ALTER TABLE orders
  ADD COLUMN order_total DECIMAL(10, 2),     -- Grand total (subtotal + GST + shipping)
  ADD COLUMN subtotal DECIMAL(10, 2),        -- Base price (before GST)
  ADD COLUMN total_gst DECIMAL(10, 2),       -- Total GST amount
  ADD COLUMN gst_5_total DECIMAL(10, 2),     -- GST @5% breakdown
  ADD COLUMN gst_18_total DECIMAL(10, 2),    -- GST @18% breakdown
  ADD COLUMN shipping_cost DECIMAL(10, 2);   -- Shipping cost
```

**Formula:**
```
order_total = subtotal + total_gst + shipping_cost
```

**Example:**
```
subtotal:      ₹210.00
total_gst:     ₹ 10.50  (5% GST)
shipping_cost: ₹  0.00
----------------------------
order_total:   ₹220.50  ✅
```

### **2. Centralized Billing Helpers**

**File:** `frontend/src/utils/billingHelpers.js`

All order displays **MUST** use these helpers:

```javascript
import { 
  getOrderTotal,      // Get total amount
  formatPrice,        // Format for display
  rupeesToPaise,      // Convert for payment gateway
  validateBillingConsistency  // Debug tool
} from '@/utils/billingHelpers';

// ✅ CORRECT USAGE
const orderTotal = getOrderTotal(order);        // 220.50
const displayPrice = formatPrice(orderTotal);   // "₹220.50"
const paiseAmount = rupeesToPaise(orderTotal);  // 22050 (for PhonePe)

// ❌ WRONG - DO NOT USE DIRECTLY
const wrongTotal = order.amount;            // May be incorrect
const wrongTotal2 = order.total_price;      // Definitely wrong (paise)
```

---

## 🛠️ Implementation Checklist

### **Files That MUST Be Updated**

- [x] `frontend/src/utils/billingHelpers.js` - Centralized helpers created
- [x] `frontend/src/pages/MyOrders.jsx` - User orders list (FIXED)
- [ ] `frontend/src/pages/OrderDetail.jsx` - Order detail page (⚠️ **NEEDS FIX**)
- [ ] `frontend/src/pages/Admin.jsx` - Admin dashboard (⚠️ **NEEDS FIX**)
- [ ] `frontend/src/components/InvoiceGenerator.jsx` - Invoice generation (⚠️ **NEEDS FIX**)
- [ ] Any custom admin order management pages

### **How to Update Each File**

#### **Step 1: Import the helper**
```javascript
import { getOrderTotal, formatPrice } from '@/utils/billingHelpers';
```

#### **Step 2: Replace all direct field access**

**Before:**
```javascript
// ❌ WRONG
<span>₹{order.amount}</span>
<span>₹{order.total_price / 100}</span>
<span>₹{Number(order.amount).toFixed(2)}</span>
```

**After:**
```javascript
// ✅ CORRECT
const orderTotal = getOrderTotal(order);
<span>{formatPrice(orderTotal)}</span>
```

#### **Step 3: Update payment gateway calls**

**Before:**
```javascript
// ❌ WRONG
const totalAmount = Math.round(order.amount * 100);
```

**After:**
```javascript
// ✅ CORRECT
import { getOrderTotal, rupeesToPaise } from '@/utils/billingHelpers';

const orderTotal = getOrderTotal(order);
const totalAmount = rupeesToPaise(orderTotal);
```

---

## 📝 Quick Fix for OrderDetail.jsx

**Find and replace these lines:**

```javascript
// Line ~549, ~711, ~831 (approximate)
// FIND:
Pay ₹{Number(order.amount).toFixed(2)?.toLocaleString()}

// REPLACE WITH:
import { getOrderTotal, formatPrice } from '@/utils/billingHelpers';

const orderTotal = getOrderTotal(order);
// Then use:
{formatPrice(orderTotal)}
```

**Payment handler fix:**

```javascript
// FIND:
const totalAmount = Math.round(Number(order.amount) * 100);

// REPLACE WITH:
import { getOrderTotal, rupeesToPaise } from '@/utils/billingHelpers';

const orderTotal = getOrderTotal(order);
const totalAmount = rupeesToPaise(orderTotal);
```

---

## 📐 Database View Updates

### **orders_with_item_summary** view

**Updated to include all billing snapshot fields:**

```sql
CREATE OR REPLACE VIEW orders_with_item_summary AS
SELECT 
  o.id AS order_id,
  
  -- ✅ BILLING SNAPSHOT (use these!)
  o.order_total,      -- Grand total with GST
  o.subtotal,         -- Base price without GST
  o.total_gst,        -- Total GST amount
  o.gst_5_total,      -- GST @5%
  o.gst_18_total,     -- GST @18%
  o.shipping_cost,    -- Shipping
  
  -- ⚠️ LEGACY (for backward compatibility only)
  o.total_price,      -- DEPRECATED: paise
  o.amount,           -- DEPRECATED: may be inconsistent
  
  -- ... other fields
FROM orders o
-- ... joins
```

---

## 🧪 Testing Checklist

### **Manual Testing**

1. **Create New Order**
   - [ ] Checkout shows correct total with GST
   - [ ] Order confirmation shows same total
   - [ ] MyOrders page shows same total
   - [ ] OrderDetail page shows same total
   - [ ] Admin panel shows same total
   - [ ] Invoice shows same total

2. **Payment Flow**
   - [ ] "Pay Now" button shows correct amount
   - [ ] PhonePe receives correct amount in paise
   - [ ] Payment confirmation shows correct amount

3. **Admin Panel**
   - [ ] Order list shows correct totals
   - [ ] Order details show correct breakdown
   - [ ] Revenue reports show correct totals

### **Automated Testing**

```javascript
import { getOrderTotal, validateBillingConsistency } from '@/utils/billingHelpers';

// Test order object
const testOrder = {
  order_total: 220.50,
  subtotal: 210.00,
  total_gst: 10.50,
  shipping_cost: 0,
};

// Validate
const total = getOrderTotal(testOrder);  // Should be 220.50
const isValid = validateBillingConsistency(testOrder);  // Should be true

console.log({ total, isValid });  // { total: 220.50, isValid: true }
```

---

## 🐛 Common Pitfalls to Avoid

### **❌ DON'T**
```javascript
// Direct field access
order.amount
order.total_price
order.total_price / 100

// Manual calculations
const total = items.reduce((sum, item) => sum + item.price, 0);

// Inconsistent formatting
₹{order.amount.toFixed(2)}
```

### **✅ DO**
```javascript
// Use centralized helpers
import { getOrderTotal, formatPrice } from '@/utils/billingHelpers';

const orderTotal = getOrderTotal(order);
const displayPrice = formatPrice(orderTotal);
```

---

## 📊 Migration Status

### **Completed** ✅
- [x] Database schema updated with billing snapshot columns
- [x] `orders_with_item_summary` view updated
- [x] Centralized billing helpers created (`billingHelpers.js`)
- [x] `MyOrders.jsx` updated to use helpers
- [x] Migration SQL scripts created

### **Pending** ⚠️
- [ ] `OrderDetail.jsx` - Update to use `getOrderTotal()`
- [ ] `Admin.jsx` - Update admin dashboard order displays
- [ ] `InvoiceGenerator.jsx` - Ensure invoice uses snapshots
- [ ] All admin order management pages
- [ ] Payment confirmation pages

---

## 🚀 Rollout Plan

### **Phase 1: Database** (✅ Complete)
1. Run migration to add billing snapshot columns
2. Update database views to include new fields
3. Backfill existing orders with calculated values

### **Phase 2: Frontend** (In Progress)
1. Create centralized billing helpers
2. Update user-facing pages (MyOrders, OrderDetail)
3. Update admin pages
4. Update invoice generation

### **Phase 3: Cleanup** (Future)
1. Mark `total_price` and `amount` as deprecated
2. Add database constraints to ensure billing snapshot is always populated
3. Remove fallback logic from helpers (enforce snapshot-only)

---

## 📞 Support

If you encounter billing inconsistencies:

1. **Check console logs** - `validateBillingConsistency()` will log warnings
2. **Verify database** - Ensure migrations have run successfully
3. **Use helpers** - Never access `order.amount` or `order.total_price` directly

---

**Last Updated:** 2026-01-30  
**Version:** 1.0  
**Status:** ⚠️ Active Migration in Progress
