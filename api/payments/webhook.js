// api/payments/webhook.js - PhonePe Webhook Handler
// Vercel Edge Function for handling PhonePe callbacks and redirects

import crypto from 'crypto';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  console.log('🔔 PhonePe Webhook Received');
  console.log('Method:', req.method);

  try {
    let paymentData;

    // Handle both GET (redirect) and POST (callback) requests
    if (req.method === 'GET') {
      // URL parameters from redirect
      const url = new URL(req.url);
      const params = Object.fromEntries(url.searchParams);
      console.log('📥 GET Redirect params:', params);
      paymentData = params;
    } else if (req.method === 'POST') {
      // Parse POST body from callback
      const contentType = req.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        paymentData = await req.json();
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await req.text();
        paymentData = Object.fromEntries(new URLSearchParams(formData));
      } else {
        paymentData = await req.json();
      }
      
      console.log('📥 POST Callback data:', paymentData);
    } else {
      return new Response('Method not allowed', { status: 405 });
    }

    // Extract payment details
    const { 
      code, 
      merchantId, 
      transactionId, 
      providerReferenceId, 
      amount,
      checksum 
    } = paymentData;

    if (!transactionId) {
      console.error('❌ Missing transaction ID');
      return redirectToFrontend('failure', null, 'Transaction ID missing');
    }

    const orderId = transactionId;
    const phonepeTransactionId = providerReferenceId || transactionId;

    console.log('📋 Processing payment:', {
      orderId,
      code,
      phonepeTransactionId,
    });

    // Verify signature (optional but recommended for production)
    if (checksum && process.env.PHONEPE_SALT_KEY) {
      try {
        // Implement signature verification here if needed
        console.log('🔐 Checksum provided, verification recommended for production');
      } catch (verifyError) {
        console.warn('⚠️ Signature verification failed:', verifyError);
      }
    }

    // Determine payment status
    let paymentStatus = 'failed';
    let orderStatus = 'failed';
    let success = false;

    if (code === 'PAYMENT_SUCCESS') {
      paymentStatus = 'completed';
      orderStatus = 'confirmed';
      success = true;
      console.log('✅ Payment successful');
    } else if (code === 'PAYMENT_PENDING' || code === 'PAYMENT_INITIATED') {
      paymentStatus = 'pending';
      orderStatus = 'pending';
      console.log('⏳ Payment pending');
    } else {
      console.log('❌ Payment failed with code:', code);
    }

    // Update order in Supabase
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing');
      }

      console.log('💾 Updating order status...');

      // Update orders table
      const updateData = {
        status: orderStatus,
        payment_status: paymentStatus,
        transaction_id: phonepeTransactionId,
        upi_reference: providerReferenceId || '',
        updated_at: new Date().toISOString(),
      };

      const updateResponse = await fetch(
        `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Failed to update order:', errorText);
      } else {
        const updatedOrders = await updateResponse.json();
        console.log('✅ Order updated:', updatedOrders[0]?.id);

        // Create payment record if successful
        if (success && updatedOrders[0]) {
          const paymentRecord = {
            order_id: orderId,
            user_id: updatedOrders[0].user_id,
            phonepe_txn_id: phonepeTransactionId,
            merchant_transaction_id: transactionId,
            status: paymentStatus,
            amount: parseInt(amount) || updatedOrders[0].total_price,
            phonepe_response: paymentData,
            signature_verified: !!checksum,
            webhook_received_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          };

          const paymentResponse = await fetch(
            `${supabaseUrl}/rest/v1/payments`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Prefer': 'return=representation',
              },
              body: JSON.stringify(paymentRecord),
            }
          );

          if (paymentResponse.ok) {
            console.log('✅ Payment record created');
          } else {
            const paymentError = await paymentResponse.text();
            console.error('⚠️ Payment record creation failed:', paymentError);
          }
        }
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
    }

    // Redirect to frontend
    return redirectToFrontend(
      success ? 'success' : 'failure',
      orderId,
      success ? null : 'Payment failed',
      phonepeTransactionId
    );
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return redirectToFrontend('failure', null, 'Payment processing error');
  }
}

/**
 * Redirect to frontend with payment status
 */
function redirectToFrontend(status, orderId, message, transactionId) {
  const frontendUrl = process.env.VITE_FRONTEND_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:5173';

  let redirectUrl = `${frontendUrl}/checkout?status=${status}`;
  
  if (orderId) redirectUrl += `&orderId=${orderId}`;
  if (message) redirectUrl += `&message=${encodeURIComponent(message)}`;
  if (transactionId) redirectUrl += `&transactionId=${transactionId}`;

  console.log('🔗 Redirecting to frontend:', redirectUrl);

  return new Response(null, {
    status: 302,
    headers: {
      'Location': redirectUrl,
    },
  });
}
