import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, Loader2, AlertTriangle } from "lucide-react";

// 💰 Price formatting helper
const formatPrice = (price) => {
  return (price || 0).toLocaleString("en-IN", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

const PaymentMethods = ({ 
  onPayNow, 
  onCODPayment, 
  isProcessing, 
  total, 
  isFormValid,
  validationErrors 
}) => {
  const hasErrors = validationErrors && Object.keys(validationErrors).length > 0;
  
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Payment Method
      </h2>
      
      {/* Form Validation Warning */}
      {!isFormValid && hasErrors && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Please complete all required fields
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Fill in your delivery details to proceed with payment
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Pay Now Button - Prominent */}
        <Button
          onClick={onPayNow}
          disabled={isProcessing || !isFormValid}
          className="w-full h-16 text-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5 mr-2" />
              Pay Now - ₹{formatPrice(total)}
            </>
          )}
        </Button>
        
        {/* OR Separator */}
        <div className="relative">
          <Separator className="my-4" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500 font-medium">
            or
          </span>
        </div>
        
        {/* Cash on Delivery Button */}
        <Button
          onClick={onCODPayment}
          disabled={isProcessing || !isFormValid}
          variant="outline"
          className="w-full h-14 text-lg border-2 hover:border-primary hover:bg-primary/5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing Order...
            </>
          ) : (
            <>
              <Banknote className="h-5 w-5 mr-2" />
              Cash on Delivery
            </>
          )}
        </Button>
      </div>
      
      {/* Payment Information */}
      <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-start gap-2">
            <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-blue-700">Pay Now:</strong> Secure payment via UPI, Cards, Netbanking & Wallets
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Banknote className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-green-700">COD:</strong> Pay when your order is delivered (handling fee may apply)
            </p>
          </div>
        </div>
      </div>
      
      {/* Disabled State Helper */}
      {!isFormValid && (
        <p className="text-xs text-center text-gray-500 mt-4">
          Complete the form above to enable payment options
        </p>
      )}
    </div>
  );
};

export default PaymentMethods;
