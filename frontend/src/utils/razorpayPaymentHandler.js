// frontend/src/utils/razorpayPaymentHandler.js
// Razorpay Payment Integration Handler
// Modular payment handler to avoid modifying existing checkout logic

/**
 * Load Razorpay SDK dynamically
 * @returns {Promise<boolean>} True if loaded successfully
 */
export const loadRazorpaySDK = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Razorpay) {
      console.log('✅ Razorpay SDK already loaded');
      resolve(true);
      return;
    }

    console.log('📦 Loading Razorpay SDK...');

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      console.log('✅ Razorpay SDK loaded successfully');
      resolve(true);
    };

    script.onerror = () => {
      console.error('❌ Failed to load Razorpay SDK');
      reject(new Error('Failed to load Razorpay payment gateway'));
    };

    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order via backend API
 * @param {Object} orderData - Order details
 * @returns {Promise<Object>} Razorpay order response
 */
export const createRazorpayOrder = async (orderData) => {
  console.log('🔄 Creating Razorpay order...');

  try {
    const apiUrl = import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL}/api/payments/razorpay-create-order`
      : '/api/payments/razorpay-create-order';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to create Razorpay order');
    }

    console.log('✅ Razorpay order created:', data.razorpayOrderId);
    return data;
  } catch (error) {
    console.error('❌ Razorpay order creation failed:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment via backend API
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verification response
 */
export const verifyRazorpayPayment = async (paymentData) => {
  console.log('🔐 Verifying Razorpay payment...');

  try {
    const apiUrl = import.meta.env.VITE_BACKEND_URL
      ? `${import.meta.env.VITE_BACKEND_URL}/api/payments/razorpay-verify`
      : '/api/payments/razorpay-verify';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Payment verification failed');
    }

    console.log('✅ Payment verified successfully');
    return data;
  } catch (error) {
    console.error('❌ Payment verification failed:', error);
    throw error;
  }
};

/**
 * Initialize Razorpay checkout and handle payment
 * @param {Object} options - Payment options
 * @param {string} options.orderId - Database order ID
 * @param {number} options.amount - Amount in rupees
 * @param {string} options.customerName - Customer name
 * @param {string} options.customerEmail - Customer email
 * @param {string} options.customerPhone - Customer phone
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onFailure - Failure callback
 * @returns {Promise<void>}
 */
export const initiateRazorpayPayment = async (options) => {
  const {
    orderId,
    amount,
    customerName,
    customerEmail,
    customerPhone,
    onSuccess,
    onFailure,
  } = options;

  try {
    console.log('\n🎯 INITIATING RAZORPAY PAYMENT FLOW');
    console.log('   Order ID:', orderId);
    console.log('   Amount:', `₹${amount}`);

    // Step 1: Load Razorpay SDK
    await loadRazorpaySDK();

    // Step 2: Create Razorpay order via backend
    const razorpayOrderResponse = await createRazorpayOrder({
      orderId,
      amount,
      customerEmail,
      customerPhone,
      customerName,
    });

    const {
      razorpayOrderId,
      keyId,
      amount: razorpayAmount,
      currency,
    } = razorpayOrderResponse;

    console.log('✅ Razorpay Order Details:');
    console.log('   Razorpay Order ID:', razorpayOrderId);
    console.log('   Amount (paise):', razorpayAmount);
    console.log('   Currency:', currency);

    // Step 3: Configure Razorpay Checkout
    const razorpayOptions = {
      key: keyId,
      amount: razorpayAmount,
      currency: currency,
      name: 'Shreephal Handicrafts',
      description: `Order #${orderId.slice(0, 8)}`,
      order_id: razorpayOrderId,
      
      // Customer details (pre-fill)
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      
      // ✅ UPI-FIRST CONFIGURATION for Indian users
      config: {
        display: {
          blocks: {
            // UPI block - shown first
            upi: {
              name: 'Pay with UPI',
              instruments: [
                {
                  method: 'upi',
                  flows: ['collect', 'qr', 'intent'],  // ✅ FIX: Enable all UPI flows (QR, ID, Apps)
                },
              ],
            },
            // Other payment methods
            other: {
              name: 'Other Payment Methods',
              instruments: [
                {
                  method: 'card',
                },
                {
                  method: 'netbanking',
                },
                {
                  method: 'wallet',
                },
              ],
            },
          },
          // Show UPI first, then other methods
          sequence: ['block.upi', 'block.other'],
          preferences: {
            show_default_blocks: false, // Use custom blocks only
          },
        },
      },
      
      // Theme customization (matching your brand)
      theme: {
        color: '#10b981', // Green theme
      },
      
      // Modal configuration
      modal: {
        ondismiss: function () {
          console.log('⚠️ User closed payment modal');
          if (onFailure) {
            onFailure({
              error: 'Payment cancelled by user',
              orderId: orderId,
            });
          }
        },
      },
      
      // Payment success handler
      handler: async function (response) {
        console.log('\n✅ PAYMENT SUCCESSFUL - Razorpay Response:');
        console.log('   Payment ID:', response.razorpay_payment_id);
        console.log('   Order ID:', response.razorpay_order_id);
        console.log('   Signature:', response.razorpay_signature);

        try {
          // Step 4: Verify payment on backend
          const verificationResult = await verifyRazorpayPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderId: orderId,
          });

          console.log('✅ Payment verified on backend');

          // Call success callback
          if (onSuccess) {
            onSuccess({
              orderId: verificationResult.orderId,
              paymentId: verificationResult.paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
            });
          }
        } catch (verificationError) {
          console.error('❌ Payment verification failed:', verificationError);
          
          if (onFailure) {
            onFailure({
              error: verificationError.message,
              orderId: orderId,
              razorpayPaymentId: response.razorpay_payment_id,
            });
          }
        }
      },
    };

    // Step 5: Open Razorpay checkout modal
    console.log('\n💳 Opening Razorpay Checkout Modal with UPI-first...');
    const razorpayInstance = new window.Razorpay(razorpayOptions);
    
    // Handle payment failures
    razorpayInstance.on('payment.failed', function (response) {
      console.error('❌ PAYMENT FAILED:', response);
      console.error('   Error Code:', response.error.code);
      console.error('   Error Description:', response.error.description);
      console.error('   Reason:', response.error.reason);

      if (onFailure) {
        onFailure({
          error: response.error.description || 'Payment failed',
          errorCode: response.error.code,
          reason: response.error.reason,
          orderId: orderId,
          metadata: response.error.metadata,
        });
      }
    });

    // Open the modal
    razorpayInstance.open();
    console.log('✅ Razorpay modal opened with UPI as first option');

  } catch (error) {
    console.error('❌ RAZORPAY PAYMENT INITIATION FAILED:', error);
    
    if (onFailure) {
      onFailure({
        error: error.message || 'Failed to initiate payment',
        orderId: orderId,
      });
    }
  }
};

/**
 * User-friendly error message mapping
 */
const RAZORPAY_ERROR_MESSAGES = {
  'BAD_REQUEST_ERROR': 'Invalid payment request. Please try again.',
  'GATEWAY_ERROR': 'Payment gateway error. Please try again in a few minutes.',
  'SERVER_ERROR': 'Server error. Please try again later.',
  'NETWORK_ERROR': 'Network connection failed. Please check your internet.',
  'PAYMENT_CANCELLED': 'Payment was cancelled. You can retry anytime.',
};

/**
 * Get user-friendly error message
 * @param {string} errorCode - Razorpay error code
 * @returns {string} User-friendly message
 */
export const getRazorpayErrorMessage = (errorCode) => {
  return RAZORPAY_ERROR_MESSAGES[errorCode] || 'Payment failed. Please try again.';
};

export default {
  loadRazorpaySDK,
  createRazorpayOrder,
  verifyRazorpayPayment,
  initiateRazorpayPayment,
  getRazorpayErrorMessage,
};
