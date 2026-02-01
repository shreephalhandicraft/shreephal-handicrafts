# 💳 Razorpay Payment Gateway Integration

**Branch:** `razorpay-integration`  
**Status:** 🚧 Implementation Complete - Ready for Manual Testing  
**Integration Type:** Embedded Checkout (Modal)  
**Previous Gateway:** PhonePe (Preserved - Commented Out)

---

## 🎯 Overview

This integration adds Razorpay as the payment gateway for Shreephal Handicrafts, replacing PhonePe while preserving all existing logic. The implementation follows a **minimal, incremental approach** to avoid breaking existing functionality.

### ✅ What's Been Implemented

1. **Backend Edge Functions** (Vercel)
   - `/api/payments/razorpay-create-order.js` - Creates Razorpay orders
   - `/api/payments/razorpay-verify.js` - Verifies payments (with idempotency)

2. **Frontend Payment Handler** (New Modular Utility)
   - `/frontend/src/utils/razorpayPaymentHandler.js` - Razorpay integration module

3. **Integration Patch** (Manual Application Required)
   - `/frontend/src/components/CheckOut/useCheckoutLogic.razorpay.patch.js` - Instructions for checkout integration

4. **Configuration**
   - `.env.razorpay.example` - Environment variables template

---

## 🛠️ Manual Steps Required

### Step 1: Apply the Integration Patch

You need to manually modify `/frontend/src/components/CheckOut/useCheckoutLogic.js`:

#### 1.1 Add Import (Line ~10)

```javascript
import { initiateRazorpayPayment } from '@/utils/razorpayPaymentHandler';
```

#### 1.2 Comment Out Old PhonePe URL (Line ~13)

```javascript
// ❌ Temporarily disabled - Razorpay integration
/*
const PHONEPE_PAY_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/pay`
  : "http://localhost:3000/pay";
*/
```

#### 1.3 Replace `handlePayNow` Function (Line ~1050)

Find the existing `handlePayNow` function and replace it with the version from:
```
/frontend/src/components/CheckOut/useCheckoutLogic.razorpay.patch.js
```

**Key changes:**
- Removes PhonePe form submission
- Adds Razorpay modal integration
- Handles success/failure with callbacks
- Clears cart on success

#### 1.4 Comment Out PhonePe Hidden Form (in return JSX)

Find the hidden PhonePe form in the JSX return and comment it out:

```javascript
{/* ❌ Temporarily disabled - Razorpay integration
<form
  ref={payFormRef}
  action={PHONEPE_PAY_URL}
  method="POST"
  style={{ display: 'none' }}
>
  <input type="hidden" id="pp-order-id" name="orderId" />
  <input type="hidden" id="pp-amount" name="amount" />
  ...
</form>
*/}
```

---

### Step 2: Configure Environment Variables

#### 2.1 Get Razorpay Credentials

1. Sign up at [https://razorpay.com](https://razorpay.com)
2. Go to **Dashboard** → **Settings** → **API Keys**
3. Generate **Test Keys** (for development)
4. Copy:
   - **Key ID** (starts with `rzp_test_`)
   - **Key Secret**

#### 2.2 Update Local `.env`

```bash
cp .env.razorpay.example .env
```

Then edit `.env` and add:

```env
# Razorpay Test Keys
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY

# Frontend URL
VITE_FRONTEND_URL=http://localhost:5173
```

#### 2.3 Configure Vercel Environment Variables

1. Go to **Vercel Project** → **Settings** → **Environment Variables**
2. Add:
   - `RAZORPAY_KEY_ID` = `rzp_test_XXXXXXXXXXX`
   - `RAZORPAY_KEY_SECRET` = `YYYYYYYYYYYYYYYY` (✅ Mark as **Secret**)
   - `VITE_FRONTEND_URL` = `https://your-domain.vercel.app`
3. Redeploy the project

---

### Step 3: Test the Integration

#### 3.1 Test Payment Flow

1. **Add items to cart**
2. **Go to checkout**
3. **Fill shipping details**
4. **Click "Pay Now"**
5. **Razorpay modal should open**

#### 3.2 Razorpay Test Cards

**Successful Payment:**
- **Card Number:** `4111 1111 1111 1111`
- **CVV:** Any 3 digits (e.g., `123`)
- **Expiry:** Any future date (e.g., `12/28`)
- **Name:** Any name

**Failed Payment:**
- **Card Number:** `4000 0000 0000 0002`
- **CVV:** Any 3 digits
- **Expiry:** Any future date

**Test UPI:**
- **UPI ID:** `success@razorpay` (for success)
- **UPI ID:** `failure@razorpay` (for failure)

#### 3.3 Verify Database Updates

After successful payment, check Supabase:

1. **`orders` table:**
   - `payment_status` = `'completed'`
   - `payment_method` = `'razorpay'`
   - `transaction_id` = Razorpay payment ID
   - `upi_reference` = Razorpay order ID

