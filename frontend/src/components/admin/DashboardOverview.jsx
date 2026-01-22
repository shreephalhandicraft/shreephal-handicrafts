import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  IndianRupee,
  ShoppingCart,
  Users,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  Truck,
  XCircle,
  Banknote,
  CreditCard,
  AlertTriangle,
  Flame,
  TrendingDown,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Link } from "react-router-dom";

const getStatusIcon = (status) => {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "processing":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "confirmed":
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case "shipped":
      return <Truck className="h-4 w-4 text-indigo-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "delivered":
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "processing":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
    case "confirmed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

const getStockBadge = (stock) => {
  if (stock === 0) {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-300">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Out of Stock
      </Badge>
    );
  } else if (stock <= 2) {
    return (
      <Badge className="bg-red-100 text-red-800 border-red-300 animate-pulse">
        <Flame className="h-3 w-3 mr-1" />
        Critical: {stock}
      </Badge>
    );
  } else if (stock <= 5) {
    return (
      <Badge className="bg-orange-100 text-orange-800 border-orange-300">
        <TrendingDown className="h-3 w-3 mr-1" />
        Low: {stock}
      </Badge>
    );
  } else if (stock <= 10) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
        {stock} units
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-300">
        {stock} in stock
      </Badge>
    );
  }
};

