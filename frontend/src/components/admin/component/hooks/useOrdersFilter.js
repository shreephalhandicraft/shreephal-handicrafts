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

      const { count, error: countError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });
      if (countError) throw countError;
      setTotalOrders(count || 0);

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
    *,
    customization_details,
    items,
    customers (
      id,
      user_id,
      name,
      email,
      phone,
      address,
      bio,
      created_at
    )
  `
        )
        .order("created_at", { ascending: false })
        .limit(ORDERS_PER_PAGE * 2);
      if (error) throw error;

      setOrders(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
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
      const { error } = await supabase
        .from("orders")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;

      toast({
        title: "Order updated successfully",
        description: "The order has been updated with new information.",
      });

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

  // Added activeFilter to dependencies to avoid stale closure
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
