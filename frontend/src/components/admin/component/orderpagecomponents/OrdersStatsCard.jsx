import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrdersStatsCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-muted-foreground",
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">
          {title}
        </CardTitle>
        {Icon ? (
          <Icon
            className={`h-4 w-4 flex-shrink-0 ${iconColor}`}
            aria-hidden="true"
            title={title}
          />
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
