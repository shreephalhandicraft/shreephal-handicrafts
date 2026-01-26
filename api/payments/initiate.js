// api/payments/initiate.js - PhonePe Payment Initiation Endpoint
// Vercel Edge Function for initiating PhonePe payments

import crypto from 'crypto';

// CORS headers for frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const config = {
  runtime: 'edge',
};

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
    console.log('🚀 PhonePe Payment Initiation Started');

    // Parse request body
    const body = await req.json();
    const { orderId, amount, customerEmail, customerPhone, customerName } = body;

    // Validation
    if (!orderId || !amount || !customerEmail || !customerPhone || !customerName) {
      console.error('❌ Validation failed:', body);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Missing required fields',
          required: ['orderId', 'amount', 'customerEmail', 'customerPhone', 'customerName'],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✅ Validation passed for order:', orderId);

    // PhonePe Configuration from environment variables
    const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
    const SALT_KEY = process.env.PHONEPE_SALT_KEY;
    const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || '1';
    const BASE_URL = process.env.PHONEPE_BASE_URL || 'https://api-preprod.phonepe.com/apis/pg-sandbox';

    if (!MERCHANT_ID || !SALT_KEY) {
      console.error('❌ PhonePe credentials not configured');
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

    // Generate callback and redirect URLs
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    const redirectUrl = `${baseUrl}/api/payments/webhook`;
    const callbackUrl = `${baseUrl}/api/payments/webhook`;

    console.log('🔗 Generated URLs:', { redirectUrl, callbackUrl });

    // Create PhonePe payment payload
    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: orderId,
      merchantUserId: `USER_${Date.now()}`,
      amount: parseInt(amount) * 100, // Convert to paise (smallest currency unit)
      redirectUrl: redirectUrl,
      redirectMode: 'POST',
      callbackUrl: callbackUrl,
      mobileNumber: customerPhone.replace(/\D/g, '').slice(-10), // Last 10 digits only
      paymentInstrument: {
        type: 'PAY_PAGE',
      },
    };

    console.log('📋 Payment Payload:', JSON.stringify(paymentPayload, null, 2));

    // Encode payload to base64
    const base64Payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');

    // Generate checksum: base64_payload + endpoint + salt_key
    const checksumString = base64Payload + '/pg/v1/pay' + SALT_KEY;
    const sha256Hash = crypto.createHash('sha256').update(checksumString).digest('hex');
    const checksum = sha256Hash + '###' + SALT_INDEX;

    console.log('🔐 Generated checksum');

    // Update order status in Supabase
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase configuration missing');
      }

      // Update order to "payment_initiated"
      const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          payment_method: 'phonepe',
          payment_status: 'initiated',
          transaction_id: orderId,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Failed to update order:', errorText);
      } else {
        console.log('✅ Order status updated to payment_initiated');
      }
    } catch (dbError) {
      console.error('⚠️ Database update failed (non-critical):', dbError.message);
    }

    // Make API call to PhonePe
    console.log('📤 Calling PhonePe API...');
    const phonepeResponse = await fetch(`${BASE_URL}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'accept': 'application/json',
      },
      body: JSON.stringify({ request: base64Payload }),
    });

    const phonepeData = await phonepeResponse.json();
    console.log('📥 PhonePe Response:', JSON.stringify(phonepeData, null, 2));

    // Check if payment initiation was successful
    if (phonepeData.success && phonepeData.data?.instrumentResponse?.redirectInfo?.url) {
      const paymentUrl = phonepeData.data.instrumentResponse.redirectInfo.url;
      console.log('✅ PhonePe payment URL generated:', paymentUrl);

      return new Response(
        JSON.stringify({
          success: true,
          paymentUrl: paymentUrl,
          merchantTransactionId: orderId,
          message: 'Payment initiated successfully',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('❌ PhonePe initiation failed:', phonepeData);
      return new Response(
        JSON.stringify({
          success: false,
          message: phonepeData.message || 'Payment initiation failed',
          details: phonepeData,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('❌ Payment initiation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Payment initiation failed',
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
