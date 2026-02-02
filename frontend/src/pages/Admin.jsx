import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, Package, Users, DollarSign, AlertTriangle, Flame, TrendingDown, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // ✅ NEW: Stock management state
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loadingStock, setLoadingStock] = useState(true);
  const [totalInventoryValue, setTotalInventoryValue] = useState(0);
  const [stockStats, setStockStats] = useState({
    critical: 0, // stock <= 2
    low: 0,      // stock <= 5
    healthy: 0,  // stock > 5
  });

  // ✅ NEW: Recent orders state
  const [recentOrders, setRecentOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // ✅ FIXED: Consistent formatPrice helper (same as Cart/Checkout)
  const formatPrice = (price) => {
    return (price || 0).toLocaleString("en-IN", { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  // ✅ NEW: Fetch real recent orders
  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        setLoadingOrders(true);
        
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            order_number,
            total_price,
            created_at,
            order_items (
              id,
              product_title,
              quantity
            )
          `)
          .order('created_at', { ascending: false })
          .limit(3);

        if (error) throw error;

        setRecentOrders(data || []);
      } catch (error) {
        console.error('Error fetching recent orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    if (user) {
      fetchRecentOrders();
    }
  }, [user]);

  // ✅ Fetch low stock products
  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoadingStock(true);
        
        // Fetch all product variants with stock info
        const { data: variants, error } = await supabase
          .from('product_variants')
          .select(`
            id,
            size_display,
            stock_quantity,
            price,
            is_active,
            product_id,
            products!product_id (
              id,
              title,
              image_url,
              price
            )
          `)
          .eq('is_active', true)
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
        toast({
          title: "Error",
          description: "Failed to load stock data",
          variant: "destructive",
        });
      } finally {
        setLoadingStock(false);
      }
    };

    if (user) {
      fetchStockData();
    }
  }, [user, toast]);

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
          Critical: {stock} left
        </Badge>
      );
    } else if (stock <= 5) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-300">
          <TrendingDown className="h-3 w-3 mr-1" />
          Low: {stock} left
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

  if (!user) {
    return (
      <Layout>
        <div className="py-20 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You need to be logged in to access this page.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {user.email}!</p>
          </div>

          {/* ✅ Low Stock Alert Banner */}
          {!loadingStock && (stockStats.critical > 0 || stockStats.low > 0) && (
            <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-lg shadow-sm">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    ⚠️ Inventory Alert: Low Stock Detected
                  </h3>
                  <p className="text-red-800 mb-3">
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
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restock Now
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">₹{formatPrice(totalInventoryValue)}</p>
                  <p className="text-sm text-gray-600">Inventory Value</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stockStats.critical}</p>
                  <p className="text-sm text-gray-600">Critical Stock</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <TrendingDown className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stockStats.low}</p>
                  <p className="text-sm text-gray-600">Low Stock</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stockStats.healthy}</p>
                  <p className="text-sm text-gray-600">Healthy Stock</p>
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Products Table */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                Products Requiring Attention
              </h2>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            {loadingStock ? (
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                <p className="mt-2 text-gray-600">Loading stock data...</p>
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p className="font-medium">All products are well stocked!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Variant</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stock Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Price</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Value</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
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
                          className={`border-b hover:bg-gray-50 transition-colors ${
                            stock <= 2 ? 'bg-red-50' : stock <= 5 ? 'bg-orange-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              {variant.products?.image_url ? (
                                <img 
                                  src={variant.products.image_url} 
                                  alt={variant.products.title}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <span className="font-medium text-gray-900">
                                {variant.products?.title || 'Unknown Product'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{variant.size_display || 'Default'}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            {getStockBadge(stock)}
                          </td>
                          <td className="py-3 px-4 text-gray-900">
                            ₹{formatPrice(price)}
                          </td>
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            ₹{formatPrice(value)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button size="sm" variant="outline">
                              Restock
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions & Recent Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/products/add')}
                >
                  Add New Product
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/orders')}
                >
                  View Orders
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/customers')}
                >
                  Manage Customers
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/categories')}
                >
                  Manage Categories
                </Button>
              </div>
            </div>

            {/* ✅ FIXED: Real Recent Orders with ₹ currency */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Orders
              </h2>
              {loadingOrders ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading orders...</p>
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="font-medium">No recent orders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const firstItem = order.order_items?.[0];
                    const itemCount = order.order_items?.length || 0;
                    
                    return (
                      <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-b-0 hover:bg-gray-50 px-2 rounded">
                        <div>
                          <p className="font-medium text-gray-900">{order.order_number}</p>
                          <p className="text-sm text-gray-600">
                            {firstItem?.product_title || 'Order'}
                            {itemCount > 1 && ` +${itemCount - 1} more`}
                          </p>
                        </div>
                        <span className="text-green-600 font-medium">₹{formatPrice(order.total_price)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {recentOrders.length > 0 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate('/admin/orders')}
                >
                  View All Orders
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;