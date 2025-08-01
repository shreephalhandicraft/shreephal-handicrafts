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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      <PersonalDetailsHeader
        icon={Edit3}
        title={customerId ? "Edit Personal Details" : "Add Personal Details"}
        subtitle="Update your profile information"
      />

      <BasicInfoForm formData={formData} onInputChange={handleInputChange} />

      <AddressForm
        address={formData.address}
        onAddressChange={handleAddressChange}
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
