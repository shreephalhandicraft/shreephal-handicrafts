import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OrdersEmptyState } from "./OrdersEmptyState";
import { LoadMoreButton } from "./LoadMoreButton";
import { OrdersListItem } from "./OrdersListItem";

export function OrdersList({
  orders,
  hasMore,
  loadingMore,
  onLoadMore,
  onViewOrder,
  onEditOrder,
  onDeleteOrder,
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          Orders ({orders.length})
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Manage and track all customer orders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {orders.length === 0 ? (
            <OrdersEmptyState />
          ) : (
            <>
              {orders.map((order) => (
                <OrdersListItem
                  key={order.id}
                  order={order}
                  onView={onViewOrder}
                  onEdit={onEditOrder}
                  onDelete={onDeleteOrder}
                />
              ))}

              {hasMore && (
                <LoadMoreButton onLoadMore={onLoadMore} loading={loadingMore} />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