2. **`payments` table:**
   - New record created with:
     - `payment_gateway_txn_id` = Razorpay order ID (UNIQUE)
     - `payment_provider_txn_id` = Razorpay payment ID
     - `payment_response` = Full Razorpay response (JSONB)
     - `status` = `'completed'`

---

## 📊 Payment Flow Architecture

```
[🛍️ Cart] → [📦 Checkout] → [📝 Create Order]
                           ↓
                    [📤 Razorpay Order Creation]
                           │ (Backend API)
                           ↓
                    [💳 Razorpay Modal Opens]
                           │ (Embedded Checkout)
                           ↓
                [👤 Customer Completes Payment]
                           ↓
                    [🔐 Payment Verification]
                           │ (Backend API)
                           │ - Verify signature
                           │ - Check idempotency
                           │ - Update database
                           ↓
                    [✅ Success Callback]
                           │
                           │ - Clear cart
                           │ - Show success toast
                           │ - Redirect to order page
                           ↓
                    [🎉 Order Confirmed!]
```

---

## 🔒 Security Features

✅ **Signature Verification:** Every payment is cryptographically verified  
✅ **Idempotency Protection:** Prevents duplicate payment processing  
✅ **UNIQUE Constraints:** Database prevents duplicate transaction IDs  
✅ **Backend Verification:** No client-side payment confirmation accepted  
✅ **Secret Key Protection:** Razorpay secret never exposed to frontend  

---

## 💾 Database Compatibility

### ✅ No Schema Changes Required!

The integration uses existing columns:

| Current Column | Razorpay Usage |
|----------------|----------------|
| `payment_method` | Stores `'razorpay'` |
| `transaction_id` | Stores Razorpay payment ID |
| `upi_reference` | Stores Razorpay order ID |
| `phonepe_response` (JSONB) | Stores full Razorpay response |
| `merchant_transaction_id` | Stores Razorpay order ID (UNIQUE) |
| `phonepe_txn_id` | Stores Razorpay payment ID |

**Optional Future Improvement:**
```sql
-- Rename columns for generic naming (optional)
ALTER TABLE payments RENAME COLUMN phonepe_response TO payment_response;
ALTER TABLE payments RENAME COLUMN merchant_transaction_id TO payment_gateway_txn_id;
ALTER TABLE payments RENAME COLUMN phonepe_txn_id TO payment_provider_txn_id;
```

---

## 🛡️ Error Handling

The integration handles:

✅ **Payment Failures:** User-friendly error messages  
✅ **Network Errors:** Retry logic with exponential backoff  
✅ **Modal Dismissal:** Graceful handling when user closes modal  
✅ **Verification Failures:** Order marked as failed, stock released  
✅ **Duplicate Requests:** Idempotency prevents double-processing  

---

## 🔄 Rollback Instructions

If you need to revert to PhonePe:

1. **Checkout `main` branch:**
   ```bash
   git checkout main
   ```

2. **Uncomment PhonePe code** in `useCheckoutLogic.js`

3. **Update environment variables** to PhonePe credentials

4. **Deploy**

All PhonePe code is preserved and commented out for easy restoration.

---

## ✅ Testing Checklist

- [ ] Order creation successful
- [ ] Razorpay modal opens
- [ ] Test card payment succeeds
- [ ] Cart clears after success
- [ ] Database updated correctly
- [ ] Order page displays
- [ ] Failed payment handled gracefully
- [ ] User closes modal (cancellation works)
- [ ] Stock decremented properly
- [ ] Idempotency prevents duplicates
- [ ] COD still works (separate flow)

---

## 📞 Support & Resources

**Razorpay Documentation:**
- [Checkout Integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/)
- [API Reference](https://razorpay.com/docs/api/)

**Project Support:**
- GitHub Issues: [Report bugs here](https://github.com/shreephalhandicraft/shreephal-handicrafts/issues)
- Integration Questions: Check this document first

---

## 🚀 Production Deployment Checklist

Before going live:

- [ ] Complete Razorpay KYC verification
- [ ] Generate **Live API keys** (not test keys)
- [ ] Update Vercel environment variables with live keys
- [ ] Test with real money (small amount)
- [ ] Verify webhooks (if implemented later)
- [ ] Enable Razorpay auto-capture (or manual capture)
- [ ] Set up settlement bank account
- [ ] Test refunds process
- [ ] Update terms & privacy policy
- [ ] Backup database before deployment

---

**✅ Integration Complete!**  
**Next Step:** Apply manual patches and test thoroughly before merging to `main`.

---

**Created:** February 1, 2026  
**Author:** AI Integration Assistant  
**Branch:** `razorpay-integration`  
**Merge Status:** ⏳ Awaiting Testing & Approval
