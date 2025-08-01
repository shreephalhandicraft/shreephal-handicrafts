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
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
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

      // Fetch Orders Data
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch Messages Data
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Calculate dashboard metrics
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentOrders = orders.filter(
        (order) => new Date(order.created_at) >= last30Days
      ).length;

      const pendingOrders = orders.filter(
        (order) => order.status === "pending"
      ).length;

      const unreadMessages = messages.filter(
        (message) => !message.is_read
      ).length;

      const totalRevenue = orders
        .filter((order) => order.payment_status === "completed")
        .reduce((sum, order) => sum + (parseFloat(order.amount) || 0), 0);

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

  // Set up real-time subscriptions
  useEffect(() => {
    // Initial data fetch
    fetchDashboardData();

    // Subscribe to orders table changes
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
          console.log("Orders change received:", payload);
          fetchDashboardData(); // Refetch data when orders change
        }
      )
      .subscribe();

    // Subscribe to messages table changes
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
          console.log("Messages change received:", payload);
          fetchDashboardData(); // Refetch data when messages change
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(ordersSubscription);
      supabase.removeChannel(messagesSubscription);
    };
  }, []);

  // Provide dashboard data to child components via context or props
  const dashboardContext = {
    ...dashboardData,
    refreshData: fetchDashboardData,
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
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
