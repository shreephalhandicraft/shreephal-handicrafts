import React from "react";
import { Button } from "@/components/ui/button";

const PaymentMethods = ({ onPayNow, onCODPayment, isProcessing, total }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Payment Method
      </h2>
      <div className="space-y-3">
        <Button
          onClick={onPayNow}
          disabled={isProcessing}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isProcessing ? "Processing..." : `Pay Now - ₹${total.toFixed(2)}`}
        </Button>
        <div className="text-center text-gray-500">or</div>
        <Button
          onClick={onCODPayment}
          disabled={isProcessing}
          variant="outline"
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isProcessing ? "Processing..." : "Cash on Delivery"}
        </Button>
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">
        Pay Now: Secure online payment via PhonePe
        <br />
        COD: Pay when your order is delivered
      </p>
    </div>
  );
};

export default PaymentMethods;
