import { useMemo } from "react";
import { Package, Clock, Banknote, IndianRupee } from "lucide-react";
import { OrdersStatsCard } from "./OrdersStatsCard";
import { calculateOrderStats } from "../orderUtils/OrderUtils";

export function OrdersStatsGrid({ orders }) {
  const stats = useMemo(() => calculateOrderStats(orders), [orders]) || {};

  const { total = 0, pending = 0, codOrders = 0, revenue = 0 } = stats;

  // Format revenue with commas, fallback to 0
  const formattedRevenue =
    typeof revenue === "number" ? revenue.toLocaleString("en-IN") : revenue;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <OrdersStatsCard title="Total Orders" value={total} icon={Package} />
      <OrdersStatsCard
        title="Pending"
        value={pending}
        icon={Clock}
        iconColor="text-yellow-500"
      />
      <OrdersStatsCard
        title="COD Orders"
        value={codOrders}
        icon={Banknote}
        iconColor="text-green-500"
      />
      <OrdersStatsCard
        title="Revenue"
        value={`₹${formattedRevenue}`}
        icon={IndianRupee}
        iconColor="text-blue-500"
      />
    </div>
  );
}
