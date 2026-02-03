import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import { formatCurrency } from "@/utils/billingUtils";
import { initiateRazorpayPayment } from "@/utils/razorpayPaymentHandler";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  RefreshCw,
  CreditCard,
  Phone,
  Mail,
  User,
  Copy,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Image as ImageIcon,
  FileText,
  Palette,
  Ruler,
  Loader2,
  Receipt,
  Download,
  MoreVertical,
  Check,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// Utility: Get relative time
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

// 🐛 FIX: Extract clean size display from variant
const getCleanSizeDisplay = (variant) => {
  if (!variant) return null;
  
  // If variant is already a string, return it
  if (typeof variant === 'string') {
    try {
      // Try to parse if it's a JSON string
      const parsed = JSON.parse(variant);
      return parsed.sizeDisplay || parsed.size_display || null;
    } catch {
      // If not JSON, return as-is
      return variant;
    }
  }
  
  // If variant is an object, extract sizeDisplay
  if (typeof variant === 'object' && variant !== null) {
    return variant.sizeDisplay || variant.size_display || null;
  }
  
  return null;
};

// Status configuration
const getStatusConfig = (status) => {
  const configs = {
    pending: {
      label: "Payment Pending",
      icon: Clock,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      message: "⏱️ Complete payment to start production",
    },
    confirmed: {
      label: "Confirmed",
      icon: CheckCircle2,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      message: "✅ Order confirmed and queued for production",
    },
    processing: {
      label: "Processing",
      icon: Package,
      color: "bg-purple-100 text-purple-800 border-purple-200",
      message: "🔨 Your order is being crafted",
    },
    shipped: {
      label: "Shipped",
      icon: Truck,
      color: "bg-indigo-100 text-indigo-800 border-indigo-200",
      message: "🚚 On the way to you",
    },
    delivered: {
      label: "Delivered",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 border-green-200",
      message: "✅ Delivered successfully",
    },
    cancelled: {
      label: "Cancelled",
      icon: XCircle,
      color: "bg-red-100 text-red-800 border-red-200",
      message: "❌ Order cancelled",
    },
  };

  return configs[status?.toLowerCase()] || {
    label: status,
    icon: AlertCircle,
    color: "bg-gray-100 text-gray-800 border-gray-200",
    message: "Order status unknown",
  };
};

// Timeline configuration
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
    };
  });
};

// Helper function to render customization details
const renderCustomizationDetails = (item, customizationDetails) => {
  if (!customizationDetails) return null;

  let customizationObj = {};
  if (typeof customizationDetails === "string") {
    try {
      customizationObj = JSON.parse(customizationDetails);
    } catch (e) {
      return null;
    }
  } else if (typeof customizationDetails === "object" && customizationDetails !== null) {
    customizationObj = customizationDetails;
  }

  const productId = item.product_id || item.id;
  const customizationDetail = customizationObj[productId];

  if (!customizationDetail && Object.keys(customizationObj).length === 1) {
    const onlyKey = Object.keys(customizationObj)[0];
    const singleCustomization = customizationObj[onlyKey];
    if (singleCustomization?.customizations) {
      return renderCustomizationContent(singleCustomization);
    }
  }

  if (!customizationDetail?.customizations) return null;
  return renderCustomizationContent(customizationDetail);
};

