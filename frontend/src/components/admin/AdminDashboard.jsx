import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardOverview } from "./DashboardOverview";
import { ProductsPage } from "./pages/ProductsPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { OrdersPage } from "./pages/OrdersPage";
import { CustomersPage } from "./pages/CustomersPage";
import { MessagesPage } from "./pages/MessagesPage";
import AddProductPage from "./pages/AddProductPage";
import EditProductPage from "./pages/EditProductPage";
import CustomizationReview from "@/pages/admin/CustomizationReview";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  
  // ✅ FIX BUG #3: Track realtime connection status
  const [realtimeStatus, setRealtimeStatus] = useState({
    orders: 'connecting',
    messages: 'connecting',
  });
  
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    recentOrders: 0,
    pendingOrders: 0,
    totalMessages: 0,
    unreadMessages: 0,
    totalRevenue: 0,
    codOrders: 0,
    payNowOrders: 0,
    loading: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    const isDark = localStorage.getItem("darkMode") === "true";
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    document.documentElement.classList.toggle("dark", newDarkMode);
  };

  // Fetch dashboard data from Supabase
  const fetchDashboardData = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true }));

      const { data: orderRows, error: ordersError } = await supabase
        .from("order_details_full")
        .select("*")
        .order("order_date", { ascending: false });

      if (ordersError) throw ordersError;

      const ordersMap = {};
      (orderRows || []).forEach((row) => {
        if (!ordersMap[row.order_id]) {
          ordersMap[row.order_id] = {
            order_id: row.order_id,
            order_status: row.order_status,
            payment_status: row.payment_status,
            payment_method: row.payment_method,
            order_total: row.order_total,
            order_date: row.order_date,
          };
        }
      });

      const orders = Object.values(ordersMap);

      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentOrders = orders.filter(
        (order) => new Date(order.order_date) >= last30Days
      ).length;

      const pendingOrders = orders.filter(
        (order) => order.order_status === "pending"
      ).length;

      const unreadMessages = messages.filter(
        (message) => !message.is_read
      ).length;

      const totalRevenue = orders
        .filter((order) => order.payment_status === "completed")
        .reduce((sum, order) => sum + (parseFloat(order.order_total) || 0), 0);

      const codOrders = orders.filter(
        (order) => order.payment_method === "COD"
      ).length;

      const payNowOrders = orders.filter(
        (order) => order.payment_method === "PayNow"
      ).length;

      setDashboardData({
        totalOrders: orders.length,
        recentOrders,
        pendingOrders,
        totalMessages: messages.length,
        unreadMessages,
        totalRevenue,
        codOrders,
        payNowOrders,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
  };

  // ✅ FIX BUG #3: Enhanced realtime subscriptions with error handling
  useEffect(() => {
    fetchDashboardData();

    console.log("🔄 Setting up realtime subscriptions...");

    // Subscribe to orders table changes with proper error handling
    const ordersSubscription = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("✅ Orders change received:", payload.eventType, payload.new?.id);
          fetchDashboardData();
        }
      )
      .subscribe((status, err) => {
        // ✅ Handle subscription status changes
        console.log("📡 Orders subscription status:", status);
        
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'connected' }));
          toast({
            title: "Live Updates Active",
            description: "Orders will update in real-time",
            duration: 3000,
          });
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'error' }));
          console.error("❌ Orders subscription error:", err);
          toast({
            title: "Live Updates Unavailable",
            description: "Orders won't update automatically. Please refresh manually.",
            variant: "destructive",
            duration: 5000,
          });
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'error' }));
          console.warn("⏱️ Orders subscription timed out");
          toast({
            title: "Connection Timeout",
            description: "Realtime updates may be delayed",
            variant: "destructive",
          });
        } else if (status === 'CLOSED') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'disconnected' }));
          console.log("🔌 Orders subscription closed");
        }
      });

    // Subscribe to messages table changes with proper error handling
    const messagesSubscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          console.log("✅ Messages change received:", payload.eventType, payload.new?.id);
          fetchDashboardData();
        }
      )
      .subscribe((status, err) => {
        console.log("📡 Messages subscription status:", status);
        
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'connected' }));
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'error' }));
          console.error("❌ Messages subscription error:", err);
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'error' }));
        } else if (status === 'CLOSED') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'disconnected' }));
        }
      });

    // Cleanup subscriptions on unmount
    return () => {
      console.log("🧹 Cleaning up subscriptions...");
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(messagesSubscription);
    };
  }, []);

  // Provide dashboard data to child components via context or props
  const dashboardContext = {
    ...dashboardData,
    refreshData: fetchDashboardData,
    // ✅ Pass realtime status to components
    realtimeStatus,
  };

  return (
    <div className={cn("min-h-screen bg-background", darkMode && "dark")}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar />

          <div className="flex-1 flex flex-col overflow-hidden">
            <DashboardHeader
              darkMode={darkMode}
              toggleDarkMode={toggleDarkMode}
              dashboardData={dashboardData}
              realtimeStatus={realtimeStatus} // ✅ Pass status to header
            />

            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-surface-light">
              <div className="container mx-auto px-6 py-8">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <DashboardOverview dashboardData={dashboardContext} />
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      <DashboardOverview dashboardData={dashboardContext} />
                    }
                  />
                  <Route
                    path="/products/add-product"
                    element={<AddProductPage />}
                  />
                  <Route
                    path="/products/edit/:productId"
                    element={<EditProductPage />}
                  />
                  <Route path="/products/*" element={<ProductsPage />} />
                  <Route path="/categories/*" element={<CategoriesPage />} />
                  <Route
                    path="/orders/*"
                    element={<OrdersPage dashboardData={dashboardContext} />}
                  />
                  <Route path="/customers/*" element={<CustomersPage />} />
                  <Route
                    path="/messages/*"
                    element={<MessagesPage dashboardData={dashboardContext} />}
                  />
                  <Route
                    path="/customizations"
                    element={<CustomizationReview />}
                  />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
