import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Phone, FileText } from "lucide-react";
import { InfoItem } from "./InfoItem";

export function PersonalInfoCard({ formData }) {
  return (
    <Card className="border border-gray-200 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        <div className="grid gap-4 sm:gap-6">
          <InfoItem icon={User} label="Full Name" value={formData.name} />

          <InfoItem
            icon={Mail}
            label="Email Address"
            value={formData.email || "Not provided"}
          />

          {formData.phone && (
            <InfoItem
              icon={Phone}
              label="Phone Number"
              value={formData.phone}
            />
          )}

          {formData.bio && (
            <InfoItem
              icon={FileText}
              label="Bio"
              value={formData.bio}
              multiline={true}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
