import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit3, X, Check, Loader2 } from "lucide-react";
import { PersonalDetailsHeader } from "./PersonalDetailsHeader";
import { BasicInfoForm } from "./BasicInfoForm";
import { AddressForm } from "./AddressForm";

export function PersonalDetailsForm({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  saving,
  customerId,
  errors = {},
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  // Separate address errors from other errors
  const addressErrors = {};
  const formErrors = {};
  
  Object.keys(errors).forEach(key => {
    if (['street', 'city', 'state', 'zipCode', 'country'].includes(key)) {
      addressErrors[key] = errors[key];
    } else {
      formErrors[key] = errors[key];
    }
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <PersonalDetailsHeader
        icon={Edit3}
        title={customerId ? "Edit Personal Details" : "Add Personal Details"}
        subtitle="Update your profile information"
      />

      {/* Show general form errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium text-sm">
            Please correct the following errors:
          </p>
          <ul className="mt-2 space-y-1 text-red-700 text-sm list-disc list-inside">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <span className="font-medium capitalize">
                  {field.replace(/([A-Z])/g, ' $1').trim()}:
                </span>{' '}
                {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      <BasicInfoForm 
        formData={formData} 
        onInputChange={handleInputChange}
        errors={formErrors}
      />

      <AddressForm
        address={formData.address}
        onAddressChange={handleAddressChange}
        errors={addressErrors}
      />

      <Card className="border border-gray-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-between">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="order-2 sm:order-1 w-full sm:w-auto px-6 sm:px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              size="lg"
              className="order-1 sm:order-2 w-full sm:w-auto px-6 sm:px-8"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
