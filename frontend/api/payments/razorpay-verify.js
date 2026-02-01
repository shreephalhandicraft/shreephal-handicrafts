// api/payments/razorpay-verify.js - Razorpay Payment Verification
// Vercel Node.js Serverless Function for verifying and completing Razorpay payments
// ✅ WITH IDEMPOTENCY PROTECTION

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// CORS headers for frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
    });
  }

  try {
    console.log('🔍 Razorpay Payment Verification Started');

    // Parse request body
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      console.error('❌ Validation failed:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'orderId'],
      });
    }

    console.log('✅ Validation passed for order:', orderId);

    // Razorpay Configuration
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay secret not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured',
      });
    }

    // ✅ CRITICAL: Verify Razorpay signature using Node.js crypto
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(message)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpay_signature;

    console.log('🔐 Signature Verification:', {
      isValid: isSignatureValid,
      razorpay_payment_id,
    });

    if (!isSignatureValid) {
      console.error('❌ Invalid signature! Possible tampering detected.');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: 'Invalid signature',
      });
    }

    // ✅ CRITICAL: IDEMPOTENCY CHECK - Prevent duplicate processing
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if payment already processed
    console.log('🔍 Checking for existing payment record...');
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('id, status, order_id')
      .eq('payment_gateway_txn_id', razorpay_order_id)
      .limit(1);

    if (existingPayments && existingPayments.length > 0) {
      const existing = existingPayments[0];
      console.log('⚠️ DUPLICATE REQUEST DETECTED!');
      console.log('   Payment already processed:', {
        payment_id: existing.id,
        status: existing.status,
        order_id: existing.order_id
      });

      // Return success to prevent retry
      return res.status(200).json({
        success: true,
        message: 'Payment already processed',
        orderId: existing.order_id,
        duplicate: true,
      });
    }

    console.log('✅ No duplicate detected, proceeding with payment completion...');

    // Determine payment status
    const paymentStatus = 'completed';
    const orderStatus = 'confirmed';

    // Update order in Supabase
    try {
      console.log('💾 Updating order status...');

      // Update orders table
      const { data: updatedOrders, error: updateError } = await supabase
        .from('orders')
        .update({
          status: orderStatus,
          payment_status: paymentStatus,
          transaction_id: razorpay_payment_id,
          upi_reference: razorpay_order_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select();

      if (updateError) {
        console.error('❌ Failed to update order:', updateError);
        throw new Error(`Order update failed: ${updateError.message}`);
      }

      console.log('✅ Order updated:', updatedOrders[0]?.id);

      // ✅ Create payment record with idempotency protection
      if (updatedOrders[0]) {
        const paymentRecord = {
          order_id: orderId,
          user_id: updatedOrders[0].user_id,
          payment_provider_txn_id: razorpay_payment_id,
          payment_gateway_txn_id: razorpay_order_id,  // ✅ UNIQUE constraint prevents duplicates
          status: paymentStatus,
          amount: updatedOrders[0].grand_total || updatedOrders[0].order_total,
          payment_method: 'razorpay',
          payment_response: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            signature_verified: true,
            payment_gateway: 'razorpay',
          },
          initiated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        };

        console.log('💳 Creating payment record...');
        const { data: createdPayment, error: paymentError } = await supabase
          .from('payments')
          .insert(paymentRecord)
          .select();

        if (paymentError) {
          // ✅ Check if error is due to unique constraint (duplicate)
          if (paymentError.message.includes('payment_gateway_txn_id') ||
              paymentError.message.includes('duplicate key')) {
            console.log('⚠️ Payment record already exists (race condition caught)');
            // This is OK - the unique constraint protected us
          } else {
            console.error('❌ Payment record creation failed:', paymentError);
            // Don't throw - order is already updated, payment can be reconciled later
          }
        } else {
          console.log('✅ Payment record created:', createdPayment[0]?.id);
        }
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Log but don't fail the verification - payment is valid
    }

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      orderId: orderId,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
}
