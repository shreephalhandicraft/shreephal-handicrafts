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

  const fetchDashboardData = async () => {
    try {
      setDashboardData((prev) => ({ ...prev, loading: true }));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      const [
        totalOrdersResult,
        pendingOrdersResult,
        recentOrdersResult,
        codOrdersResult,
        payNowOrdersResult,
        revenueResult,
        totalMessagesResult,
        unreadMessagesResult,
      ] = await Promise.all([
        supabase
          .from("orders")
          .select("*", { count: 'exact', head: true }),
        
        supabase
          .from("orders")
          .select("*", { count: 'exact', head: true })
          .eq("status", "pending"),
        
        supabase
          .from("orders")
          .select("*", { count: 'exact', head: true })
          .gte("created_at", thirtyDaysAgoISO),
        
        supabase
          .from("orders")
          .select("*", { count: 'exact', head: true })
          .eq("payment_method", "COD"),
        
        supabase
          .from("orders")
          .select("*", { count: 'exact', head: true })
          .eq("payment_method", "PayNow"),
        
        supabase
          .from("orders")
          .select("grand_total")
          .eq("payment_status", "completed"),
        
        supabase
          .from("messages")
          .select("*", { count: 'exact', head: true }),
        
        supabase
          .from("messages")
          .select("*", { count: 'exact', head: true })
          .eq("is_read", false),
      ]);

      const errors = [
        totalOrdersResult.error,
        pendingOrdersResult.error,
        recentOrdersResult.error,
        codOrdersResult.error,
        payNowOrdersResult.error,
        revenueResult.error,
        totalMessagesResult.error,
        unreadMessagesResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw errors[0];
      }

      const totalRevenue = (revenueResult.data || [])
        .reduce((sum, order) => sum + (parseFloat(order.grand_total) || 0), 0);

      setDashboardData({
        totalOrders: totalOrdersResult.count || 0,
        recentOrders: recentOrdersResult.count || 0,
        pendingOrders: pendingOrdersResult.count || 0,
        totalMessages: totalMessagesResult.count || 0,
        unreadMessages: unreadMessagesResult.count || 0,
        totalRevenue: totalRevenue,
        codOrders: codOrdersResult.count || 0,
        payNowOrders: payNowOrdersResult.count || 0,
        loading: false,
      });
      
    } catch (error) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
      setDashboardData((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const ordersSubscription = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'connected' }));
          toast({
            title: "Live Updates Active",
            description: "Orders will update in real-time",
            duration: 3000,
          });
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'error' }));
          toast({
            title: "Live Updates Unavailable",
            description: "Orders won't update automatically. Please refresh manually.",
            variant: "destructive",
            duration: 5000,
          });
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'error' }));
          toast({
            title: "Connection Timeout",
            description: "Realtime updates may be delayed",
            variant: "destructive",
          });
        } else if (status === 'CLOSED') {
          setRealtimeStatus(prev => ({ ...prev, orders: 'disconnected' }));
        }
      });

    const messagesSubscription = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'connected' }));
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'error' }));
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'error' }));
        } else if (status === 'CLOSED') {
          setRealtimeStatus(prev => ({ ...prev, messages: 'disconnected' }));
        }
      });

    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(messagesSubscription);
    };
  }, []);

  const dashboardContext = {
    ...dashboardData,
    refreshData: fetchDashboardData,
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
              realtimeStatus={realtimeStatus}
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
