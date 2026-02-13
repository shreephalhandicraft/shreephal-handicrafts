import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, AlertCircle } from "lucide-react";
import { INDIAN_STATES, getCitiesByState } from "@/data/indianLocations";

export function AddressForm({ address, onAddressChange, errors = {} }) {
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");

  // Update cities when state changes
  useEffect(() => {
    if (address.state) {
      const stateCities = getCitiesByState(address.state);
      setCities(stateCities);
      
      // If current city is not in the new state's cities, clear it
      if (address.city && !stateCities.includes(address.city)) {
        onAddressChange("city", "");
      }
    } else {
      setCities([]);
      onAddressChange("city", "");
    }
  }, [address.state]);

  // Filter cities based on search
  const filteredCities = citySearch
    ? cities.filter(city => 
        city.toLowerCase().includes(citySearch.toLowerCase())
      )
    : cities;

  const handleZipCodeChange = (value) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    onAddressChange("zipCode", cleaned);
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader className="pb-4 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Shipping Address
        </CardTitle>
        <p className="text-xs sm:text-sm text-gray-600">
          <span className="text-red-500">*</span> All fields are required for delivery
        </p>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Street Address */}
        <div className="space-y-2">
          <Label htmlFor="street" className="text-sm sm:text-base font-medium">
            Street Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="street"
            value={address.street}
            onChange={(e) => onAddressChange("street", e.target.value)}
            className={`h-10 sm:h-11 ${
              errors.street ? "border-red-500 focus:border-red-500" : ""
            }`}
            placeholder="House/Flat No., Building Name, Street Name"
            required
          />
          {errors.street && (
            <p className="text-red-500 text-xs sm:text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.street}
            </p>
          )}
        </div>

        {/* State Selection */}
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm sm:text-base font-medium">
            State / Union Territory <span className="text-red-500">*</span>
          </Label>
          <Select
            value={address.state}
            onValueChange={(value) => onAddressChange("state", value)}
            required
          >
            <SelectTrigger
              className={`h-10 sm:h-11 ${
                errors.state ? "border-red-500 focus:border-red-500" : ""
              }`}
            >
              <SelectValue placeholder="Select your state" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {INDIAN_STATES.map((state) => (
                <SelectItem key={state.value} value={state.value}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-red-500 text-xs sm:text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.state}
            </p>
          )}
        </div>

        {/* City Selection */}
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm sm:text-base font-medium">
            City <span className="text-red-500">*</span>
          </Label>
          {!address.state ? (
            <div className="h-10 sm:h-11 flex items-center px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
              Please select a state first
            </div>
          ) : cities.length === 0 ? (
            <div className="h-10 sm:h-11 flex items-center px-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm">
              Loading cities...
            </div>
          ) : (
            <Select
              value={address.city}
              onValueChange={(value) => onAddressChange("city", value)}
              required
            >
              <SelectTrigger
                className={`h-10 sm:h-11 ${
                  errors.city ? "border-red-500 focus:border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select your city" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="sticky top-0 bg-white p-2 border-b">
                  <Input
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    className="h-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    No cities found
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
          {errors.city && (
            <p className="text-red-500 text-xs sm:text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.city}
            </p>
          )}
          {address.state && cities.length > 0 && (
            <p className="text-xs text-gray-500">
              {cities.length} cities available in {address.state}
            </p>
          )}
        </div>

        {/* ZIP Code */}
        <div className="space-y-2">
          <Label htmlFor="zipCode" className="text-sm sm:text-base font-medium">
            PIN Code <span className="text-red-500">*</span>
          </Label>
          <Input
            id="zipCode"
            value={address.zipCode}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            className={`h-10 sm:h-11 ${
              errors.zipCode ? "border-red-500 focus:border-red-500" : ""
            }`}
            placeholder="Enter 6-digit PIN code"
            maxLength={6}
            pattern="[0-9]{6}"
            inputMode="numeric"
            required
          />
          {errors.zipCode && (
            <p className="text-red-500 text-xs sm:text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors.zipCode}
            </p>
          )}
          {address.zipCode && address.zipCode.length > 0 && address.zipCode.length < 6 && (
            <p className="text-yellow-600 text-xs sm:text-sm flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              PIN code must be 6 digits ({6 - address.zipCode.length} more needed)
            </p>
          )}
        </div>

        {/* Hidden country field - always India */}
        <input type="hidden" name="country" value="India" />
      </CardContent>
    </Card>
  );
}
