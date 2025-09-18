import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";

export function OrderDetailsDelivery({ deliveryInfo }) {
  if (!deliveryInfo) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
            Delivery Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No delivery information available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
          Delivery Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {deliveryInfo.estimated_date && (
            <div>
              <span className="font-medium text-sm">Estimated Date:</span>
              <p className="text-sm">{String(deliveryInfo.estimated_date)}</p>
            </div>
          )}
          {deliveryInfo.estimated_time && (
            <div>
              <span className="font-medium text-sm">Estimated Time:</span>
              <p className="text-sm">{String(deliveryInfo.estimated_time)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
