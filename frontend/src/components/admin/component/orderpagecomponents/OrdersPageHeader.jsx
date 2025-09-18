// components/orders/OrdersPageHeader.jsx

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function OrdersPageHeader({ onRefresh }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
          Orders
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
          Manage customer orders and shipments
        </p>
      </div>
      <Button
        onClick={onRefresh}
        variant="outline"
        className="gap-2 self-start"
        size="sm"
      >
        <RefreshCw className="h-4 w-4" />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );
}
