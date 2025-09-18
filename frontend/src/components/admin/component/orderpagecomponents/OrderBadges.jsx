import { Badge } from "@/components/ui/badge";
import {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  CreditCard,
  Banknote,
} from "lucide-react";
import {
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "../orderUtils/OrderUtils.js";

const ICON_MAP = {
  Clock,
  CheckCircle,
  Package,
  Truck,
  XCircle,
  CreditCard,
  Banknote,
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const IconComponent = ICON_MAP[config.icon];

  if (!IconComponent) {
    // Fall back or skip rendering to avoid error
    return <Badge className="gap-1 text-xs">{status}</Badge>;
  }

  return (
    <Badge className={`${config.color} gap-1 text-xs`}>
      <IconComponent className="h-3 w-3" aria-hidden="true" />
      <span className="hidden sm:inline">
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
      <span className="sm:hidden">{status?.charAt(0).toUpperCase()}</span>
    </Badge>
  );
}

export function PaymentMethodBadge({ method }) {
  return method === "COD" ? (
    <Badge variant="outline" className="gap-1 text-xs">
      <Banknote className="h-3 w-3" aria-hidden="true" />
      <span className="hidden sm:inline">Cash on Delivery</span>
      <span className="sm:hidden">COD</span>
    </Badge>
  ) : (
    <Badge variant="outline" className="gap-1 text-xs">
      <CreditCard className="h-3 w-3" aria-hidden="true" />
      <span className="hidden sm:inline">PayNow</span>
      <span className="sm:hidden">Pay</span>
    </Badge>
  );
}

export function PaymentStatusBadge({ status }) {
  const colorClass =
    PAYMENT_STATUS_CONFIG[status] || PAYMENT_STATUS_CONFIG.pending;

  return (
    <Badge className={`${colorClass} text-xs`}>
      <span className="hidden sm:inline">
        {status?.charAt(0).toUpperCase() + status?.slice(1)}
      </span>
      <span className="sm:hidden">{status?.charAt(0).toUpperCase()}</span>
    </Badge>
  );
}

export function ProductionStatusBadge({ status }) {
  if (!status) return null;

  return (
    <Badge variant="outline" className="text-xs">
      <span className="hidden sm:inline">{String(status)}</span>
      <span className="sm:hidden">
        {String(status).charAt(0).toUpperCase()}
      </span>
    </Badge>
  );
}
