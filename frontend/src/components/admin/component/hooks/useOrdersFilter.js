import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { ORDERS_PER_PAGE } from "../orderUtils/OrderUtils.js";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  
  // ✅ FIX BUG #4: Track which orders are being updated
  const [updatingIds, setUpdatingIds] = useState(new Set());
  
  const { toast } = useToast();

  const fetchOrders = async (reset = true) => {
    try {
      setLoading(reset);

      // ✅ FIX BUG #1: Use order_details_full view instead of orders table
      console.log("🔍 Admin: Fetching orders from order_details_full view...");

      const { data, error } = await supabase
        .from("order_details_full")
        .select("*")
        .order("order_date", { ascending: false })
        .limit(ORDERS_PER_PAGE * 2 * 5);

      if (error) throw error;

      console.log(`✅ Fetched ${data?.length || 0} order item rows from view`);

      // ✅ Group rows by order_id (view returns one row per order item)
      const groupedOrders = {};
      
      (data || []).forEach((row) => {
        const orderId = row.order_id;

        if (!groupedOrders[orderId]) {
          groupedOrders[orderId] = {
            id: row.order_id,
            order_id: row.order_id,
            user_id: row.user_id,
            customer_id: row.customer_id,
            status: row.order_status,
            payment_status: row.payment_status,
            amount: row.order_total,
            order_total: row.order_total,
            created_at: row.order_date,
            order_date: row.order_date,
            updated_at: row.updated_at,
            shipping_info: row.shipping_info,
            delivery_info: row.delivery_info,
            payment_method: row.payment_method,
            transaction_id: row.transaction_id,
            order_notes: row.order_notes,
            customers: {
              id: row.customer_id,
              user_id: row.user_id,
              name: row.customer_name,
              email: row.customer_email,
              phone: row.customer_phone,
              address: row.customer_address,
            },
            items: [],
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            customer_phone: row.customer_phone,
          };
        }

        groupedOrders[orderId].items.push({
          item_id: row.item_id,
          product_id: row.product_id,
          variant_id: row.variant_id,
          catalog_number: row.catalog_number,
          quantity: row.quantity,
          unit_price: row.unit_price,
          item_total: row.item_total,
          customization_data: row.customization_data,
          production_notes: row.production_notes,
          product_name: row.product_name,
          product_description: row.product_description,
          product_image: row.product_image,
          sku: row.sku,
          size_display: row.size_display,
          size_numeric: row.size_numeric,
          size_unit: row.size_unit,
          price_tier: row.price_tier,
          category_id: row.category_id,
          category_name: row.category_name,
        });
      });

      const ordersArray = Object.values(groupedOrders);
      
      console.log(`✅ Grouped into ${ordersArray.length} orders`);

      setOrders(ordersArray);
      setTotalOrders(ordersArray.length);

    } catch (err) {
      console.error("❌ Fetch error:", err);
      toast({
        title: "Error fetching orders",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX BUG #4: Optimistic update implementation
  const updateOrder = async (orderId, updates) => {
    // Prevent duplicate updates
    if (updatingIds.has(orderId)) {
      console.warn("⚠️ Update already in progress for order:", orderId);
      return false;
    }

    try {
      // Mark order as updating
      setUpdatingIds(prev => new Set(prev).add(orderId));

      // 1️⃣ OPTIMISTIC UPDATE: Update UI immediately
      const previousOrders = [...orders];
      
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, ...updates, updated_at: new Date().toISOString() }
          : order
      ));

      console.log("✅ Optimistic update applied for order:", orderId);

      // 2️⃣ BACKGROUND API CALL
      const { error } = await supabase
        .from("orders")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      // 3️⃣ HANDLE RESULT
      if (error) {
        // ❌ ROLLBACK on error
        console.error("❌ Update failed, rolling back:", error);
        setOrders(previousOrders);
        
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update order. Changes reverted.",
          variant: "destructive",
        });
        
        return false;
      }

      // ✅ SUCCESS - keep optimistic update
      console.log("✅ Update confirmed by server");
      
      toast({
        title: "Order Updated",
        description: "The order has been updated successfully.",
      });

      // Optional: Refetch to ensure consistency (but not blocking)
      fetchOrders(false);
      
      return true;
      
    } catch (err) {
      console.error("❌ Unexpected error during update:", err);
      
      toast({
        title: "Update Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Refetch to restore correct state
      fetchOrders(false);
      return false;
      
    } finally {
      // Remove from updating set
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // ✅ FIX BUG #4: Optimistic delete implementation
  const deleteOrder = async (orderId) => {
    // Prevent duplicate deletes
    if (updatingIds.has(orderId)) {
      console.warn("⚠️ Operation already in progress for order:", orderId);
      return false;
    }

    try {
      // Mark as updating
      setUpdatingIds(prev => new Set(prev).add(orderId));

      // 1️⃣ OPTIMISTIC DELETE: Remove from UI immediately
      const previousOrders = [...orders];
      const deletedOrder = orders.find(o => o.id === orderId);
      
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setTotalOrders(prev => prev - 1);

      console.log("✅ Optimistic delete applied for order:", orderId);

      // 2️⃣ BACKGROUND API CALL
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);

      // 3️⃣ HANDLE RESULT
      if (error) {
        // ❌ ROLLBACK on error
        console.error("❌ Delete failed, rolling back:", error);
        setOrders(previousOrders);
        setTotalOrders(prev => prev + 1);
        
        toast({
          title: "Delete Failed",
          description: error.message || "Failed to delete order. Restored.",
          variant: "destructive",
        });
        
        return false;
      }

      // ✅ SUCCESS - keep optimistic delete
      console.log("✅ Delete confirmed by server");
      
      toast({
        title: "Order Deleted",
        description: `Order ${deletedOrder?.id?.slice(0, 8)} has been removed.`,
      });

      return true;
      
    } catch (err) {
      console.error("❌ Unexpected error during delete:", err);
      
      toast({
        title: "Delete Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Refetch to restore correct state
      fetchOrders(false);
      return false;
      
    } finally {
      // Remove from updating set
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return {
    orders,
    loading,
    totalOrders,
    fetchOrders,
    updateOrder,
    deleteOrder,
    // ✅ Export updating state for UI to show loading indicators
    updatingIds,
  };
}

// Filter function unchanged
function applyOrderFilter(orders, filterKey) {
  if (filterKey === "all" || !filterKey) return orders;
  return orders.filter((order) => order.status === filterKey);
}

export function useOrdersFilter(orders) {
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const applyFilter = (filterKey) => {
    setActiveFilter(filterKey);
    setCurrentPage(1);

    const filtered = applyOrderFilter(orders, filterKey);
    setFilteredOrders(filtered);
    setDisplayedOrders(filtered.slice(0, ORDERS_PER_PAGE));
    setHasMore(filtered.length > ORDERS_PER_PAGE);
  };

  const loadMoreOrders = () => {
    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * ORDERS_PER_PAGE;
    const endIndex = startIndex + ORDERS_PER_PAGE;

    setTimeout(() => {
      const newOrders = filteredOrders.slice(startIndex, endIndex);
      setDisplayedOrders((prev) => [...prev, ...newOrders]);
      setCurrentPage(nextPage);
      setHasMore(endIndex < filteredOrders.length);
      setLoadingMore(false);
    }, 500);
  };

  useEffect(() => {
    applyFilter(activeFilter);
  }, [orders, activeFilter]);

  return {
    filteredOrders,
    displayedOrders,
    activeFilter,
    hasMore,
    loadingMore,
    applyFilter,
    loadMoreOrders,
  };
}
