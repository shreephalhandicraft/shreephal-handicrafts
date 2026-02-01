// api/payments/razorpay-create-order.js - Razorpay Order Creation
// Vercel Edge Function for creating Razorpay orders

// CORS headers for frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export const config = {
  runtime: 'edge',
};

// Manual Base64 encoding for Edge Runtime compatibility
function base64Encode(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  
  // Convert to base64 using btoa with binary string
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  
  return btoa(binary);
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
    console.log('🚀 Razorpay Order Creation Started');

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

    // Razorpay Configuration from environment variables
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials not configured');
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

    // Create Razorpay order payload
    const orderPayload = {
      amount: parseInt(amount) * 100, // Convert to paise (smallest currency unit)
      currency: 'INR',
      receipt: orderId,
      notes: {
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName,
        order_id: orderId,
      },
    };

    console.log('📋 Razorpay Order Payload:', JSON.stringify(orderPayload, null, 2));

    // Create Basic Auth header using manual base64 encoding
    const auth = base64Encode(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    console.log('🔐 Auth header created successfully');

    // Make API call to Razorpay FIRST (before DB update)
    console.log('📤 Calling Razorpay API...');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(orderPayload),
    });

    console.log('📥 Razorpay Response Status:', razorpayResponse.status);

    // Get response text first to handle non-JSON errors
    const responseText = await razorpayResponse.text();
    console.log('📥 Razorpay Response Body:', responseText);

    let razorpayData;
    try {
      razorpayData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse Razorpay response:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid response from payment gateway',
          details: responseText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if order creation was successful
    if (razorpayResponse.ok && razorpayData.id) {
      console.log('✅ Razorpay order created:', razorpayData.id);

      // NOW update order status in Supabase (non-critical)
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          // Try to update with 'online' instead of 'razorpay' to avoid constraint issue
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${orderId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              payment_method: 'online', // Use 'online' instead of 'razorpay'
              payment_status: 'initiated',
              transaction_id: razorpayData.id, // Use Razorpay order ID
              updated_at: new Date().toISOString(),
            }),
          });

          if (!updateResponse.ok) {
            const errorText = await updateResponse.text();
            console.error('⚠️ Failed to update order (non-critical):', errorText);
          } else {
            console.log('✅ Order status updated to payment_initiated');
          }
        }
      } catch (dbError) {
        console.error('⚠️ Database update failed (non-critical):', dbError.message);
      }

      return new Response(
        JSON.stringify({
          success: true,
          razorpayOrderId: razorpayData.id,
          amount: razorpayData.amount,
          currency: razorpayData.currency,
          keyId: RAZORPAY_KEY_ID,
          orderId: orderId,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          customerName: customerName,
          message: 'Razorpay order created successfully',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } else {
      console.error('❌ Razorpay order creation failed:', razorpayData);
      return new Response(
        JSON.stringify({
          success: false,
          message: razorpayData.error?.description || 'Order creation failed',
          details: razorpayData,
        }),
        {
          status: razorpayResponse.status || 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Order creation failed',
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
