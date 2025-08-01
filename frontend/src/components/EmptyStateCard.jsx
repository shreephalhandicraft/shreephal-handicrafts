import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export function EmptyStateCard() {
  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardContent className="p-8 sm:p-12 text-center">
        <User className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
          No Personal Details
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
          Add your personal information to complete your profile and enhance
          your shopping experience.
        </p>
      </CardContent>
    </Card>
  );
}
