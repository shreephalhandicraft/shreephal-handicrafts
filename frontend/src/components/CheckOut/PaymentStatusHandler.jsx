import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const PaymentStatusHandler = ({ onPaymentSuccess, onPaymentFailure }) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const paymentStatus = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const transactionId = searchParams.get("transactionId");

    if (paymentStatus && orderId) {
      if (paymentStatus === "success") {
        console.log("🎉 Payment success detected, handling...");
        onPaymentSuccess(orderId, transactionId);
      } else if (paymentStatus === "failure") {
        console.log("❌ Payment failure detected");
        onPaymentFailure(orderId, searchParams.get("message"));
      }
    }
  }, [searchParams, onPaymentSuccess, onPaymentFailure]);

  return null; // This component doesn't render anything
};

export default PaymentStatusHandler;
