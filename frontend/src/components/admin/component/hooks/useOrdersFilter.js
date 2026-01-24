import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { ORDERS_PER_PAGE } from "../orderUtils/OrderUtils.js";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const { toast } = useToast();

  const fetchOrders = async (reset = true) => {
    try {
      setLoading(reset);

      // ✅ FIX BUG #1: Use order_details_full view instead of orders table
      // This view provides:
      // - order_total (computed from order_items, not nullable)
      // - Complete product details for each item
      // - Pre-joined customer information
      // - Same data source as user-facing pages

      console.log("🔍 Admin: Fetching orders from order_details_full view...");

      const { data, error } = await supabase
        .from("order_details_full")
        .select("*")
        .order("order_date", { ascending: false })
        .limit(ORDERS_PER_PAGE * 2 * 5); // Multiply by avg items per order

      if (error) throw error;

      console.log(`✅ Fetched ${data?.length || 0} order item rows from view`);

      // ✅ Group rows by order_id (view returns one row per order item)
      const groupedOrders = {};
      
      (data || []).forEach((row) => {
        const orderId = row.order_id;

        if (!groupedOrders[orderId]) {
          // First row for this order - initialize order object
          groupedOrders[orderId] = {
            // Map view columns to expected component structure
            id: row.order_id, // Components expect 'id'
            order_id: row.order_id,
            user_id: row.user_id,
            customer_id: row.customer_id,
            
            // ✅ FIX: Use order_status (view) → status (expected by components)
            status: row.order_status,
            payment_status: row.payment_status,
            
            // ✅ FIX: Use order_total (computed) and keep as 'amount' for backward compatibility
            amount: row.order_total, // Components use 'amount' for display
            order_total: row.order_total, // Keep original for clarity
            
            // ✅ FIX: Map order_date → created_at for compatibility
            created_at: row.order_date,
            order_date: row.order_date,
            updated_at: row.updated_at,
            
            // Order metadata
            shipping_info: row.shipping_info,
            delivery_info: row.delivery_info,
            payment_method: row.payment_method,
            transaction_id: row.transaction_id,
            order_notes: row.order_notes,
            
            // Customer info (already flattened in view)
            customers: {
              id: row.customer_id,
              user_id: row.user_id,
              name: row.customer_name,
              email: row.customer_email,
              phone: row.customer_phone,
              address: row.customer_address,
            },
            
            // Initialize items array
            items: [],
            
            // Convenience fields
            customer_name: row.customer_name,
            customer_email: row.customer_email,
            customer_phone: row.customer_phone,
          };
        }

        // Add this item to the order's items array
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
          
          // Product details (great for admin UX!)
          product_name: row.product_name,
          product_description: row.product_description,
          product_image: row.product_image,
          sku: row.sku,
          size_display: row.size_display,
          size_numeric: row.size_numeric,
          size_unit: row.size_unit,
          price_tier: row.price_tier,
          
          // Category info
          category_id: row.category_id,
          category_name: row.category_name,
        });
      });

      const ordersArray = Object.values(groupedOrders);
      
      console.log(`✅ Grouped into ${ordersArray.length} orders`);
      console.log("Sample order structure:", ordersArray[0]);

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

  const updateOrder = async (orderId, updates) => {
    try {
      // ✅ Updates still go to orders table (source table)
      // View is read-only, used only for querying
      const { error } = await supabase
        .from("orders")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      
      if (error) throw error;

      toast({
        title: "Order updated successfully",
        description: "The order has been updated with new information.",
      });

      // Refetch from view to get updated computed values
      fetchOrders(false);
      return true;
    } catch (err) {
      console.error("Update error:", err);
      toast({
        title: "Error updating order",
        description: err.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      // ✅ Deletes go to orders table (cascade will handle order_items)
      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", orderId);
      
      if (error) throw error;

      toast({
        title: "Order deleted successfully",
        description: "The order has been removed from the system.",
      });

      fetchOrders(false);
      return true;
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Error deleting order",
        description: err.message,
        variant: "destructive",
      });
      return false;
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
  };
}

// ✅ Filter function unchanged - works with 'status' field
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
