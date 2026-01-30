import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  ShoppingBag,
  Eye,
  ArrowRight,
  Loader2,
  Star,
  Wrench,
  CreditCard,
  Download,
} from "lucide-react";

// PayNow configuration
const PHONEPE_PAY_URL =
  process.env.NODE_ENV === "production"
    ? "https://Shreephal-Handicrafts.onrender.com/pay"
    : "http://localhost:3000/pay";

const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "confirmed":
      return <CheckCircle className="h-4 w-4" />;
    case "processing":
      return <Package className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "cancelled":
      return <XCircle className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "processing":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getProductionStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    case "quality_check":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPaymentStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "paid":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getEstimatedArrival = (createdAt, status, estimatedDays = 7) => {
  const orderDate = new Date(createdAt);
  const today = new Date();

  switch (status?.toLowerCase()) {
    case "delivered":
      return { date: null, text: "Delivered", isPast: true };
    case "cancelled":
      return { date: null, text: "Cancelled", isPast: true };
    case "shipped":
      const arrivalDate = new Date(orderDate);
      arrivalDate.setDate(arrivalDate.getDate() + 3);
      return {
        date: arrivalDate,
        text: `Arriving ${arrivalDate.toLocaleDateString()}`,
        isPast: arrivalDate < today,
      };
    case "processing":
      const processingDate = new Date(orderDate);
      processingDate.setDate(processingDate.getDate() + estimatedDays);
      return {
        date: processingDate,
        text: `Expected ${processingDate.toLocaleDateString()}`,
        isPast: false,
      };
    default:
      const defaultDate = new Date(orderDate);
      defaultDate.setDate(defaultDate.getDate() + estimatedDays);
      return {
        date: defaultDate,
        text: `Expected ${defaultDate.toLocaleDateString()}`,
        isPast: false,
      };
  }
};

// ✅ FIX: Get order total - all fields now in RUPEES (not paise)
const getOrderTotal = (order) => {
  // Priority: order_total (snapshot) > amount > total_price
  // 🐛 FIX: All values are now stored in RUPEES, no conversion needed
  if (order.order_total != null) {
    return Number(order.order_total);
  }
  if (order.amount != null) {
    return Number(order.amount);
  }
  if (order.total_price != null) {
    // 🐛 FIX: No longer divide by 100 - values are in rupees
    return Number(order.total_price);
  }
  return 0;
};