export function DashboardOverview({ dashboardData }) {
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ Stock management state
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [stockStats, setStockStats] = useState({
    critical: 0, // stock <= 2
    low: 0,      // stock <= 5
    healthy: 0,  // stock > 5
  });

  // If dashboardData is provided, use it; otherwise fetch data directly
  const {
    totalOrders = 0,
    recentOrders: recentOrdersCount = 0,
    pendingOrders = 0,
    totalMessages = 0,
    unreadMessages = 0,
    totalRevenue = 0,
    codOrders = 0,
    payNowOrders = 0,
    loading: dashboardLoading = false,
    refreshData,
  } = dashboardData || {};

  // ✅ FIXED: Fetch low stock products with correct schema
  const fetchStockData = async () => {
    try {
      setLoadingStock(true);
      
      // Fetch all product variants with stock info (FIXED: size_code → size_display)
      const { data: variants, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          size_display,
          stock_quantity,
          price,
          product_id,
          products!product_id (
            id,
            title,
            image_url,
            price
          )
        `)
        .lte('stock_quantity', 10) // Get products with stock <= 10
        .order('stock_quantity', { ascending: true });

      if (error) throw error;

      // Calculate statistics
      let critical = 0;
      let low = 0;
      let healthy = 0;
      let totalValue = 0;

      variants?.forEach(variant => {
        const stock = variant.stock_quantity || 0;
        const value = stock * (variant.price || variant.products?.price || 0);
        totalValue += value;

        if (stock === 0 || stock <= 2) critical++;
        else if (stock <= 5) low++;
        else healthy++;
      });

      setStockStats({ critical, low, healthy });
      setLowStockProducts(variants || []);
      setTotalInventoryValue(totalValue);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    } finally {
      setLoadingStock(false);
    }
  };

  // Fetch recent orders and messages for display
  const fetchRecentData = async () => {
    try {
      setLoading(true);

      // Fetch recent orders with customer info
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (
            name,
            email
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      // Fetch recent messages
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (messagesError) throw messagesError;

      setRecentOrders(orders || []);
      setRecentMessages(messages || []);
    } catch (error) {
      console.error("Error fetching recent data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentData();
    fetchStockData();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // Calculate growth percentages (mock data - you can implement real calculations)
  const calculateGrowth = (current, type) => {
    // This is a simplified growth calculation
    // You might want to store previous month's data to calculate real growth
    const mockGrowthRates = {
      revenue: "+15.2%",
      orders: "+23.1%",
      customers: "+12.5%",
      messages: "+8.3%",
    };
    return mockGrowthRates[type] || "+0%";
  };

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      change: calculateGrowth(totalRevenue, "revenue"),
      changeType: "positive",
      icon: IndianRupee,
    },
    {
      title: "Orders",
      value: totalOrders.toString(),
      change: calculateGrowth(totalOrders, "orders"),
      changeType: "positive",
      icon: ShoppingCart,
    },
    {
      title: "Messages",
      value: totalMessages.toString(),
      change: calculateGrowth(totalMessages, "messages"),
      changeType: "positive",
      icon: MessageSquare,
    },
    {
      title: "Pending Orders",
      value: pendingOrders.toString(),
      change: `${unreadMessages} new messages`,
      changeType: "neutral",
      icon: Clock,
    },
  ];

  if (dashboardLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12 sm:py-16 md:py-20">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="text-base sm:text-lg font-medium">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg max-w-2xl">
            Welcome back! Here's what's happening with Shreephal-Handicraftss
            today.
          </p>
        </div>
        <Button
          onClick={() => {
            refreshData?.();
            fetchStockData();
          }}
          variant="outline"
          className="gap-2 self-start sm:self-center"
          size="sm"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* ✅ Low Stock Alert Banner */}
      {!loadingStock && (stockStats.critical > 0 || stockStats.low > 0) && (
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2">
                  ⚠️ Inventory Alert: Low Stock Detected
                </h3>
                <p className="text-sm sm:text-base text-red-800 mb-3">
                  {stockStats.critical > 0 && (
                    <span className="font-medium">
                      {stockStats.critical} product{stockStats.critical > 1 ? 's are' : ' is'} critically low (≤2 units)
                    </span>
                  )}
                  {stockStats.critical > 0 && stockStats.low > 0 && <span> and </span>}
                  {stockStats.low > 0 && (
                    <span className="font-medium">
                      {stockStats.low} product{stockStats.low > 1 ? 's are' : ' is'} running low (≤5 units)
                    </span>
                  )}
                </p>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm">
                  <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  View Stock Details Below
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="bg-card border-border hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-card-foreground truncate pr-2">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-card-foreground truncate">
                {stat.value}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span
                  className={
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-blue-600"
                  }
                >
                  {stat.change}
                </span>{" "}
                {stat.changeType === "positive" && (
                  <span className="hidden sm:inline">from last month</span>
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ✅ Stock Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-card border-border hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-red-600">{stockStats.critical}</div>
            <p className="text-xs text-muted-foreground">≤2 units remaining</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-orange-600">{stockStats.low}</div>
            <p className="text-xs text-muted-foreground">3-5 units remaining</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {formatPrice(totalInventoryValue)}
            </div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* ✅ Low Stock Products Table */}
      {!loadingStock && lowStockProducts.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-card-foreground flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                Products Requiring Attention
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} with low stock
              </CardDescription>
            </div>
            <Button
              onClick={fetchStockData}
              variant="outline"
              size="sm"
              className="self-start sm:self-center"
            >
              <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Product</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Variant</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Stock Status</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Price</th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((variant) => {
                    const stock = variant.stock_quantity || 0;
                    const price = variant.price || variant.products?.price || 0;
                    const value = stock * price;
                    
                    return (
                      <tr 
                        key={variant.id} 
                        className={`border-b hover:bg-muted/50 transition-colors ${
                          stock <= 2 ? 'bg-red-50 dark:bg-red-950/10' : 
                          stock <= 5 ? 'bg-orange-50 dark:bg-orange-950/10' : ''
                        }`}
                      >
                        <td className="py-3 px-2 sm:px-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            {variant.products?.image_url ? (
                              <img 
                                src={variant.products.image_url} 
                                alt={variant.products.title}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium text-xs sm:text-sm truncate">
                              {variant.products?.title || 'Unknown Product'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          <Badge variant="outline" className="text-xs">{variant.size_display || 'Default'}</Badge>
                        </td>
                        <td className="py-3 px-2 sm:px-4">
                          {getStockBadge(stock)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium">
                          {formatPrice(price)}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium">
                          {formatPrice(value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center gap-2 text-base sm:text-lg">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
              Payment Methods
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Breakdown of payment preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Banknote className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">
                    Cash on Delivery
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-bold text-base sm:text-lg">
                    {codOrders}
                  </div>
                  <div className="text-xs text-muted-foreground">orders</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">
                    PayNow
                  </span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="font-bold text-base sm:text-lg">
                    {payNowOrders}
                  </div>
                  <div className="text-xs text-muted-foreground">orders</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground text-base sm:text-lg">
              Quick Actions
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Common admin tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <Button
                asChild
                variant="outline"
                className="h-auto p-3 sm:p-4 flex flex-col gap-1 sm:gap-2 hover:scale-[1.02] transition-transform"
              >
                <Link to="/admin/orders">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">
                    View Orders
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-3 sm:p-4 flex flex-col gap-1 sm:gap-2 hover:scale-[1.02] transition-transform"
              >
                <Link to="/admin/messages">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">
                    Messages
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-3 sm:p-4 flex flex-col gap-1 sm:gap-2 hover:scale-[1.02] transition-transform"
              >
                <Link to="/admin/products">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">
                    Products
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="h-auto p-3 sm:p-4 flex flex-col gap-1 sm:gap-2 hover:scale-[1.02] transition-transform"
              >
                <Link to="/admin/customers">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-xs sm:text-sm font-medium">
                    Customers
                  </span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Messages */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Orders */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-card-foreground text-base sm:text-lg">
                Recent Orders
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Latest {recentOrders.length} orders from your store
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="self-start sm:self-center"
            >
              <Link to="/admin/orders" className="text-xs sm:text-sm">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No recent orders</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm sm:text-base truncate">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {order.customers?.name || "Unknown Customer"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 flex-shrink-0">
                      <Badge
                        className={`${getStatusColor(order.status)} text-xs`}
                        variant="secondary"
                      >
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <p className="font-medium text-foreground text-sm sm:text-base">
                          ₹{order.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-card-foreground text-base sm:text-lg">
                New Messages
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {unreadMessages} unread messages from customers
              </CardDescription>
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="self-start sm:self-center"
            >
              <Link to="/admin/messages" className="text-xs sm:text-sm">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
              {recentMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No new messages</p>
                </div>
              ) : (
                recentMessages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 sm:p-4 rounded-lg border border-border bg-surface-light hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-1 sm:space-y-0">
                      <h4 className="font-medium text-foreground text-sm sm:text-base truncate pr-2">
                        {message.subject || "No Subject"}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 text-xs self-start sm:self-center flex-shrink-0"
                      >
                        New
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">
                      From: {message.name} ({message.email})
                    </p>
                    <p className="text-xs sm:text-sm text-foreground line-clamp-2 leading-relaxed">
                      {message.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
