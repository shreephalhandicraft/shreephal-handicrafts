import { Package } from "lucide-react";

export function OrdersEmptyState() {
  return (
    <div className="text-center py-8 sm:py-10">
      <Package
        className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4"
        aria-hidden="true"
      />
      <p className="text-base sm:text-lg font-medium">No orders found</p>
      <p className="text-muted-foreground text-sm">
        Try adjusting your filters
      </p>
    </div>
  );
}
