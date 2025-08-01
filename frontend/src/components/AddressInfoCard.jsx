import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Home, Globe } from "lucide-react";
import { InfoItem } from "./InfoItem";

export function AddressInfoCard({ address }) {
  const hasAddressInfo =
    address.street ||
    address.city ||
    address.state ||
    address.zipCode ||
    address.country;

  if (!hasAddressInfo) return null;

  return (
    <Card className="border border-gray-200 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Address Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:gap-4">
          {address.street && (
            <InfoItem
              icon={Home}
              label="Street Address"
              value={address.street}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {address.city && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">City</p>
                <p className="font-medium text-sm">{address.city}</p>
              </div>
            )}
            {address.state && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">State</p>
                <p className="font-medium text-sm">{address.state}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {address.zipCode && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">ZIP Code</p>
                <p className="font-medium text-sm">{address.zipCode}</p>
              </div>
            )}
            {address.country && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Globe className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Country</p>
                  <p className="font-medium text-sm">{address.country}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
