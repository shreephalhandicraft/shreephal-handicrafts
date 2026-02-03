import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { initiateRazorpayPayment } from "@/utils/razorpayPaymentHandler";

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
  CreditCard,
  Download,
  MoreVertical,
  Mail,
  Phone,
} from "lucide-react";

// Utility: Get relative time ("2 days ago")
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Utility: Get status configuration
const getStatusConfig = (status) => {
  const configs = {
    pending: {
      label: "Payment Pending",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      dotColor: "bg-yellow-500",
    },
    confirmed: {
      label: "Confirmed",
      icon: CheckCircle,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      dotColor: "bg-blue-500",
    },
    processing: {
      label: "Processing",
      icon: Package,
      color: "bg-purple-100 text-purple-800 border-purple-200",
      dotColor: "bg-purple-500",
    },
    shipped: {
      label: "Shipped",
      icon: Truck,
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      dotColor: "bg-indigo-500",
    },
    delivered: {
      label: "Delivered",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 border-green-200",
      dotColor: "bg-green-500",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      color: "bg-red-100 text-red-800 border-red-200",
      dotColor: "bg-red-500",
    },
  };

  return configs[status?.toLowerCase()] || {
    label: status,
    icon: AlertCircle,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    dotColor: "bg-gray-500",
  };
};

