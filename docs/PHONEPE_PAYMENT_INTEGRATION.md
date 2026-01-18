# 📱 PhonePe Payment Integration Guide

## Overview

This document explains how PhonePe payment integration works in the Shreephal Handicrafts application.

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│  Vercel API  │─────▶│   PhonePe   │
│  (Checkout) │      │  /payments   │      │     API     │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │                      │
       │                     ▼                      │
       │              ┌──────────────┐              │
       │              │   Supabase   │              │
       │              │   Database   │              │
       │              └──────────────┘              │
       │                                            │
       └────────────── Redirect after payment ◀────┘
```

## Payment Flow

### 1. **Payment Initiation** (`/api/payments/initiate`)

**Frontend Request:**
```javascript
const response = await fetch('/api/payments/initiate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'uuid-of-order',
    amount: 1500, // in rupees
    customerEmail: 'customer@example.com',
    customerPhone: '9876543210',
    customerName: 'John Doe'
  })
});

const { paymentUrl } = await response.json();
window.location.href = paymentUrl; // Redirect to PhonePe
```

**Backend Process:**
1. ✅ Validates all required fields
2. ✅ Updates order status to `payment_initiated` in database
3. ✅ Creates PhonePe payment payload
4. ✅ Generates checksum for security
5. ✅ Calls PhonePe API
6. ✅ Returns payment URL to frontend

**Database Changes:**
```sql
UPDATE orders 
SET 
  payment_method = 'phonepe',
  payment_status = 'initiated',
  transaction_id = 'order-uuid',
  updated_at = NOW()
WHERE id = 'order-uuid';
```

---

### 2. **User Completes Payment on PhonePe**

User is redirected to PhonePe's payment page where they:
- Choose payment method (UPI, Card, NetBanking, etc.)
- Complete payment
- PhonePe processes the transaction

---

### 3. **Payment Webhook/Redirect** (`/api/payments/webhook`)

After payment, PhonePe sends user back to our webhook endpoint.

**PhonePe Sends (POST/GET):**
```json
{
  "code": "PAYMENT_SUCCESS",
  "merchantId": "PGTESTPAYUAT86",
  "transactionId": "order-uuid",
  "providerReferenceId": "phonepe-txn-id-12345",
  "amount": "150000", // in paise
  "checksum": "signature"
}
```

**Backend Process:**
1. ✅ Receives payment status from PhonePe
2. ✅ Verifies signature (optional but recommended)
3. ✅ Updates order status based on payment result
4. ✅ Creates payment record in `payments` table
5. ✅ Redirects user to frontend with status

**Database Changes:**

**Orders Table:**
```sql
UPDATE orders 
SET 
  status = 'confirmed', -- or 'failed'
  payment_status = 'completed', -- or 'failed'
  transaction_id = 'phonepe-txn-id-12345',
  upi_reference = 'phonepe-txn-id-12345',
  updated_at = NOW()
WHERE id = 'order-uuid';
```

**Payments Table:**
```sql
INSERT INTO payments (
  order_id,
  user_id,
  phonepe_txn_id,
  merchant_transaction_id,
  status,
  amount,
  phonepe_response,
  signature_verified,
  webhook_received_at,
  completed_at
) VALUES (
  'order-uuid',
  'user-uuid',
  'phonepe-txn-id-12345',
  'order-uuid',
  'completed',
  1500,
  '{...}', -- Full PhonePe response
  true,
  NOW(),
  NOW()
);
```

---

### 4. **Frontend Redirect**

User is redirected back to frontend:

**Success:**
```
https://your-domain.com/checkout?status=success&orderId=xxx&transactionId=yyy
```

**Failure:**
```
https://your-domain.com/checkout?status=failure&orderId=xxx&message=Payment+failed
```

---

## Environment Variables Setup

### Required Variables:

```env
# Supabase (for database operations)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # For server-side operations

# PhonePe Sandbox (for testing)
PHONEPE_MERCHANT_ID=PGTESTPAYUAT86
PHONEPE_SALT_KEY=96434309-7796-489d-8924-ab56988a6076
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox

