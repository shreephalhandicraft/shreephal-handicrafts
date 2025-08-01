import { useState } from "react";
import { RefreshCw } from "lucide-react";

// Hooks
import { useOrders } from "../component/hooks/useOrdersFilter";
import { useOrdersFilter } from "../component/hooks/useOrdersFilter";

// Components
import { OrdersPageHeader } from "../component/orderpagecomponents/OrdersPageHeader";
import { OrdersFilter } from "../component/orderpagecomponents/OrdersFilter";
import { OrdersStatsGrid } from "../component/orderpagecomponents/OrdersStatsGrid";
import { OrdersList } from "../component/orderpagecomponents/OrdersList";
import { OrderViewDialog } from "../component/orderpagecomponents/OrderViewDialog";
import { OrderEditDialog } from "../component/orderpagecomponents/OrderEditDialog";
import { OrderDeleteDialog } from "../component/orderpagecomponents/OrderDeleteDialog";

export function OrdersPage() {
  // Data management
  const {
    orders,
    loading,
    totalOrders,
    fetchOrders,
    updateOrder,
    deleteOrder,
  } = useOrders();
  const {
    filteredOrders,
    displayedOrders,
    activeFilter,
    hasMore,
    loadingMore,
    applyFilter,
    loadMoreOrders,
  } = useOrdersFilter(orders);

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [deleteOrderState, setDeleteOrderState] = useState(null);

  // Event handlers
  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setIsEditDialogOpen(true);
  };

  const handleDeleteOrder = (order) => {
    setDeleteOrderState(order);
  };

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      const success = await updateOrder(orderId, updates);
      if (success) {
        setIsEditDialogOpen(false);
        setEditingOrder(null);
      } else {
        // Optionally log or inform user
        console.error("Failed to update order.");
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteOrderState) return;

    try {
      const success = await deleteOrder(deleteOrderState.id);
      if (success) {
        setDeleteOrderState(null);
      } else {
        console.error("Failed to delete order.");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-base sm:text-lg font-medium">
            Loading orders...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <OrdersPageHeader onRefresh={handleRefresh} />

      {/* Filter */}
      <OrdersFilter
        activeFilter={activeFilter}
        onFilterChange={applyFilter}
        displayedCount={displayedOrders.length}
        filteredCount={filteredOrders.length}
        totalCount={totalOrders}
      />

      {/* Stats */}
      <OrdersStatsGrid orders={orders} />

      {/* Orders List */}
      <OrdersList
        orders={displayedOrders}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={loadMoreOrders}
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onDeleteOrder={handleDeleteOrder}
      />

      {/* Dialogs */}
      <OrderViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        order={selectedOrder}
      />

      <OrderEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        order={editingOrder}
        onSave={handleUpdateOrder}
      />

      <OrderDeleteDialog
        open={!!deleteOrderState}
        onOpenChange={() => setDeleteOrderState(null)}
        order={deleteOrderState}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
