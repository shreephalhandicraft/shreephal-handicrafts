import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import CheckoutForm from "../components/CheckOut/CheckoutForm";
import PaymentMethods from "../components/CheckOut/PaymentMethods";
import OrderSummary from "../components/CheckOut/OrderSummary";
import PaymentStatusHandler from "../components/CheckOut/PaymentStatusHandler";
import LoadingState from "../components/CheckOut/LoadingState";
import { useCheckoutLogic } from "../components/CheckOut/useCheckoutLogic";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const PHONEPE_PAY_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/pay`
  : "http://localhost:3000/pay";

const Checkout = () => {
  const {
    loading,
    processingPayment,
    formData,
    items,
    searchParams,
    payFormRef,
    subtotal,
    tax,
    total,
    handleChange,
    handlePayNow,
    handleCODPayment,
    handlePaymentSuccess,
    handlePaymentFailure,
  } = useCheckoutLogic();

  // State for form validation
  const [formValidation, setFormValidation] = useState({
    isValid: false,
    errors: {},
    formData: {},
  });

  // Handle validation changes from CheckoutForm
  const handleValidationChange = (validationState) => {
    setFormValidation(validationState);

    // Update the checkout logic with the validated form data
    if (validationState.formData) {
      // Sync the validated form data with your checkout logic
      Object.keys(validationState.formData).forEach((key) => {
        handleChange({
          target: {
            name: key,
            value: validationState.formData[key],
          },
        });
      });
    }
  };

  // Handle data loaded from database
  const handleDataLoaded = (loadedData) => {
    console.log("Customer data loaded in checkout:", loadedData);

    // Update checkout logic with loaded data
    Object.keys(loadedData).forEach((key) => {
      if (key !== "isValid") {
        // Skip validation flag
        handleChange({
          target: {
            name: key,
            value: loadedData[key],
          },
        });
      }
    });
  };

  // Enhanced payment handlers that check validation
  const handleValidatedPayNow = () => {
    if (!formValidation.isValid) {
      return; // Payment button should be disabled anyway
    }
    handlePayNow();
  };

  const handleValidatedCODPayment = () => {
    if (!formValidation.isValid) {
      return; // COD button should be disabled anyway
    }
    handleCODPayment();
  };

  // Early returns for different states
  if (items.length === 0 && !loading) {
    return (
      <Layout>
        <div className="py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 mb-8">
              Add some items to your cart before checking out.
            </p>
            <a
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return <LoadingState type="loading" />;
  }

  if (processingPayment && searchParams.get("status")) {
    const status =
      searchParams.get("status") === "success" ? "processing" : "failed";
    return <LoadingState type={status} />;
  }

  return (
    <Layout>
      <PaymentStatusHandler
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />

      <div className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {/* Form validation warning */}
          {!formValidation.isValid &&
            Object.keys(formValidation.errors).length > 0 && (
              <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Please complete all required fields before proceeding with
                  payment.
                </AlertDescription>
              </Alert>
            )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-8">
              <CheckoutForm
                onDataLoaded={handleDataLoaded}
                onValidationChange={handleValidationChange}
              />

              <PaymentMethods
                onPayNow={handleValidatedPayNow}
                onCODPayment={handleValidatedCODPayment}
                isProcessing={processingPayment}
                total={total}
                isFormValid={formValidation.isValid}
                validationErrors={formValidation.errors}
              />
            </div>

            {/* Right Column */}
            <OrderSummary
              items={items}
              subtotal={subtotal}
              tax={tax}
              total={total}
            />
          </div>
        </div>
      </div>

      {/* Hidden PhonePe Form */}
      <form
        ref={payFormRef}
        id="phonepe-pay-form"
        method="POST"
        action={PHONEPE_PAY_URL}
        style={{ display: "none" }}
      >
        <input type="hidden" id="pp-order-id" name="orderId" />
        <input type="hidden" id="pp-amount" name="amount" />
        <input type="hidden" id="pp-customer-email" name="customerEmail" />
        <input type="hidden" id="pp-customer-phone" name="customerPhone" />
        <input type="hidden" id="pp-customer-name" name="customerName" />
        <input type="hidden" id="pp-cart-items" name="cartItems" />
        <input type="hidden" id="pp-shipping-info" name="shippingInfo" />
      </form>
    </Layout>
  );
};

export default Checkout;
