# 📚 Database Functions Reference

**Last Updated:** January 24, 2026  
**Total Functions:** 20 (↑ 5 new helper functions)  
**Purpose:** Complete reference for all database functions, triggers, and stored procedures

---

## 📖 Table of Contents

### Core Functions
1. [Stock Management](#1-stock-management) - 9 functions
2. [Order Processing](#2-order-processing) - 2 functions
3. [Product Calculations](#3-product-calculations) - 2 functions
4. [Data Migration](#4-data-migration) - 1 function
5. [Triggers](#5-triggers) - 6 functions

---

## 1. Stock Management (9 Functions)

### 1.1 `decrement_variant_stock()` 🔒 **CRITICAL**

**Purpose:** Atomically decrements stock with row-level locking to prevent overselling (race conditions)

**Signature:**
```sql
CREATE FUNCTION decrement_variant_stock(
  p_variant_id uuid,
  p_quantity integer
) RETURNS boolean
```

**Usage:**
```javascript
// Frontend (JavaScript/TypeScript)
const { data, error } = await supabase.rpc('decrement_variant_stock', {
  p_variant_id: 'variant-uuid-here',
  p_quantity: 2
});

if (error) {
  console.error('Stock decrement failed:', error.message);
  // Error messages:
  // - "Variant not found: <uuid>"
  // - "Insufficient stock. Available: X, Requested: Y"
}
```

---

### 1.2 `reserve_variant_stock()` ⭐ **RECOMMENDED**

**Purpose:** Reserve stock temporarily (expires in 15 minutes if not confirmed)

**Signature:**
```sql
CREATE FUNCTION reserve_variant_stock(
  p_variant_id uuid,
  p_user_id uuid,
  p_quantity integer,
  p_order_id uuid DEFAULT NULL
) RETURNS uuid  -- Returns reservation_id
```

**Usage:**
```javascript
// Reserve stock when adding to cart
const { data: reservationId, error } = await supabase.rpc('reserve_variant_stock', {
  p_variant_id: variantId,
  p_user_id: user.id,
  p_quantity: 2,
  p_order_id: null  // Optional
});

// Store in cart_items
await supabase.from('cart_items').insert({
  variant_id: variantId,
  quantity: 2,
  reservation_id: reservationId  // 🆕 Link reservation
});
```

---

### 1.3 `confirm_stock_reservation()`

**Purpose:** Confirm a reservation and decrement actual stock

**Signature:**
```sql
CREATE FUNCTION confirm_stock_reservation(
  p_reservation_id uuid
) RETURNS boolean
```

**Usage:**
```javascript
// During checkout
const { data, error } = await supabase.rpc('confirm_stock_reservation', {
  p_reservation_id: reservationId
});

if (data === true) {
  // Stock decremented, proceed with payment
}
```

---

### 1.4 `confirm_multiple_reservations()` 🆕 **NEW**

**Purpose:** Confirm multiple reservations atomically (all-or-nothing)

**Signature:**
```sql
CREATE FUNCTION confirm_multiple_reservations(
  p_reservation_ids uuid[]
) RETURNS jsonb
```

**Usage:**
```javascript
// Confirm entire cart at checkout
const reservationIds = cartItems.map(item => item.reservation_id);

const { data, error } = await supabase.rpc('confirm_multiple_reservations', {
  p_reservation_ids: reservationIds
});

if (error) {
  // All reservations rolled back automatically
  console.error('Checkout failed:', error.message);
} else {
  // All stock decremented successfully
  console.log('Confirmed:', data.confirmed_count);
}
```

**Why Use This:**
- ✅ Atomic operation (all succeed or all fail)
- ✅ Prevents partial checkout failures
- ✅ Single database round-trip

---

### 1.5 `get_available_stock()` 🆕 **NEW**

**Purpose:** Get real-time available stock (total - active reservations)

**Signature:**
```sql
CREATE FUNCTION get_available_stock(
  p_variant_id uuid
) RETURNS integer
```

**Usage:**
```javascript
// Show accurate availability on product page
const { data: availableStock, error } = await supabase.rpc('get_available_stock', {
  p_variant_id: variantId
});

console.log(`${availableStock} items available`);
// Accounts for items in other users' carts
```

**Calculation:**
```
Available = Total Stock - Active Reservations (unconfirmed, not expired)
```

---

### 1.6 `extend_reservation()` 🆕 **NEW**

**Purpose:** Extend reservation expiry time (default: +15 minutes, max: 60)

**Signature:**
```sql
CREATE FUNCTION extend_reservation(
  p_reservation_id uuid,
  p_extension_minutes integer DEFAULT 15
) RETURNS timestamp  -- Returns new expiry time
```

**Usage:**
```javascript
// Extend reservation before checkout
const { data: newExpiry, error } = await supabase.rpc('extend_reservation', {
  p_reservation_id: reservationId,
  p_extension_minutes: 10  // Add 10 more minutes
});

console.log('Extended until:', new Date(newExpiry));
```

**When to Use:**
- User is on checkout page (about to complete purchase)
- User actively viewing cart
- Payment processing taking longer than expected

---

### 1.7 `cancel_reservation()` 🆕 **NEW**

**Purpose:** Cancel/delete a reservation (releases stock immediately)

**Signature:**
```sql
CREATE FUNCTION cancel_reservation(
  p_reservation_id uuid
) RETURNS boolean
```

**Usage:**
```javascript
// When user removes item from cart
const { data: cancelled, error } = await supabase.rpc('cancel_reservation', {
  p_reservation_id: reservationId
});

if (cancelled) {
  console.log('Stock released back to inventory');
}
```

**Returns:**
- `true` - Reservation cancelled successfully
- `false` - Reservation not found or already confirmed

---

### 1.8 `check_reservation_status()` 🆕 **NEW**

**Purpose:** Get detailed reservation status including countdown timer

**Signature:**
```sql
CREATE FUNCTION check_reservation_status(
  p_reservation_id uuid
) RETURNS jsonb
```

**Usage:**
```javascript
// Display countdown timer in cart
const { data: status, error } = await supabase.rpc('check_reservation_status', {
  p_reservation_id: reservationId
});

if (status.exists && !status.is_expired) {
  console.log(`Time remaining: ${status.time_remaining_readable}`);
  // "Time remaining: 12 minutes"
} else {
  console.log('Reservation expired - please refresh cart');
}
```

**Response Structure:**
```json
{
  "exists": true,
  "reservation_id": "uuid",
  "variant_id": "uuid",
  "quantity": 2,
  "confirmed": false,
  "expires_at": "2026-01-24T17:05:00Z",
  "is_expired": false,
  "time_remaining_seconds": 720,
  "time_remaining_minutes": 12.0,
  "time_remaining_readable": "12 minutes"
}
```

---

### 1.9 `expire_old_stock_reservations()`

**Purpose:** Clean up expired reservations (runs via cron every 5 minutes)

**Signature:**
```sql
CREATE FUNCTION expire_old_stock_reservations()
RETURNS integer  -- Returns count of deleted reservations
```

**Cron Setup:**
```sql
-- Automated cleanup (already configured)
SELECT cron.schedule(
  'expire-stock-reservations',
  '*/5 * * * *',  -- Every 5 minutes
  'SELECT expire_old_stock_reservations();'
);
```

**Manual Execution:**
```sql
SELECT expire_old_stock_reservations();
-- Returns: 3 (deleted 3 expired reservations)
```

---

### 1.10 `decrement_product_stock()` ⚠️ **DEPRECATED**

**Status:** Legacy function - use `decrement_variant_stock()` instead

---

## 2. Order Processing (2 Functions)

### 2.1 `backfill_order_items()`

**Purpose:** One-time migration from `orders.items` JSONB to `order_items` table

**Usage:**
```sql
SELECT * FROM backfill_order_items();
```

---

### 2.2 `extract_customization_files()`

**Purpose:** Extract customization file URLs for audit/cleanup

**Usage:**
```sql
SELECT * FROM extract_customization_files();
```

---

## 3. Product Calculations (2 Functions)

### 3.1 `compute_product_base_price()`

**Purpose:** Get minimum price across all active variants

**Usage:**
```javascript
const { data: price } = await supabase.rpc('compute_product_base_price', {
  product_uuid: productId
});

console.log(`Starting from ₹${price / 100}`);
```

---

### 3.2 `compute_product_in_stock()`

**Purpose:** Check if any variant is in stock

**Usage:**
```javascript
const { data: inStock } = await supabase.rpc('compute_product_in_stock', {
  product_uuid: productId
});
```

---

## 4. Data Migration (1 Function)

### 4.1 `prevent_order_items_jsonb_write()` 🔒 **TRIGGER**

**Purpose:** Block writes to deprecated `orders.items` column

**Type:** BEFORE INSERT/UPDATE Trigger

---

## 5. Triggers (6 Functions)

### 5.1 `handle_new_user()` - Auto-create customer profile
### 5.2 `update_updated_at_column()` - Auto-update timestamps
### 5.3 `update_product_category_slug()` - Auto-generate slugs
### 5.4 `update_product_price_on_variant_change()` - Sync product prices
### 5.5 `update_product_stock_status_on_variant_change()` - Sync stock status

---

## 📊 Function Usage Summary

### 🆕 New Reservation Helpers (5)
| Function | Purpose | When to Use |
|----------|---------|-------------|
| `get_available_stock()` | Real-time availability | Product pages, filters |
| `extend_reservation()` | Add more time | Before checkout, payment |
| `cancel_reservation()` | Release stock | Remove from cart |
| `check_reservation_status()` | Get timer info | Cart countdown display |
| `confirm_multiple_reservations()` | Batch confirm | Checkout (entire cart) |

### Production Critical (Use Always)
| Function | Purpose | When to Use |
|----------|---------|-------------|
| `reserve_variant_stock()` | Reserve stock | Add to cart |
| `confirm_stock_reservation()` | Confirm single | Checkout (single item) |
| `decrement_variant_stock()` | Direct decrement | Admin, manual ops |
| `compute_product_base_price()` | Get min price | Product listings |
| `compute_product_in_stock()` | Check availability | Product cards |

### Maintenance Functions
| Function | Purpose | Frequency |
|----------|---------|----------|
| `expire_old_stock_reservations()` | Cleanup | Cron: Every 5 min |
| `backfill_order_items()` | Migrate data | One-time |
| `extract_customization_files()` | Audit files | On-demand |

---

## 🔄 Stock Reservation Flow

```
┌────────────────────────────────┐
│  USER ADDS ITEM TO CART        │
└────────────────────────────────┘
           │
           ↓
┌────────────────────────────────┐
│  reserve_variant_stock()      │
│  Returns: reservation_id       │
└────────────────────────────────┘
           │
           ↓
┌────────────────────────────────┐
│  Stock Reserved (15 min)       │
│  Timer: 14:59... 14:58...     │
└────────────────────────────────┘
           │
      ┌────┼────┐
      │         │
      ↓         ↓
┌────────┐  ┌───────────┐
│ CHECKOUT│  │ TIMEOUT   │
└────────┘  └───────────┘
      │              │
      ↓              ↓
confirm()      expire()
Stock ↓        Stock released
```

---

## 🧪 Testing Guide

### Test Complete Reservation Flow:
```sql
BEGIN;  -- Safe test transaction

-- 1. Create test variant
INSERT INTO product_variants (id, product_id, sku, price, stock_quantity)
VALUES ('test-var-001', gen_random_uuid(), 'TEST-001', 1000, 10);

-- 2. Reserve stock
SELECT reserve_variant_stock('test-var-001'::uuid, auth.uid(), 2, NULL) 
AS reservation_id \gset

-- 3. Check available stock
SELECT get_available_stock('test-var-001'::uuid);
-- Expected: 8 (10 total - 2 reserved)

-- 4. Check reservation status
SELECT check_reservation_status(:'reservation_id');

-- 5. Extend reservation
SELECT extend_reservation(:'reservation_id', 10);

-- 6. Confirm reservation
SELECT confirm_stock_reservation(:'reservation_id');

-- 7. Verify stock decremented
SELECT stock_quantity FROM product_variants WHERE id = 'test-var-001';
-- Expected: 8

ROLLBACK;  -- Clean up
```

---

## 📞 Support

For questions:
1. Check this documentation
2. Review SQL files in `/database/migrations/`
3. Test in Supabase SQL Editor
4. Check logs for errors

---

**Maintained by:** Development Team  
**Last Review:** January 24, 2026  
**Version:** 2.0.0 (↑ Major update: Added 5 helper functions)
