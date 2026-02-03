import React, { useState, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import CheckoutForm from "../components/CheckOut/CheckoutForm";
import PaymentMethods from "../components/CheckOut/PaymentMethods";
import OrderSummary from "../components/CheckOut/OrderSummary";
import PaymentStatusHandler from "../components/CheckOut/PaymentStatusHandler";
import LoadingState from "../components/CheckOut/LoadingState";
import { useCheckoutLogic } from "../components/CheckOut/useCheckoutLogic";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShoppingBag } from "lucide-react";

const Checkout = () => {
  const {
    loading,
    processingPayment,
    formData,
    items,
    searchParams,
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

  // ✅ FIX MEDIUM BUG #1: Wrap in useCallback to prevent infinite loop
  // Handle validation changes from CheckoutForm
  const handleValidationChange = useCallback((validationState) => {
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
  }, [handleChange]); // Only recreate if handleChange changes

  // ✅ FIX: Wrap in useCallback for stability
  // Handle data loaded from database
  const handleDataLoaded = useCallback((loadedData) => {
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
  }, [handleChange]); // Only recreate if handleChange changes

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
          <div className="container mx-auto px-4">
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Your Cart is Empty
              </h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Add some items to your cart before checking out.
                Start shopping to find amazing handicrafts!
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/shop">
                  <Button size="lg" className="px-8">
                    Browse Products
                  </Button>
                </Link>
                <Link to="/categories">
                  <Button size="lg" variant="outline" className="px-8">
                    View Categories
                  </Button>
                </Link>
              </div>
            </div>
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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {/* Form validation warning */}
          {!formValidation.isValid &&
            Object.keys(formValidation.errors).length > 0 && (
              <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  ⚠ Please review and complete all required fields below
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
    </Layout>
  );
};

export default Checkout;