# Frontend URL (for redirects)
VITE_FRONTEND_URL=https://your-domain.vercel.app
```

### Production Variables:

```env
# PhonePe Production (replace after going live)
PHONEPE_MERCHANT_ID=your_production_merchant_id
PHONEPE_SALT_KEY=your_production_salt_key
PHONEPE_SALT_INDEX=1
PHONEPE_BASE_URL=https://api.phonepe.com/apis/hermes
```

---

## API Endpoints

### 1. POST `/api/payments/initiate`

**Purpose:** Initiate PhonePe payment

**Request:**
```json
{
  "orderId": "uuid",
  "amount": 1500,
  "customerEmail": "user@example.com",
  "customerPhone": "9876543210",
  "customerName": "John Doe"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "paymentUrl": "https://mercury-uat.phonepe.com/...",
  "merchantTransactionId": "order-uuid",
  "message": "Payment initiated successfully"
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

### 2. POST/GET `/api/payments/webhook`

**Purpose:** Handle PhonePe callback/redirect

**PhonePe Sends:**
```json
{
  "code": "PAYMENT_SUCCESS",
  "merchantId": "PGTESTPAYUAT86",
  "transactionId": "order-uuid",
  "providerReferenceId": "phonepe-txn-12345",
  "amount": "150000",
  "checksum": "xxx###1"
}
```

**Response:** 
- Redirects to frontend with status parameters

---

## Payment Status Codes

| Code | Meaning | Order Status | Payment Status |
|------|---------|--------------|----------------|
| `PAYMENT_SUCCESS` | Payment completed | `confirmed` | `completed` |
| `PAYMENT_PENDING` | Payment in progress | `pending` | `pending` |
| `PAYMENT_FAILED` | Payment declined | `failed` | `failed` |
| `PAYMENT_INITIATED` | Payment started | `pending` | `initiated` |

---

## Testing

### Test Payment on Sandbox

1. **Use Test Credentials:**
   - Merchant ID: `PGTESTPAYUAT86`
   - Salt Key: `96434309-7796-489d-8924-ab56988a6076`

2. **Test Payment Flow:**
   ```bash
   # Create order in frontend
   POST /checkout
   
   # Initiate payment
   POST /api/payments/initiate
   
   # PhonePe redirects to test page
   # Select "Success" or "Failure" scenario
   
   # Webhook receives callback
   # User redirected back to /checkout?status=success
   ```

3. **Test Cards (PhonePe Sandbox):**
   - Success: Select "Success" in test page
   - Failure: Select "Failure" in test page

---

## Database Schema

### Orders Table Updates:
```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'PayNow';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS upi_reference TEXT;
```

### Payments Table (Already Exists):
See schema provided - includes:
- `order_id`, `user_id`
- `phonepe_txn_id`, `merchant_transaction_id`
- `status`, `amount`
- `phonepe_response` (JSONB)
- `signature_verified`, `webhook_received_at`

---

## Security Best Practices

### 1. **Signature Verification**
```javascript
// Verify PhonePe signature
const checksumString = response + saltKey;
const calculatedChecksum = crypto.createHash('sha256')
  .update(checksumString)
  .digest('hex') + '###' + saltIndex;

if (calculatedChecksum !== receivedChecksum) {
  throw new Error('Invalid signature');
}
```

### 2. **Environment Variables**
- ✅ Never commit `.env` file
- ✅ Use Vercel Environment Variables UI
- ✅ Separate sandbox and production credentials

### 3. **Database Security**
- ✅ Use Supabase Service Role Key for server-side operations
- ✅ Never expose service role key in frontend
- ✅ Enable Row Level Security (RLS) on Supabase tables

---

## Common Issues & Solutions

### Issue 1: "Payment gateway not configured"
**Solution:** 
- Ensure `PHONEPE_MERCHANT_ID` and `PHONEPE_SALT_KEY` are set in Vercel environment variables
- Redeploy after adding variables

### Issue 2: "Order not found"
**Solution:**
- Verify order was created in database before initiating payment
- Check `orderId` matches the order UUID in database

### Issue 3: "Webhook not called"
**Solution:**
- Check Vercel function logs
- Ensure webhook URL is accessible (not localhost)
- Verify PhonePe sandbox is working

### Issue 4: "Payment stuck in 'initiated'"
**Solution:**
- User may have closed payment page
- Check PhonePe transaction status API
- Implement timeout logic to mark as failed after 30 minutes

---

## Production Checklist

- [ ] Replace sandbox credentials with production credentials
- [ ] Update `PHONEPE_BASE_URL` to production URL
- [ ] Test payment with real money (₹1)
- [ ] Enable signature verification
- [ ] Set up monitoring for failed payments
- [ ] Configure webhook retry logic
- [ ] Add customer email notifications
- [ ] Set up admin dashboard for payment tracking

---

## Support

**PhonePe Documentation:**
- API Docs: https://developer.phonepe.com/docs
- Dashboard: https://business.phonepe.com/

**Supabase Documentation:**
- Docs: https://supabase.com/docs
- Dashboard: https://app.supabase.com/

**Vercel Documentation:**
- Edge Functions: https://vercel.com/docs/functions/edge-functions
- Environment Variables: https://vercel.com/docs/environment-variables

---

## Next Steps

1. ✅ Test payment flow in sandbox
2. ✅ Verify order status updates correctly
3. ✅ Test failure scenarios
4. ✅ Add frontend UI for payment status
5. ✅ Implement order confirmation email
6. ✅ Move to production when ready
