import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { formatShippingInfo } from "../orderUtils/OrderUtils";

export function OrderDetailsShipping({ shippingInfo, customerName }) {
  const formatted = formatShippingInfo(shippingInfo);

  if (formatted.component === "NoShippingInfo") {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
            Shipping Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{formatted.message}</p>
        </CardContent>
      </Card>
    );
  }

  const { data } = formatted;

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
          Shipping Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Customer Name (use prop, not data.name) */}
          {customerName && (
            <div className="flex justify-start">
              <span className="font-medium text-sm">Customer Name: </span>
              <span className="text-sm ml-2">{customerName}</span>
            </div>
          )}

          {data.address && (
            <div>
              <span className="font-medium text-sm">Address:</span>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {data.address}
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.city && (
              <div className="flex justify-start">
                <span className="font-medium text-sm">City:</span>
                <span className="text-sm ml-2">{data.city}</span>
              </div>
            )}
            {data.state && (
              <div className="flex justify-start">
                <span className="font-medium text-sm">State:</span>
                <span className="text-sm ml-2">{data.state}</span>
              </div>
            )}
            {data.pincode && (
              <div className="flex justify-start">
                <span className="font-medium text-sm">Pincode:</span>
                <span className="text-sm ml-2">{data.pincode}</span>
              </div>
            )}
            {data.phone && (
              <div className="flex justify-start">
                <span className="font-medium text-sm">Phone:</span>
                <span className="text-sm ml-2">{data.phone}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