const renderCustomizationContent = (customizationDetail) => {
  const customizations = customizationDetail.customizations;
  const customText = customizations.text?.trim() || "";
  const customSize = customizations.size?.trim() || "";
  const customColor = customizations.color?.trim() || "";
  const customUploadedImage = customizations.uploadedImage || null;
  const productTitle = customizationDetail.productTitle?.trim() || "";

  const hasAnyCustomizationData =
    customText || customSize || customColor || customUploadedImage?.url?.trim() || productTitle;

  if (!hasAnyCustomizationData) return null;

  return (
    <div className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-semibold text-orange-800">Customization Details</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        {customText && (
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-gray-700">Text: <strong>{customText}</strong></span>
          </div>
        )}
        {customSize && (
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-gray-700">Size: <strong>{customSize}</strong></span>
          </div>
        )}
        {customColor && (
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-gray-700">Color: <strong>{customColor}</strong></span>
          </div>
        )}
        {productTitle && (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600 flex-shrink-0" />
            <span className="text-gray-700">Product: <strong>{productTitle}</strong></span>
          </div>
        )}
        {customUploadedImage?.url && (
          <div className="col-span-full">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-gray-700">Uploaded Image:</span>
            </div>
            <img
              src={customUploadedImage.url}
              alt={customUploadedImage.fileName || "Custom Image"}
              className="max-w-full h-auto rounded-lg shadow-md border border-orange-200"
              style={{ maxHeight: "200px" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
            {customUploadedImage.fileName && (
              <p className="text-xs text-gray-500 mt-2">
                File: {customUploadedImage.fileName}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ProductFallbackIcon = ({ className = "w-16 h-16" }) => (
  <div className={`${className} bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center border-2 border-gray-200`}>
    <Package className="h-8 w-8 text-gray-400" />
  </div>
);

export default function OrderDetail() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  // ✅ FIX: Use user.id instead of user object to prevent unnecessary re-fetches
  useEffect(() => {
    if (!orderId || !user?.id) return;
    fetchOrder();
  }, [orderId, user?.id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      // ✅ STEP 1: Fetch order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (orderError) throw orderError;
      if (!orderData) {
        setOrder(null);
        setItems([]);
        setLoading(false);
        return;
      }

      // ✅ STEP 2: Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select(`*, products (id, title, image_url), product_variants (id, size_display, size_numeric, size_unit)`)
        .eq("order_id", orderId);

      if (itemsError) console.warn("Failed to fetch items:", itemsError);

      // ✅ STEP 3: Map order data with CORRECT column name
      const mappedOrder = {
        id: orderData.id,
        user_id: orderData.user_id,
        status: orderData.status,
        payment_status: orderData.payment_status,
        payment_method: orderData.payment_method,
        production_status: orderData.production_status,
        order_total: parseFloat(orderData.order_total) || 0,
        amount: parseFloat(orderData.order_total) || 0,
        subtotal: parseFloat(orderData.subtotal) || 0,
        total_gst: parseFloat(orderData.total_gst) || 0,
        gst_5_total: parseFloat(orderData.gst_5_total) || 0,
        gst_18_total: parseFloat(orderData.gst_18_total) || 0,
        shipping_cost: parseFloat(orderData.shipping_cost) || 0,
        created_at: orderData.created_at,
        updated_at: orderData.updated_at,
        shipping_info: orderData.shipping_info,
        delivery_info: orderData.delivery_info,
        order_notes: orderData.order_notes,
        customization_details: orderData.customization_details,
        requires_customization: orderData.requires_customization,
        transaction_id: orderData.transaction_id,
      };

      // ✅ STEP 4: Map items with FIXED variant handling
      const mappedItems = itemsData?.map((item) => {
        const gstRate = parseFloat(item.gst_rate) || 0;
        const product = item.products || {};
        const variant = item.product_variants || {};
        
        const basePrice = parseFloat(item.base_price) || 0;
        const gstAmount = parseFloat(item.gst_amount) || 0;
        const unitPriceWithGst = parseFloat(item.unit_price_with_gst) || (basePrice + gstAmount);
        const itemTotal = parseFloat(item.item_total) || 0;
        
        // 🐛 FIX: Extract clean size display from variant_size_display
        let cleanSizeDisplay = null;
        
        // First try: variant_size_display from order_items table
        if (item.variant_size_display) {
          cleanSizeDisplay = getCleanSizeDisplay(item.variant_size_display);
        }
        
        // Second try: size_display from product_variants join
        if (!cleanSizeDisplay && variant.size_display) {
          cleanSizeDisplay = variant.size_display;
        }
        
        return {
          id: item.product_id,
          product_id: item.product_id,
          quantity: item.quantity,
          item_total: itemTotal,
          base_price: basePrice,
          gst_amount: gstAmount,
          gst_rate: gstRate,
          unit_price_with_gst: unitPriceWithGst,
          name: item.product_name || product.title,
          title: item.product_name || product.title,
          image: product.image_url,
          catalog_number: item.product_catalog_number,
          item_id: item.id,
          customization: item.customization_data,
          variant: {
            sizeDisplay: cleanSizeDisplay,  // 🐛 FIX: Use cleaned size display
            sizeNumeric: variant.size_numeric,
            sizeUnit: variant.size_unit,
          },
        };
      }) || [];

      setOrder(mappedOrder);
      setItems(mappedItems);
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
      setOrder(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrder();
    toast({ title: "Refreshed", description: "Order details updated." });
    setRefreshing(false);
  };

  const handlePayNow = async () => {
    if (!order) return;
    setProcessingPayment(true);

    try {
      const orderTotal = order.order_total;
      const shipping = order.shipping_info ?? {};

      await initiateRazorpayPayment({
        orderId: order.id,
        amount: orderTotal,
        customerName: `${shipping.firstName || ""} ${shipping.lastName || ""}`.trim() || user.name,
        customerEmail: shipping.email || user.email,
        customerPhone: shipping.phone || "",

        onSuccess: async () => {
          toast({
            title: "Payment Successful! 🎉",
            description: `Order #${order.id.slice(0, 8)} has been confirmed.`,
            duration: 3000,
          });
          await fetchOrder();
          setProcessingPayment(false);
        },

        onFailure: async (errorData) => {
          toast({
            title: "Payment Failed",
            description: errorData.error || "Payment could not be completed.",
            variant: "destructive",
            duration: 8000,
          });
          setProcessingPayment(false);
        },
      });
    } catch (error) {
      console.error("PayNow failed:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate payment.",
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  };

  const handleCopy = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({ title: "Copied!", description: "Copied to clipboard." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to copy.", variant: "destructive" });
    }
  };

  const handleContactSupport = () => {
    window.location.href = `/contact?order=${order.id.slice(0, 8)}`;
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-6xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-12 animate-pulse">
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Loading Order Details</h3>
                    <p className="text-base text-gray-600 mt-1">Please wait...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Not found state
  if (!order) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h3>
                <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
                  The order you're looking for doesn't exist or you don't have access to it.
                </p>
                <Link to="/my-orders">
                  <Button size="lg" className="px-8">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const shipping = order.shipping_info ?? {};
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const timelineSteps = getTimelineSteps(order.status);
  const isPending = order.payment_status === "pending";
  const showProductionStatus = order.production_status && ["in_progress", "quality_check"].includes(order.production_status.toLowerCase());

  const subtotal = order.subtotal;
  const totalGST = order.total_gst;
  const gst5Total = order.gst_5_total;
  const gst18Total = order.gst_18_total;
  const shippingCost = order.shipping_cost;
  const grandTotal = order.order_total;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl shadow-sm p-6 sm:p-8 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <Link to="/my-orders">
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-primary/20 hover:bg-primary/5"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </h1>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(order.id, "orderId")}
                        className="h-8 w-8 p-0"
                      >
                        {copiedField === "orderId" ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm sm:text-base text-gray-600">
                      🕐 {getRelativeTime(order.created_at)}
                    </p>
                  </div>
                </div>

                {/* Status Badges - Max 2 */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge className={`${statusConfig.color} text-sm sm:text-base px-3 py-1.5`}>
                    <StatusIcon className="h-4 w-4 mr-1.5" />
                    {statusConfig.label}
                  </Badge>

                  {(order.payment_status === "pending" || order.payment_status === "failed") && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-sm sm:text-base px-3 py-1.5">
                      <CreditCard className="h-4 w-4 mr-1.5" />
                      Payment {order.payment_status}
                    </Badge>
                  )}

                  {order.requires_customization && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      <Wrench className="h-3 w-3 mr-1" />
                      Customized
                    </Badge>
                  )}
                </div>

                {/* Visual Timeline */}
                {!isPending && order.status !== "cancelled" && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{
                            width: `${(timelineSteps.filter((s) => s.completed).length / timelineSteps.length) * 100}%`,
                          }}
                        ></div>
                      </div>

                      {timelineSteps.map((step) => (
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
              </div>
            </div>

            {/* Payment Pending Alert */}
            {isPending && (
              <div className="bg-gradient-to-r from-orange-100 to-yellow-100 border-2 border-orange-200 rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <h3 className="font-bold text-orange-900 text-lg">Payment Pending</h3>
                      <p className="text-base text-orange-700 mt-1">
                        Complete your payment to confirm this order and start production.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Production Status (only if active) */}
            {showProductionStatus && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-base font-semibold text-blue-900">
                    Production Status:
                  </span>
                  <span className="text-base text-blue-700 capitalize">
                    {order.production_status.replace("_", " ")}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Order Items */}
              <div className="xl:col-span-2 space-y-8">
                <Card className="border border-gray-200 shadow-md">
                  <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Package className="h-6 w-6 text-primary" />
                      Order Items ({items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {items.map((item, index) => {
                        // 🐛 FIX: Clean size display
                        const sizeDisplay = item.variant?.sizeDisplay;
                        
                        return (
                          <div key={item.item_id || index}>
                            <div className="flex gap-4">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded-xl shadow-md border-2 border-gray-100 flex-shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <ProductFallbackIcon
                                className="h-24 w-24 sm:h-32 sm:w-32 flex-shrink-0"
                                style={{ display: item.image ? "none" : "flex" }}
                              />

                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-base sm:text-lg text-gray-900 mb-2">
                                  {item.name || item.title || "Product"}
                                </h4>

                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                                  {item.catalog_number && <span>SKU: {item.catalog_number}</span>}
                                  {sizeDisplay && (
                                    <>
                                      <span>•</span>
                                      <span>Size: {sizeDisplay}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span className="font-medium">Qty: {item.quantity}</span>
                                  {item.gst_rate > 0 && (
                                    <>
                                      <span>•</span>
                                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                        GST @{item.gst_rate}%
                                      </Badge>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-baseline gap-2">
                                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {formatCurrency(item.item_total)}
                                  </span>
                                  {item.quantity > 1 && (
                                    <span className="text-sm text-gray-500">
                                      ({formatCurrency(item.unit_price_with_gst)} each)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {item.customization && Object.keys(item.customization).length > 0 && (
                              <div className="mt-4">
                                {renderCustomizationDetails(item, {
                                  [item.product_id]: { customizations: item.customization },
                                })}
                              </div>
                            )}

                            {index < items.length - 1 && <Separator className="mt-6" />}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                {order.order_notes && (
                  <Card className="border-2 border-amber-200 bg-amber-50/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-amber-900">
                        <AlertCircle className="h-5 w-5" />
                        Order Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-base text-amber-800">{order.order_notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Summary & Details */}
              <div className="space-y-8">
                {/* Order Summary - Sticky on desktop */}
                <Card className="border border-gray-200 shadow-lg xl:sticky xl:top-8">
                  <CardHeader className="border-b border-gray-200 bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardTitle className="text-xl">💰 Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">{formatCurrency(subtotal)}</span>
                      </div>

                      {totalGST > 0 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-base text-orange-600">
                            <span className="font-medium">GST Breakdown:</span>
                          </div>
                          {gst5Total > 0 && (
                            <div className="flex justify-between text-sm pl-4">
                              <span className="text-gray-600">GST @5%</span>
                              <span className="font-medium text-orange-600">+{formatCurrency(gst5Total)}</span>
                            </div>
                          )}
                          {gst18Total > 0 && (
                            <div className="flex justify-between text-sm pl-4">
                              <span className="text-gray-600">GST @18%</span>
                              <span className="font-medium text-orange-600">+{formatCurrency(gst18Total)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-base pl-4 pt-1 border-t border-orange-100">
                            <span className="font-medium">Total GST</span>
                            <span className="font-semibold text-orange-600">+{formatCurrency(totalGST)}</span>
                          </div>
                        </div>
                      )}

                      {shippingCost > 0 ? (
                        <div className="flex justify-between text-base">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-semibold">+{formatCurrency(shippingCost)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-base">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-semibold text-green-600">FREE ✨</span>
                        </div>
                      )}

                      <Separator className="my-4" />

                      <div className="flex justify-between text-xl font-bold">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(grandTotal)}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4">
                        {isPending ? (
                          <Button
                            onClick={handlePayNow}
                            disabled={processingPayment}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg min-h-[44px]"
                            size="lg"
                          >
                            {processingPayment ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CreditCard className="h-5 w-5 mr-2" />
                                Pay Now - {formatCurrency(grandTotal)}
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            className="w-full shadow-md min-h-[44px]"
                            onClick={() => setShowInvoice(true)}
                            size="lg"
                          >
                            <Download className="h-5 w-5 mr-2" />
                            Download Invoice
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full min-h-[44px]" size="lg">
                              <MoreVertical className="h-5 w-5 mr-2" />
                              More Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={handleContactSupport}>
                              <Mail className="h-4 w-4 mr-2" />
                              Contact Support
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowInvoice(true)}>
                              <Receipt className="h-4 w-4 mr-2" />
                              View Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card className="border border-gray-200 shadow-md">
                  <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Truck className="h-5 w-5 text-primary" />
                      Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4 text-base">
                      {(shipping.firstName || shipping.lastName) && (
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium text-gray-900">
                              {shipping.firstName} {shipping.lastName}
                            </p>
                          </div>
                        </div>
                      )}

                      {shipping.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{shipping.phone}</p>
                          </div>
                        </div>
                      )}

                      {shipping.email && (
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{shipping.email}</p>
                          </div>
                        </div>
                      )}

                      {(shipping.address || shipping.city || shipping.state || shipping.zipCode) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <div className="font-medium text-gray-900">
                              {shipping.address && <p>{shipping.address}</p>}
                              {(shipping.city || shipping.state || shipping.zipCode) && (
                                <p>
                                  {[shipping.city, shipping.state, shipping.zipCode]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showInvoice && <InvoiceGenerator order={{ ...order, items }} onClose={() => setShowInvoice(false)} />}
    </Layout>
  );
}
