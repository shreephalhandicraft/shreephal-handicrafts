import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, CreditCard, Package, Clock } from "lucide-react";
import {
  StatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
} from "./OrderBadges";

export function OrderDetailsOrder({ order }) {
  if (!order) return null;

  const createdDate = order.created_at ? new Date(order.created_at) : null;
  const displayDate =
    createdDate && !isNaN(createdDate)
      ? createdDate.toLocaleString()
      : "Unknown date";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Package className="h-4 w-4 sm:h-5 sm:w-5" />
          Order Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="font-medium text-sm flex items-center gap-1">
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            Order Date:
          </span>
          <span className="text-sm">{displayDate}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="font-medium text-sm flex items-center gap-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Status:
          </span>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="font-medium text-sm flex items-center gap-1">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Payment Method:
          </span>
          <PaymentMethodBadge method={order.payment_method} />
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
          <span className="font-medium text-sm">Order Total:</span>
          <span className="font-bold text-base sm:text-lg">
            ₹{order.amount || 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
