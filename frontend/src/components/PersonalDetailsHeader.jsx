import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PersonalDetailsHeader({
  icon: Icon,
  title,
  subtitle,
  profileCompleteness,
  showCompleteness = false,
}) {
  return (
    <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                {subtitle}
              </p>
            </div>
          </div>
          {showCompleteness && (
            <div className="flex flex-col items-center gap-2">
              <div className="text-xs sm:text-sm text-gray-600">
                Profile Complete
              </div>
              <Badge
                variant={profileCompleteness > 80 ? "default" : "secondary"}
                className="text-xs sm:text-sm px-2 sm:px-3 py-1"
              >
                {profileCompleteness}%
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
