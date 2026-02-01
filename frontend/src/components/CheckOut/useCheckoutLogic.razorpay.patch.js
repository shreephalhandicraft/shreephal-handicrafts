// frontend/src/components/CheckOut/useCheckoutLogic.razorpay.patch.js
// 🔧 RAZORPAY INTEGRATION PATCH
// This file contains the modifications needed for useCheckoutLogic.js
// 
// INSTRUCTIONS:
// 1. Add the import at the top of useCheckoutLogic.js
// 2. Replace the handlePayNow function with the new version below
// 3. Comment out the PhonePe form submission code

/* ========================================
   STEP 1: ADD THIS IMPORT AT THE TOP
   ======================================== */

import { initiateRazorpayPayment } from '@/utils/razorpayPaymentHandler';

/* ========================================
   STEP 2: REPLACE handlePayNow FUNCTION
   ======================================== */

// ❌ COMMENT OUT OLD PHONEPE VERSION:
/*
const handlePayNow = useCallback(async () => {
  if (!validateForm()) return;
  if (!validateCartItems()) return;
  if (!validateGSTData()) return;
  
  const stockAvailable = await validateStockAvailability();
  if (!stockAvailable) return;

  setProcessingPayment(true);

  try {
    const cartItemsForPhonePe = items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      customization: item.customization || {},
    }));

    const order = await createOrder("PayNow");

    // PhonePe payment form submission code...
    // (Keep this entire block commented)
  } catch (error) {
    console.error("PayNow failed:", error);
    toast({
      title: "Payment Error",
      description: error.message || "Payment initialization failed",
      variant: "destructive",
    });
    setProcessingPayment(false);
  }
}, [validateForm, validateCartItems, validateGSTData, validateStockAvailability, items, total, formData, createOrder, toast]);
*/

// ✅ NEW RAZORPAY VERSION:
const handlePayNow = useCallback(async () => {
  if (!validateForm()) return;
  if (!validateCartItems()) return;
  if (!validateGSTData()) return;
  
  const stockAvailable = await validateStockAvailability();
  if (!stockAvailable) return;

  setProcessingPayment(true);

  try {
    console.log('\n🚀 STARTING RAZORPAY PAYMENT FLOW');

    // Create order in database first
    const order = await createOrder("razorpay");
    console.log('✅ Order created:', order.id);

    // Get order total (use order_total or grand_total)
    const orderTotal = order.order_total || order.grand_total;
    
    console.log('💰 Payment Details:', {
      orderId: order.id,
      amount: orderTotal,
      customer: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      phone: formData.phone,
    });

    // Initiate Razorpay payment
    await initiateRazorpayPayment({
      orderId: order.id,
      amount: orderTotal,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      
      // Success callback
      onSuccess: async (paymentData) => {
        console.log('✅ PAYMENT SUCCESS CALLBACK:', paymentData);
        
        try {
          // Clear cart
          const cartCleared = await clearCart();
          
          if (!cartCleared) {
            toast({
              title: "Payment Successful - Cart Warning",
              description: "Payment completed but cart clear failed. Please manually clear your cart.",
              variant: "default",
              duration: 8000,
            });
          }

          // Show success message
          toast({
            title: "Payment Successful! 🎉",
            description: `Order #${order.id.slice(0, 8)} has been confirmed. Redirecting...`,
            duration: 3000,
          });

          // Redirect to order page
          setTimeout(() => {
            navigate(`/order/${order.id}`, { replace: true });
          }, 2000);

        } catch (error) {
          console.error('Post-payment processing error:', error);
          toast({
            title: "Payment Successful",
            description: "Your payment was successful. Redirecting to order page...",
            duration: 3000,
          });
          
          setTimeout(() => {
            navigate(`/order/${order.id}`, { replace: true });
          }, 2000);
        }
      },
      
      // Failure callback
      onFailure: async (errorData) => {
        console.error('❌ PAYMENT FAILURE CALLBACK:', errorData);
        
        try {
          // Update order status to failed
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'cancelled',
              order_notes: errorData.error || 'Payment failed',
            })
            .eq('id', order.id);

          // Show error message
          toast({
            title: "Payment Failed",
            description: errorData.error || "Payment could not be completed. Please try again.",
            variant: "destructive",
            duration: 8000,
          });
        } catch (dbError) {
          console.error('Failed to update order status:', dbError);
        }
        
        setProcessingPayment(false);
      },
    });

    // Note: Don't set processingPayment to false here - modal is still open
    // It will be set to false in the callbacks

  } catch (error) {
    console.error('❌ Payment initiation failed:', error);
    
    toast({
      title: "Payment Error",
      description: error.message || "Failed to initiate payment. Please try again.",
      variant: "destructive",
    });
    
    setProcessingPayment(false);
  }
}, [
  validateForm, 
  validateCartItems, 
  validateGSTData, 
  validateStockAvailability, 
  formData, 
  total,
  createOrder, 
  clearCart,
  toast, 
  navigate,
  supabase
]);

/* ========================================
   STEP 3: REMOVE/COMMENT PhonePe FORM
   ======================================== */

// In the JSX return, comment out the PhonePe hidden form:
/*
<form
  ref={payFormRef}
  action={PHONEPE_PAY_URL}
  method="POST"
  style={{ display: 'none' }}
>
  <input type="hidden" id="pp-order-id" name="orderId" />
  <input type="hidden" id="pp-amount" name="amount" />
  <input type="hidden" id="pp-customer-email" name="customerEmail" />
  <input type="hidden" id="pp-customer-phone" name="customerPhone" />
  <input type="hidden" id="pp-customer-name" name="customerName" />
  <input type="hidden" id="pp-cart-items" name="cartItems" />
  <input type="hidden" id="pp-shipping-info" name="shippingInfo" />
</form>
*/

/* ========================================
   STEP 4: UPDATE DEPENDENCIES
   ======================================== */

// Add 'supabase' to the dependency array of handlePayNow if not already present
// Add 'navigate' to the dependency array of handlePayNow if not already present

/* ========================================
   NOTES FOR IMPLEMENTATION
   ======================================== */

// 1. The Razorpay modal is embedded, so no form submission needed
// 2. Payment verification happens automatically via backend API
// 3. Success/failure callbacks handle cart clearing and navigation
// 4. PhonePe code is preserved (commented out) for easy rollback
// 5. All existing validation logic remains unchanged
// 6. Stock reservation and order creation logic unchanged

export default {
  // This is a patch file - no exports needed
  // Follow the instructions above to modify useCheckoutLogic.js
};
