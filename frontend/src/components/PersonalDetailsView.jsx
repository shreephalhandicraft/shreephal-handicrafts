import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Edit3 } from "lucide-react";
import { PersonalDetailsHeader } from "./PersonalDetailsHeader";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { AddressInfoCard } from "./AddressInfoCard";
import { EmptyStateCard } from "./EmptyStateCard";

export function PersonalDetailsView({ formData, onEditClick }) {
  const getProfileCompleteness = () => {
    const fields = [
      formData.name,
      formData.email,
      formData.phone,
      formData.bio,
      formData.address.street,
      formData.address.city,
      formData.address.state,
      formData.address.zipCode,
      formData.address.country,
    ];
    const filledFields = fields.filter(
      (field) => field && field.trim() !== ""
    ).length;
    return Math.round((filledFields / fields.length) * 100);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <PersonalDetailsHeader
        icon={User}
        title="Personal Details"
        subtitle="Manage your profile information"
        profileCompleteness={getProfileCompleteness()}
        showCompleteness={true}
      />

      {formData.name ? (
        <div className="grid gap-4 sm:gap-6">
          <PersonalInfoCard formData={formData} />
          <AddressInfoCard address={formData.address} />
        </div>
      ) : (
        <EmptyStateCard />
      )}

      <div className="flex justify-center pt-4">
        <Button
          onClick={onEditClick}
          size="lg"
          className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
        >
          <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          {formData.name ? "Edit Details" : "Add Details"}
        </Button>
      </div>
    </div>
  );
}
