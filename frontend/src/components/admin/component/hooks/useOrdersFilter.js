import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { ORDERS_PER_PAGE } from "../orderUtils/OrderUtils.js";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [updatingIds, setUpdatingIds] = useState(new Set());
  
  const { toast } = useToast();

  const fetchOrders = async (reset = true) => {
    try {
      setLoading(reset);

      console.log("🔍 Admin: Fetching orders from orders table (direct query)...");

      // ✅ STEP 1: Fetch orders with customer data
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          customers (
            id,
            user_id,
            name,
            email,
            phone,
            address
          )
        `)
        .order("created_at", { ascending: false })
        .limit(500); // Load reasonable amount

      if (ordersError) throw ordersError;

      console.log(`✅ Fetched ${ordersData?.length || 0} orders`);

      // ✅ STEP 2: Get all order_items for these orders
      const orderIds = ordersData.map(o => o.id);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          products (id, title, image_url, description),
          product_variants (id, size_display, sku)
        `)
        .in("order_id", orderIds);

      if (itemsError) {
        console.warn("⚠️ Failed to fetch order items:", itemsError);
      }

      console.log(`✅ Fetched ${itemsData?.length || 0} order items`);

      // ✅ STEP 3: Group items by order_id
      const itemsByOrderId = {};
      (itemsData || []).forEach(item => {
        if (!itemsByOrderId[item.order_id]) {
          itemsByOrderId[item.order_id] = [];
        }
        
        // ✅ Map to expected format with new schema column names
        itemsByOrderId[item.order_id].push({
          item_id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          productId: item.product_id,
          variantId: item.variant_id,
          
          // ✅ NEW SCHEMA: Use snapshot data from order_items
          catalog_number: item.product_catalog_number,
          name: item.product_name || item.products?.title || "Product Deleted",
          image: item.products?.image_url || "/placeholder.png",
          description: item.products?.description,
          
          // ✅ NEW SCHEMA: Variant snapshot
          sku: item.variant_sku,
          size_display: item.variant_size_display || item.product_variants?.size_display,
          
          // ✅ NEW SCHEMA: Pricing columns
          quantity: item.quantity,
          price: item.unit_price_with_gst, // ✅ NEW column name
          unit_price: item.unit_price_with_gst,
          base_price: item.base_price,
          gst_rate: item.gst_rate,
          gst_amount: item.gst_amount,
          item_subtotal: item.item_subtotal,
          item_gst_total: item.item_gst_total,
          item_total: item.item_total,
          
          // Customization
          customization_data: item.customization_data,
          production_notes: item.production_notes,
          
          // Display names
          product_name: item.product_name || item.products?.title || "Product Deleted",
          product_description: item.products?.description,
          product_image: item.products?.image_url || "/placeholder.png",
        });
      });

      // ✅ STEP 4: Combine orders with items
      const ordersArray = ordersData.map(order => ({
        id: order.id,
        order_id: order.id,
        user_id: order.user_id,
        customer_id: order.customer_id,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        transaction_id: order.transaction_id,
        
        // ✅ NEW SCHEMA: Use grand_total instead of order_total
        amount: order.grand_total,
        order_total: order.grand_total,
        grand_total: order.grand_total,
        subtotal: order.subtotal,
        total_gst: order.total_gst,
        gst_5_total: order.gst_5_total,
        gst_18_total: order.gst_18_total,
        shipping_cost: order.shipping_cost,
        
        // Dates
        created_at: order.created_at,
        order_date: order.created_at,
        updated_at: order.updated_at,
        
        // Info
        shipping_info: order.shipping_info,
        delivery_info: order.delivery_info,
        order_notes: order.order_notes,
        customization_details: order.customization_details,
        requires_customization: order.requires_customization,
        production_status: order.production_status,
        estimated_delivery_days: order.estimated_delivery_days,
        
        // Customer data
        customers: order.customers || {
          id: order.customer_id,
          user_id: order.user_id,
          name: "Unknown",
          email: "",
          phone: "",
          address: null,
        },
        customer_name: order.customers?.name || "Unknown",
        customer_email: order.customers?.email || "",
        customer_phone: order.customers?.phone || "",
        
        // Items
        items: itemsByOrderId[order.id] || [],
      }));
      
      // 🐛 Verify totals match
      ordersArray.forEach(order => {
        const calculatedTotal = order.items.reduce((sum, item) => {
          return sum + (parseFloat(item.item_total) || 0);
        }, 0);

        const dbTotal = parseFloat(order.grand_total) || 0;
        const difference = Math.abs(dbTotal - calculatedTotal);
        
        if (difference > 1 && order.items.length > 0) {
          console.warn(`⚠️ Order ${order.id.slice(0,8)}: DB total (₹${dbTotal}) differs from items total (₹${calculatedTotal}) by ₹${difference.toFixed(2)}`);
        }
      });
      
      console.log(`✅ Processed ${ordersArray.length} orders with items`);
      console.log("Sample order:", {
        id: ordersArray[0]?.id?.slice(0,8),
        grand_total: ordersArray[0]?.grand_total,
        items_count: ordersArray[0]?.items?.length,
        customer_name: ordersArray[0]?.customer_name
      });

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

  // ✅ Optimistic update implementation
  const updateOrder = async (orderId, updates) => {
    if (updatingIds.has(orderId)) {
      console.warn("⚠️ Update already in progress for order:", orderId);
      return false;
    }

    try {
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
        console.error("❌ Update failed, rolling back:", error);
        setOrders(previousOrders);
        
        toast({
          title: "Update Failed",
          description: error.message || "Failed to update order. Changes reverted.",
          variant: "destructive",
        });
        
        return false;
      }

      console.log("✅ Update confirmed by server");
      
      toast({
        title: "Order Updated",
        description: "The order has been updated successfully.",
      });

      fetchOrders(false);
      return true;
      
    } catch (err) {
      console.error("❌ Unexpected error during update:", err);
      
      toast({
        title: "Update Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      fetchOrders(false);
      return false;
      
    } finally {
      setUpdatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // ✅ Optimistic delete implementation
  const deleteOrder = async (orderId) => {
    if (updatingIds.has(orderId)) {
      console.warn("⚠️ Operation already in progress for order:", orderId);
      return false;
    }

    try {
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
      
      fetchOrders(false);
      return false;
      
    } finally {
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
