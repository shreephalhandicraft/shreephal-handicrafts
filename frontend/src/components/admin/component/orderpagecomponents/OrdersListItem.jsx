import {
  StatusBadge,
  PaymentMethodBadge,
  PaymentStatusBadge,
  ProductionStatusBadge,
} from "./OrderBadges";
import { Button } from "@/components/ui/button";
import { Package, Eye, Edit, Trash2 } from "lucide-react";

export function OrdersListItem({ order, onView, onEdit, onDelete }) {
  const itemsCount = Array.isArray(order.items) ? order.items.length : 0;

  const createdDate = new Date(order.created_at);
  const displayDate = !isNaN(createdDate)
    ? createdDate.toLocaleDateString()
    : "Invalid date";

  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 lg:p-6 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors space-y-4 lg:space-y-0">
      {/* Order Info */}
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-surface-medium rounded-lg flex items-center justify-center flex-shrink-0">
          <Package
            className="w-5 h-5 sm:w-6 sm:h-6 text-primary"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-sm sm:text-base truncate">
            Order #{order.id.slice(0, 8)}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {String(order.customers?.name || "Unknown Customer")}
          </p>
          <p className="text-xs text-muted-foreground">{displayDate}</p>
        </div>
      </div>

      {/* Order Details - Mobile Layout */}
      <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 lg:gap-6">
        {/* Amount and Items */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-medium text-foreground text-sm sm:text-base">
              ₹{Number(order.amount) || 0}
            </p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground text-sm sm:text-base">
              {itemsCount}
            </p>
            <p className="text-xs text-muted-foreground">Items</p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          <StatusBadge status={order.status} />
          <PaymentMethodBadge method={order.payment_method} />
          <PaymentStatusBadge status={order.payment_status} />
          <ProductionStatusBadge status={order.production_status} />
        </div>

        {/* Actions */}
        <div className="flex space-x-1 sm:space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onView(order)}
            aria-label={`View order ${order.id.slice(0, 8)}`}
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(order)}
            aria-label={`Edit order ${order.id.slice(0, 8)}`}
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onDelete(order)}
            aria-label={`Delete order ${order.id.slice(0, 8)}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
