import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Lock, Smartphone, Wallet, Truck } from "lucide-react";

const PaymentInterface = ({ total, onPaymentSuccess }) => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === "cardNumber") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim();
    }
    // Format expiry date as MM/YY
    else if (name === "expiryDate") {
      formattedValue = value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "$1/$2");
    }
    // Limit CVV to 3-4 digits
    else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setCardData({
      ...cardData,
      [name]: formattedValue,
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Payment Successful!",
      description: `Payment of $${total.toFixed(
        2
      )} has been processed successfully.`,
    });

    setIsProcessing(false);
    onPaymentSuccess();
  };

  const handleRazorpayPayment = () => {
    // Simulate Razorpay integration
    toast({
      title: "Razorpay Payment",
      description: "Redirecting to Razorpay gateway...",
    });
    setTimeout(() => {
      handlePayment();
    }, 1000);
  };

  const handleStripePayment = () => {
    // Simulate Stripe integration
    toast({
      title: "Stripe Payment",
      description: "Processing payment with Stripe...",
    });
    setTimeout(() => {
      handlePayment();
    }, 1000);
  };

  const handleCodOrder = () => {
    setIsProcessing(true);

    // Simulate order processing for COD
    setTimeout(() => {
      toast({
        title: "Order Placed Successfully!",
        description: `Your order of $${total.toFixed(
          2
        )} has been placed. You can pay when the order is delivered.`,
      });
      setIsProcessing(false);
      onPaymentSuccess();
    }, 1500);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center mb-6">
        <CreditCard className="h-5 w-5 text-primary mr-2" />
        <h2 className="text-xl font-semibold text-gray-900">
          Payment Information
        </h2>
        <Lock className="h-4 w-4 text-gray-400 ml-2" />
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <Label className="text-base font-medium text-gray-900 mb-3 block">
          Choose Payment Method
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedMethod("card")}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === "card"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <CreditCard className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Credit/Debit Card</span>
          </button>

          <button
            onClick={() => setSelectedMethod("razorpay")}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === "razorpay"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Smartphone className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Razorpay</span>
          </button>

          <button
            onClick={() => setSelectedMethod("stripe")}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === "stripe"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Wallet className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Stripe</span>
          </button>

          <button
            onClick={() => setSelectedMethod("cod")}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMethod === "cod"
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Cash on Delivery</span>
          </button>
        </div>
      </div>

      {/* Card Payment Form */}
      {selectedMethod === "card" && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="nameOnCard">Name on Card *</Label>
            <Input
              id="nameOnCard"
              name="nameOnCard"
              required
              value={cardData.nameOnCard}
              onChange={handleCardChange}
              className="mt-1"
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number *</Label>
            <Input
              id="cardNumber"
              name="cardNumber"
              required
              value={cardData.cardNumber}
              onChange={handleCardChange}
              className="mt-1"
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input
                id="expiryDate"
                name="expiryDate"
                required
                value={cardData.expiryDate}
                onChange={handleCardChange}
                className="mt-1"
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV *</Label>
              <Input
                id="cvv"
                name="cvv"
                required
                value={cardData.cvv}
                onChange={handleCardChange}
                className="mt-1"
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cash on Delivery Information */}
      {selectedMethod === "cod" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <Truck className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800">Cash on Delivery</h3>
              <p className="text-sm text-amber-700 mt-1">
                Pay when your order is delivered to your doorstep. Our delivery
                executive will collect the payment.
              </p>
              <ul className="text-sm text-amber-700 mt-2 space-y-1">
                <li>• Cash payment only</li>
                <li>• Please keep exact change ready</li>
                <li>• Additional COD charges may apply</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Payment Total */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900">
            Total Amount
          </span>
          <span className="text-2xl font-bold text-primary">
            ${total.toFixed(2)}
          </span>
        </div>
        {selectedMethod === "cod" && (
          <p className="text-sm text-gray-600 mt-1">
            (Including COD charges if applicable)
          </p>
        )}
      </div>

      {/* Payment Button */}
      <div className="mt-6">
        {selectedMethod === "card" && (
          <Button
            onClick={handlePayment}
            className="w-full h-12 text-lg"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : `Pay $${total.toFixed(2)}`}
          </Button>
        )}

        {selectedMethod === "razorpay" && (
          <Button
            onClick={handleRazorpayPayment}
            className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
            disabled={isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : `Pay with Razorpay $${total.toFixed(2)}`}
          </Button>
        )}

        {selectedMethod === "stripe" && (
          <Button
            onClick={handleStripePayment}
            className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700"
            disabled={isProcessing}
          >
            {isProcessing
              ? "Processing..."
              : `Pay with Stripe $${total.toFixed(2)}`}
          </Button>
        )}

        {selectedMethod === "cod" && (
          <Button
            onClick={handleCodOrder}
            className="w-full h-12 text-lg bg-amber-600 hover:bg-amber-700"
            disabled={isProcessing}
          >
            {isProcessing
              ? "Placing Order..."
              : `Place Order - COD $${total.toFixed(2)}`}
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        {selectedMethod === "cod"
          ? "Your order will be confirmed and prepared for delivery."
          : "Your payment information is secure and encrypted. We never store your card details."}
      </p>
    </div>
  );
};

export default PaymentInterface;
