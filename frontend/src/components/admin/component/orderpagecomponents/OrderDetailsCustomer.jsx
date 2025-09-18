import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { PaymentMethodBadge, PaymentStatusBadge } from "./OrderBadges";

export function OrderDetailsCustomer({ customer, customerId }) {
  if (!customer) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <User className="h-4 w-4 sm:h-5 sm:w-5" />
          Customer Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {customer?.id && (
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="font-medium text-sm">Customer ID:</span>
            <span className="text-sm font-mono break-all">
              {String(customer.id)}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="font-medium text-sm">Payment:</span>
          <PaymentMethodBadge method={customer.payment_method} />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="font-medium text-sm">Payment Status:</span>
          <PaymentStatusBadge status={customer.payment_status} />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="font-medium text-sm">Total Amount:</span>
          <span className="font-bold text-base sm:text-lg">
            ₹{String(customer.amount || 0)}
          </span>
        </div>
        {customer.transaction_id && (
          <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
            <span className="font-medium text-sm">Transaction ID:</span>
            <span className="text-sm font-mono break-all">
              {String(customer.transaction_id)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
