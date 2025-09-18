import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Filter,
  X,
  Package,
  Clock,
  CheckCircle,
  Banknote,
  CreditCard,
} from "lucide-react";
import { FILTER_OPTIONS } from "../orderUtils/OrderUtils.js";

const ICON_MAP = {
  Package,
  Clock,
  CheckCircle,
  Banknote,
  CreditCard,
};

export function OrdersFilter({
  activeFilter,
  onFilterChange,
  displayedCount,
  filteredCount,
  totalCount,
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          Filter Orders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => {
            const IconComponent = ICON_MAP[filter.icon];
            if (!IconComponent) {
              console.warn(`Icon for filter "${filter.key}" not found.`);
              return null;
            }
            const isActive = activeFilter === filter.key;

            return (
              <Button
                key={filter.key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterChange(isActive ? "" : filter.key)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm"
                aria-pressed={isActive}
                aria-label={
                  isActive
                    ? `Clear filter ${filter.label}`
                    : `Apply filter ${filter.label}`
                }
              >
                <IconComponent
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  aria-hidden="true"
                />
                <span className="hidden sm:inline">{filter.label}</span>
                <span className="sm:hidden">
                  {filter.label.split(" ")[0] || filter.label}
                </span>
                {isActive && <X className="h-3 w-3 ml-1" aria-hidden="true" />}
              </Button>
            );
          })}
        </div>
        <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Showing {displayedCount} of {filteredCount} orders
          {totalCount > 0 && ` (${totalCount} total)`}
        </div>
      </CardContent>
    </Card>
  );
}
