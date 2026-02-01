// api/payments/razorpay-create-order.js - Razorpay Order Creation
// Vercel Node.js Serverless Function for creating Razorpay orders

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
    console.log('🚀 Razorpay Order Creation Started');

    // Parse request body
    const { orderId, amount, customerEmail, customerPhone, customerName } = req.body;

    // Validation
    if (!orderId || !amount || !customerEmail || !customerPhone || !customerName) {
      console.error('❌ Validation failed:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['orderId', 'amount', 'customerEmail', 'customerPhone', 'customerName'],
      });
    }

    console.log('✅ Validation passed for order:', orderId);

    // Razorpay Configuration from environment variables
    const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
    const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error('❌ Razorpay credentials not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured',
      });
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

    // Create Basic Auth using Node.js Buffer (proper encoding)
    const credentials = `${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    console.log('🔐 Auth header created successfully');

    // Make API call to Razorpay FIRST (before DB update)
    console.log('📤 Calling Razorpay API...');
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${base64Credentials}`,
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
      return res.status(500).json({
        success: false,
        message: 'Invalid response from payment gateway',
        details: responseText || 'Empty response',
        status: razorpayResponse.status,
      });
    }

    // Check if order creation was successful
    if (razorpayResponse.ok && razorpayData.id) {
      console.log('✅ Razorpay order created:', razorpayData.id);

      // NOW update order status in Supabase (non-critical)
      try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_method: 'online',
              payment_status: 'initiated',
              transaction_id: razorpayData.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (updateError) {
            console.error('⚠️ Failed to update order (non-critical):', updateError);
          } else {
            console.log('✅ Order status updated to payment_initiated');
          }
        }
      } catch (dbError) {
        console.error('⚠️ Database update failed (non-critical):', dbError.message);
      }

      return res.status(200).json({
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
      });
    } else {
      console.error('❌ Razorpay order creation failed:', razorpayData);
      return res.status(razorpayResponse.status || 400).json({
        success: false,
        message: razorpayData.error?.description || 'Order creation failed',
        details: razorpayData,
      });
    }
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Order creation failed',
      error: error.message,
    });
  }
}
