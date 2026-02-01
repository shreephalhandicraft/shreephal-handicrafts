// api/payments/razorpay-verify.js - Razorpay Payment Verification
// Vercel Edge Function for verifying and completing Razorpay payments
// ✅ WITH IDEMPOTENCY PROTECTION

// CORS headers for frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const config = {
  runtime: 'edge',
};

// Helper function to create HMAC-SHA256 signature using Web Crypto API
async function createHmacSignature(secret, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the message
  const signature = await crypto.subtle.sign('HMAC', key, messageData);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    console.log('🔍 Razorpay Payment Verification Started');

    // Parse request body
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = body;

    // Validation
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      console.error('❌ Validation failed:', body);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields',
          required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'orderId'],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Validation passed for order:', orderId);

    // Razorpay Configuration
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay secret not configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment gateway not configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ✅ CRITICAL: Verify Razorpay signature using Web Crypto API
    const message = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = await createHmacSignature(RAZORPAY_KEY_SECRET, message);

    const isSignatureValid = generatedSignature === razorpay_signature;

    console.log('🔐 Signature Verification:', {
      isValid: isSignatureValid,
      razorpay_payment_id,
    });

    if (!isSignatureValid) {
      console.error('❌ Invalid signature! Possible tampering detected.');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment verification failed',
          error: 'Invalid signature',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ✅ CRITICAL: IDEMPOTENCY CHECK - Prevent duplicate processing
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Check if payment already processed
    console.log('🔍 Checking for existing payment record...');
    const checkResponse = await fetch(
      `${supabaseUrl}/rest/v1/payments?payment_gateway_txn_id=eq.${razorpay_order_id}&select=id,status,order_id`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (checkResponse.ok) {
      const existingPayments = await checkResponse.json();
      
      if (existingPayments && existingPayments.length > 0) {
        const existing = existingPayments[0];
        console.log('⚠️ DUPLICATE REQUEST DETECTED!');
        console.log('   Payment already processed:', {
          payment_id: existing.id,
          status: existing.status,
          order_id: existing.order_id
        });
        
        // Return success to prevent retry
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Payment already processed',
            orderId: existing.order_id,
            duplicate: true,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    console.log('✅ No duplicate detected, proceeding with payment completion...');

    // Determine payment status
    const paymentStatus = 'completed';
    const orderStatus = 'confirmed';

    // Update order in Supabase
    try {
      console.log('💾 Updating order status...');

      // Update orders table
      const updateData = {
        status: orderStatus,
        payment_status: paymentStatus,
        transaction_id: razorpay_payment_id,
        upi_reference: razorpay_order_id,
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
        throw new Error(`Order update failed: ${errorText}`);
      }

      const updatedOrders = await updateResponse.json();
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
          const createdPayment = await paymentResponse.json();
          console.log('✅ Payment record created:', createdPayment[0]?.id);
        } else {
          const paymentError = await paymentResponse.text();
          
          // ✅ Check if error is due to unique constraint (duplicate)
          if (paymentError.includes('payment_gateway_txn_id') || 
              paymentError.includes('duplicate key')) {
            console.log('⚠️ Payment record already exists (race condition caught)');
            // This is OK - the unique constraint protected us
          } else {
            console.error('❌ Payment record creation failed:', paymentError);
            // Don't throw - order is already updated, payment can be reconciled later
          }
        }
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      // Log but don't fail the verification - payment is valid
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment verified successfully',
        orderId: orderId,
        paymentId: razorpay_payment_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Payment verification failed',
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