export default function MyOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayments, setProcessingPayments] = useState(new Set());
  const [downloadingInvoices, setDownloadingInvoices] = useState(new Set());

  useEffect(() => {
    if (!user) {
      console.log("No user found");
      return;
    }

    console.log("Loading orders for user:", user.id);
    loadOrders();
  }, [user]);

  // ✅ ISSUE #5: Use orders_with_item_summary view instead of direct orders table
  const loadOrders = async () => {
    try {
      setLoading(true);

      console.log("\n=== FETCHING ORDERS (BILLING SNAPSHOT) ===");
      console.log("User ID:", user.id);

      // ✅ Query the view which includes order_total snapshot
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders_with_item_summary")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Orders from view:", { ordersData, ordersError });

      if (ordersError) {
        console.error("Supabase error:", ordersError);
        throw ordersError;
      }

      // ✅ Log billing consistency check
      if (ordersData && ordersData.length > 0) {
        console.log("\n💰 BILLING SNAPSHOT CHECK:");
        ordersData.slice(0, 3).forEach(order => {
          console.log(`  Order #${order.order_id.slice(0, 8)}:`);
          console.log(`    order_total (snapshot): ₹${order.order_total}`);
          console.log(`    total_price (all in rupees): ₹${order.total_price}`);
          console.log(`    amount (all in rupees): ₹${order.amount}`);
          console.log(`    ✅ Display: ₹${getOrderTotal(order)}`);
        });
      }

      setOrders(ordersData || []);
      console.log(`✅ Loaded ${ordersData?.length || 0} orders from view`);
    } catch (error) {
      console.error("Error loading orders:", error);

      toast({
        title: "Error Loading Orders",
        description: error.message || "Failed to load orders. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (order) => {
    if (!order) return;

    setProcessingPayments((prev) => new Set(prev).add(order.order_id));

    try {
      // ✅ Get order total in rupees
      const orderTotal = getOrderTotal(order);
      // Convert to paise for payment gateway (PhonePe requires paise)
      const totalAmount = Math.round(orderTotal * 100);

      console.log('💳 PAYMENT:', {
        order_id: order.order_id.slice(0, 8),
        order_total_rupees: orderTotal,
        payment_gateway_paise: totalAmount
      });

      const form = document.createElement("form");
      form.method = "POST";
      form.action = PHONEPE_PAY_URL;
      form.style.display = "none";

      const fields = {
        orderId: order.order_id,
        amount: totalAmount,  // PhonePe expects paise
        customerEmail: order.customer_email || user.email,
        customerPhone: order.customer_phone || "",
        customerName: order.customer_name || user.name,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.error("PayNow failed:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
      setProcessingPayments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(order.order_id);
        return newSet;
      });
    }
  };

  const handleDownloadInvoice = async (order) => {
    if (!order) return;

    setDownloadingInvoices((prev) => new Set(prev).add(order.order_id));

    try {
      window.open(`/order/${order.order_id}`, "_blank");

      toast({
        title: "Invoice Ready",
        description: "Opening order details page where you can download the invoice.",
      });
    } catch (error) {
      console.error("Download invoice failed:", error);
      toast({
        title: "Download Error",
        description: "Failed to generate invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingInvoices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(order.order_id);
        return newSet;
      });
    }
  };

  const isOrderCompleted = (order) => {
    return (
      (order.payment_status === "completed" || order.payment_status === "paid") &&
      order.status !== "cancelled"
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto">
              <Card className="border border-gray-200">
                <CardContent className="p-8 sm:p-12">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Loading Your Orders
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Please wait while we fetch your order history...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!orders.length) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 mb-6 sm:mb-8">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        My Orders
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600">
                        Track and manage your order history
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 sm:p-12 text-center">
                  <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    No Orders Yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                    You haven't placed any orders yet. Start shopping to see your orders here.
                  </p>
                  <Link to="/shop">
                    <Button size="lg" className="px-6 sm:px-8">
                      Start Shopping
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 mb-6 sm:mb-8">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        My Orders
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600">
                        Track and manage your order history
                      </p>
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-xs sm:text-sm text-gray-600">Total Orders</div>
                    <Badge variant="secondary" className="text-sm sm:text-base px-3 py-1 mt-1">
                      {orders.length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <div className="space-y-4 sm:space-y-6">
              {orders.map((order) => {
                const arrival = getEstimatedArrival(
                  order.created_at,
                  order.status,
                  order.estimated_delivery_days
                );
                const isProcessingPayment = processingPayments.has(order.order_id);
                const isDownloadingInvoice = downloadingInvoices.has(order.order_id);
                const orderTotal = getOrderTotal(order);

                return (
                  <Card
                    key={order.order_id}
                    className={`border transition-colors overflow-hidden ${
                      order.payment_status === "pending"
                        ? "border-orange-200 bg-gradient-to-r from-orange-50/50 to-yellow-50/50"
                        : "border-gray-200 hover:border-primary/30"
                    }`}
                  >
                    {/* Payment Pending Alert */}
                    {order.payment_status === "pending" && (
                      <div className="bg-orange-100 border-b border-orange-200 px-4 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">
                              Payment pending - Complete to confirm order
                            </span>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handlePayNow(order)}
                            disabled={isProcessingPayment}
                            className="bg-orange-600 hover:bg-orange-700 text-white"
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-3 w-3 mr-1" />
                                Pay ₹{orderTotal.toFixed(2)}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Order Header */}
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base sm:text-lg">
                              Order #{order.order_id.slice(0, 8).toUpperCase()}
                            </CardTitle>
                            <Badge className={`${getStatusColor(order.status)} text-xs`}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(order.status)}
                                <span className="capitalize">{order.status}</span>
                              </div>
                            </Badge>

                            {order.payment_status && (
                              <Badge
                                className={`${getPaymentStatusColor(order.payment_status)} text-xs`}
                              >
                                {order.payment_status}
                              </Badge>
                            )}

                            {order.requires_customization && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                              >
                                <Wrench className="h-3 w-3 mr-1" />
                                Custom
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>Placed {new Date(order.created_at).toLocaleDateString()}</span>
                            </div>

                            {arrival.text && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className={arrival.isPast ? "text-red-600" : "text-green-600"}>
                                  {arrival.text}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>
                                {order.total_items} item{order.total_items > 1 ? "s" : ""} (
                                {order.total_quantity} units)
                              </span>
                            </div>
                          </div>

                          {order.production_status && order.production_status !== "pending" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">Production:</span>
                              <Badge
                                className={`${getProductionStatusColor(order.production_status)} text-xs`}
                              >
                                {order.production_status.replace("_", " ")}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="text-left sm:text-right space-y-2">
                          <p className="text-lg sm:text-xl font-bold text-gray-900">
                            ₹{orderTotal.toFixed(2)}
                          </p>
                          <div className="space-y-1">
                            {order.payment_method && (
                              <p className="text-xs sm:text-sm text-gray-600 capitalize">
                                {order.payment_method.replace("_", " ")}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Order Items Preview */}
                    <CardContent className="pt-0">
                      {/* First item preview from view */}
                      {order.first_product_name && (
                        <div className="space-y-3 sm:space-y-4">
                          <div className="flex items-center gap-3 sm:gap-4 p-3 bg-gray-50 rounded-lg">
                            {order.first_product_image && (
                              <img
                                src={order.first_product_image}
                                alt={order.first_product_name}
                                className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded-md border"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                {order.first_product_name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                                {order.first_catalog_number && (
                                  <span>SKU: {order.first_catalog_number}</span>
                                )}
                                {order.total_items > 1 && (
                                  <>
                                    <span>•</span>
                                    <span>+{order.total_items - 1} more</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {order.order_notes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Note:</strong> {order.order_notes}
                          </p>
                        </div>
                      )}

                      <Separator className="my-4" />

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {order.payment_status === "pending" && (
                          <Button
                            onClick={() => handlePayNow(order)}
                            disabled={isProcessingPayment}
                            className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700"
                          >
                            {isProcessingPayment ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Now - ₹{orderTotal.toFixed(2)}
                              </>
                            )}
                          </Button>
                        )}

                        <Link to={`/order/${order.order_id}`} className="flex-1 sm:flex-none">
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>

                        {isOrderCompleted(order) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(order)}
                            disabled={isDownloadingInvoice}
                            className="w-full sm:w-auto"
                          >
                            {isDownloadingInvoice ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Invoice
                              </>
                            )}
                          </Button>
                        )}

                        {order.payment_status !== "pending" && (
                          <>
                            {order.status === "delivered" && (
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <Star className="h-4 w-4 mr-2" />
                                Rate Order
                              </Button>
                            )}

                            {order.status === "shipped" && (
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                <Truck className="h-4 w-4 mr-2" />
                                Track Package
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
