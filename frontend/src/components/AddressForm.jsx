import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

export function AddressForm({ address, onAddressChange }) {
  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Address Information
        </CardTitle>
        <p className="text-xs sm:text-sm text-gray-600">
          Optional but helps with delivery and location-based services
        </p>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <Label htmlFor="street" className="text-sm sm:text-base font-medium">
            Street Address
          </Label>
          <Input
            id="street"
            value={address.street}
            onChange={(e) => onAddressChange("street", e.target.value)}
            className="h-10 sm:h-11"
            placeholder="Enter your street address"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm sm:text-base font-medium">
              City
            </Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => onAddressChange("city", e.target.value)}
              className="h-10 sm:h-11"
              placeholder="Enter your city"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm sm:text-base font-medium">
              State/Province
            </Label>
            <Input
              id="state"
              value={address.state}
              onChange={(e) => onAddressChange("state", e.target.value)}
              className="h-10 sm:h-11"
              placeholder="Enter your state"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="zipCode"
              className="text-sm sm:text-base font-medium"
            >
              ZIP/Postal Code
            </Label>
            <Input
              id="zipCode"
              value={address.zipCode}
              onChange={(e) => onAddressChange("zipCode", e.target.value)}
              className="h-10 sm:h-11"
              placeholder="Enter ZIP code"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="country"
              className="text-sm sm:text-base font-medium"
            >
              Country
            </Label>
            <Input
              id="country"
              value={address.country}
              onChange={(e) => onAddressChange("country", e.target.value)}
              className="h-10 sm:h-11"
              placeholder="Enter your country"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