// Timeline steps configuration
const getTimelineSteps = (status) => {
  const steps = [
    { key: "confirmed", label: "Confirmed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const statusOrder = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const currentIndex = statusOrder.indexOf(status?.toLowerCase());

  if (status?.toLowerCase() === "cancelled") {
    return steps.map(() => ({ ...steps[0], completed: false, active: false, cancelled: true }));
  }

  return steps.map((step, index) => {
    const stepIndex = statusOrder.indexOf(step.key);
    return {
      ...step,
      completed: stepIndex <= currentIndex,
      active: stepIndex === currentIndex,
      cancelled: false,
    };
  });
};

// Get order total
const getOrderTotal = (order) => {
  if (order.order_total != null) return Number(order.order_total);
  if (order.amount != null) return Number(order.amount);
  if (order.subtotal != null && order.total_gst != null) {
    return Number(order.subtotal) + Number(order.total_gst);
  }
  return 0;
};

export default function MyOrders() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayments, setProcessingPayments] = useState(new Set());

  // ✅ FIX: Use user.id instead of user object to prevent unnecessary re-fetches
  useEffect(() => {
    if (!user?.id) return;
    loadOrders();
  }, [user?.id]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const orderIds = ordersData.map((o) => o.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`*, products (id, title, image_url)`)
        .in("order_id", orderIds);

      if (itemsError) console.warn("Failed to fetch order items:", itemsError);

      const itemsByOrderId = {};
      (itemsData || []).forEach((item) => {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push(item);
      });

      const ordersWithItems = ordersData.map((order) => {
        const items = itemsByOrderId[order.id] || [];
        const firstItem = items[0];

        const totalItems = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

        const shippingInfo = order.shipping_info || {};
        const customerName = `${shippingInfo.firstName || ""} ${shippingInfo.lastName || ""}`.trim() || user.name;
        const customerEmail = shippingInfo.email || user.email;
        const customerPhone = shippingInfo.phone || "";

        return {
          ...order,
          order_id: order.id,
          order_total: order.order_total,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          customer_name: customerName,
          total_items: totalItems,
          total_quantity: totalQuantity,
          first_product_name: firstItem?.product_name || firstItem?.products?.title || null,
          first_product_image: firstItem?.products?.image_url || null,
          first_catalog_number: firstItem?.product_catalog_number || null,
          all_items: items,
        };
      });

      setOrders(ordersWithItems);
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
      const orderTotal = getOrderTotal(order);

      await initiateRazorpayPayment({
        orderId: order.order_id,
        amount: orderTotal,
        customerName: order.customer_name || user.name,
        customerEmail: order.customer_email || user.email,
        customerPhone: order.customer_phone || "",

        onSuccess: async (paymentData) => {
          toast({
            title: "Payment Successful! 🎉",
            description: `Order #${order.order_id.slice(0, 8)} has been confirmed.`,
            duration: 3000,
          });
          await loadOrders();
          setProcessingPayments((prev) => {
            const newSet = new Set(prev);
            newSet.delete(order.order_id);
            return newSet;
          });
        },

        onFailure: async (errorData) => {
          toast({
            title: "Payment Failed",
            description: errorData.error || "Payment could not be completed. Please try again.",
            variant: "destructive",
            duration: 8000,
          });
          setProcessingPayments((prev) => {
            const newSet = new Set(prev);
            newSet.delete(order.order_id);
            return newSet;
          });
        },
      });
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

  const handleContactSupport = (order) => {
    window.location.href = `/contact?order=${order.order_id.slice(0, 8)}`;
  };

  const isOrderCompleted = (order) => {
    return (
      (order.payment_status === "completed" || order.payment_status === "paid") &&
      order.status !== "cancelled"
    );
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-5xl mx-auto">
              {/* Header Skeleton */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-64"></div>
                  </div>
                </div>
              </div>

              {/* Order Cards Skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-6 mb-6 animate-pulse">
                  <div className="flex gap-4 mb-4">
                    <div className="h-24 w-24 sm:h-32 sm:w-32 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded-lg w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state
  if (!orders.length) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-5xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-12 sm:p-20 text-center">
                  <div className="inline-flex items-center justify-center h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 mb-6">
                    <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                    No Orders Yet
                  </h2>
                  <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-md mx-auto">
                    Start exploring our collection and place your first order to see it here!
                  </p>
                  <Link to="/shop">
                    <Button size="lg" className="px-8 py-6 text-base sm:text-lg">
                      Start Shopping
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-5xl mx-auto">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <ShoppingBag className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                      My Orders
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      Track and manage your purchases
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl px-6 py-3 shadow-sm">
                  <div className="text-sm text-gray-600">Total Orders</div>
                  <div className="text-3xl font-bold text-primary mt-1">{orders.length}</div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-6">
              {orders.map((order) => {
                const isProcessingPayment = processingPayments.has(order.order_id);
                const orderTotal = getOrderTotal(order);
                const statusConfig = getStatusConfig(order.status);
                const StatusIcon = statusConfig.icon;
                const timelineSteps = getTimelineSteps(order.status);
                const isPending = order.payment_status === "pending";
                const showProductionStatus =
                  order.production_status &&
                  ["in_progress", "quality_check"].includes(order.production_status.toLowerCase());

                return (
                  <Card
                    key={order.order_id}
                    className={`overflow-hidden transition-all duration-300 ${
                      isPending
                        ? "border-2 border-orange-200 shadow-lg shadow-orange-100/50"
                        : "border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1"
                    }`}
                  >
                    {/* Payment Pending Alert */}
                    {isPending && (
                      <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-b border-orange-200 px-4 sm:px-6 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-600 animate-pulse" />
                            <span className="text-sm sm:text-base font-semibold text-orange-900">
                              Complete payment to confirm your order
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <CardContent className="p-6 sm:p-8">
                      {/* Order Header */}
                      <div className="flex flex-col lg:flex-row gap-6 mb-6">
                        {/* Product Image - Larger */}
                        <div className="flex-shrink-0">
                          {order.first_product_image ? (
                            <img
                              src={order.first_product_image}
                              alt={order.first_product_name || "Product"}
                              className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-xl shadow-md border-2 border-gray-100"
                            />
                          ) : (
                            <div className="h-24 w-24 sm:h-32 sm:w-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                              <Package className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                                  #{order.order_id.slice(0, 8).toUpperCase()}
                                </h3>
                                {/* Primary Status Badge */}
                                <Badge className={`${statusConfig.color} text-xs sm:text-sm`}>
                                  <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {statusConfig.label}
                                </Badge>

                                {/* Payment Status (only if pending/failed) */}
                                {(order.payment_status === "pending" || order.payment_status === "failed") && (
                                  <Badge className="bg-red-100 text-red-800 text-xs sm:text-sm">
                                    Payment {order.payment_status}
                                  </Badge>
                                )}
                              </div>

                              {/* Product Name */}
                              {order.first_product_name && (
                                <p className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                                  {order.first_product_name}
                                  {order.total_items > 1 && (
                                    <span className="text-gray-500 text-sm ml-2">
                                      +{order.total_items - 1} more
                                    </span>
                                  )}
                                </p>
                              )}

                              {/* Order Meta */}
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-2">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{getRelativeTime(order.created_at)}</span>
                                </div>
                                <span className="text-gray-300">•</span>
                                <div className="flex items-center gap-1">
                                  <Package className="h-4 w-4" />
                                  <span>
                                    {order.total_quantity} {order.total_quantity === 1 ? "item" : "items"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                                ₹{orderTotal.toFixed(2)}
                              </div>
                              {order.payment_method && (
                                <div className="text-xs sm:text-sm text-gray-500 mt-1 capitalize">
                                  {order.payment_method.replace("_", " ")}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Visual Timeline - Only if not pending payment */}
                          {!isPending && order.status !== "cancelled" && (
                            <div className="mb-6">
                              <div className="flex items-center justify-between relative">
                                {/* Progress Line */}
                                <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200">
                                  <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{
                                      width: `${(timelineSteps.filter((s) => s.completed).length / timelineSteps.length) * 100}%`,
                                    }}
                                  ></div>
                                </div>

                                {/* Steps */}
                                {timelineSteps.map((step, index) => (
                                  <div key={step.key} className="flex flex-col items-center relative z-10">
                                    <div
                                      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                        step.completed
                                          ? "bg-primary text-white shadow-lg scale-110"
                                          : "bg-gray-200 text-gray-400"
                                      }`}
                                    >
                                      {step.completed ? (
                                        <CheckCircle className="h-4 w-4" />
                                      ) : (
                                        <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                      )}
                                    </div>
                                    <span
                                      className={`text-xs mt-2 font-medium ${
                                        step.completed ? "text-primary" : "text-gray-500"
                                      }`}
                                    >
                                      {step.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Production Status (only if active) */}
                          {showProductionStatus && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-blue-900">
                                  Production Status:
                                </span>
                                <span className="text-sm text-blue-700 capitalize">
                                  {order.production_status.replace("_", " ")}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Order Notes */}
                          {order.order_notes && (
                            <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <p className="text-sm text-amber-900">
                                <strong className="font-semibold">Note:</strong> {order.order_notes}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            {/* Primary Action */}
                            {isPending ? (
                              <Button
                                onClick={() => handlePayNow(order)}
                                disabled={isProcessingPayment}
                                size="lg"
                                className="flex-1 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all min-h-[44px]"
                              >
                                {isProcessingPayment ? (
                                  <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-5 w-5 mr-2" />
                                    Complete Payment - ₹{orderTotal.toFixed(2)}
                                  </>
                                )}
                              </Button>
                            ) : (
                              <Link to={`/order/${order.order_id}`} className="flex-1">
                                <Button
                                  variant="default"
                                  size="lg"
                                  className="w-full shadow-md hover:shadow-lg transition-all min-h-[44px]"
                                >
                                  <Eye className="h-5 w-5 mr-2" />
                                  View Order Details
                                </Button>
                              </Link>
                            )}

                            {/* Secondary Actions Dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="sm:w-auto min-h-[44px] min-w-[44px]"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem onClick={() => handleContactSupport(order)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Contact Support
                                </DropdownMenuItem>
                                {isOrderCompleted(order) && (
                                  <DropdownMenuItem asChild>
                                    <Link to={`/order/${order.order_id}`}>
                                      <Download className="h-4 w-4 mr-2" />
                                      Download Invoice
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
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
