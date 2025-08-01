import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoadingCard() {
  return (
    <Card className="border border-gray-200">
      <CardContent className="p-8 sm:p-12">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
              Loading Your Details
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Please wait while we fetch your information...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
