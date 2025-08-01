import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Truck,
  MapPin,
  Eye,
  RefreshCw,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  User,
  Home,
  Copy,
  CheckCircle2,
  AlertCircle,
  Star,
  Wrench,
  Image as ImageIcon,
  FileText,
  Palette,
  Ruler,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabaseClient";

// PayNow configuration
const PHONEPE_PAY_URL =
  process.env.NODE_ENV === "production"
    ? "https://shrifal-handicrafts.onrender.com/pay" // Replace with your actual Render URL
    : "http://localhost:3000/pay";

// Add this helper function at the top of your component, after the imports
const renderCustomizationDetails = (item, customizationDetails) => {
  if (!customizationDetails) return null;

  // Parse customization_details if it's a string
  let customizationObj = {};
  if (typeof customizationDetails === "string") {
    try {
      customizationObj = JSON.parse(customizationDetails);
    } catch (e) {
      console.error("Invalid customizationDetails JSON", e);
      return null;
    }
  } else if (
    typeof customizationDetails === "object" &&
    customizationDetails !== null
  ) {
    customizationObj = customizationDetails;
  }

  // Use productId to lookup customization from customization_details
  const productId = item.productId || item.id;
  const customizationDetail = customizationObj[productId];

  // If no direct match and single item, use the only available customization
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

  const customText = customizations.text ? customizations.text.trim() : "";
  const customSize = customizations.size ? customizations.size.trim() : "";
  const customColor = customizations.color ? customizations.color.trim() : "";
  const customUploadedImage = customizations.uploadedImage || null;
  const productTitle = customizationDetail.productTitle
    ? customizationDetail.productTitle.trim()
    : "";

  // Check if there's any meaningful customization data
  const hasAnyCustomizationData =
    customText !== "" ||
    customSize !== "" ||
    customColor !== "" ||
    (customUploadedImage &&
      customUploadedImage.url &&
      customUploadedImage.url.trim() !== "") ||
    productTitle !== "";

  if (!hasAnyCustomizationData) return null;

  return (
    <div className="p-2 sm:p-3 bg-orange-50 rounded-lg border border-orange-200">
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
        <span className="text-xs sm:text-sm font-medium text-orange-800">
          Customization Details
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {customText !== "" && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3 text-orange-600" />
            <span>Text: {customText}</span>
          </div>
        )}
        {customSize !== "" && (
          <div className="flex items-center gap-1">
            <Ruler className="h-3 w-3 text-orange-600" />
            <span>Size: {customSize}</span>
          </div>
        )}
        {customColor !== "" && (
          <div className="flex items-center gap-1">
            <Palette className="h-3 w-3 text-orange-600" />
            <span>Color: {customColor}</span>
          </div>
        )}
        {productTitle !== "" && (
          <div className="flex items-center gap-1">
            <Package className="h-3 w-3 text-orange-600" />
            <span>Product: {productTitle}</span>
          </div>
        )}
        {customUploadedImage?.url && (
          <div className="col-span-full">
            <div className="flex items-center gap-1 mb-2">
              <ImageIcon className="h-3 w-3 text-orange-600" />
              <span>Uploaded Image:</span>
            </div>
            <img
              src={customUploadedImage.url}
              alt={customUploadedImage.fileName || "Custom Image"}
              className="max-w-full h-auto rounded shadow border"
              style={{ maxHeight: "120px" }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            {customUploadedImage.fileName && (
              <p className="text-xs text-gray-500 mt-1">
                File: {customUploadedImage.fileName}
              </p>
            )}
          </div>
        )}
        {customizationDetail.timestamp && (
          <div className="col-span-full text-xs text-gray-500 pt-1 border-t border-orange-200">
            Customized:{" "}
            {new Date(customizationDetail.timestamp).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

// ----- Status helpers -----
const getStatusIcon = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return <CheckCircle className="h-4 w-4" />;
    case "shipped":
      return <Truck className="h-4 w-4" />;
    case "confirmed":
      return <CheckCircle2 className="h-4 w-4" />;
    case "processing":
      return <Package className="h-4 w-4" />;
    case "cancelled":
    case "failed":
      return <XCircle className="h-4 w-4" />;
    case "pending":
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "bg-green-100 text-green-800 border-green-200";
    case "shipped":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "confirmed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "processing":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    case "pending":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getPaymentStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
    case "paid":
      return "bg-green-100 text-green-800 border-green-200";
    case "pending":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const ProductFallbackIcon = ({ className = "w-16 h-16" }) => (
  <div
    className={`${className} bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300`}
  >
    <Package className="h-6 w-6 text-gray-400" />
  </div>
);

export default function OrderDetail() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [productsCache, setProductsCache] = useState(new Map());
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (!orderId || !user) return;
    fetchOrder();
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*, customization_details") // Add customization_details to the select
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setOrder(data);
        await loadProductDetails(data);
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      });
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const loadProductDetails = async (orderData) => {
    try {
      const items = orderData.items || [];
      const catalogItems = orderData.catalog_items || [];
      const allItems = [...items, ...catalogItems];

      const productIds = allItems.map((item) => item.id).filter((id) => id);

      if (productIds.length > 0) {
        const { data: productsData, error } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (!error && productsData) {
          const cache = new Map();
          productsData.forEach((product) => {
            cache.set(product.id, product);
          });
          setProductsCache(cache);
        }
      }
    } catch (error) {
      console.error("Error loading product details:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, customization_details") // Add customization_details here too
        .eq("id", orderId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setOrder(data);
      await loadProductDetails(data);

      toast({
        title: "Refreshed",
        description: "Order details have been updated.",
      });
    } catch (error) {
      console.error("Error refreshing order:", error);
      toast({
        title: "Error",
        description: "Failed to refresh order details.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handlePayNow = async () => {
    if (!order) return;

    setProcessingPayment(true);

    try {
      const totalAmount = Math.round(Number(order.amount) * 100); // Convert to paise

      // Create a form and submit to PhonePe
      const form = document.createElement("form");
      form.method = "POST";
      form.action = PHONEPE_PAY_URL;
      form.style.display = "none";

      // Add form fields
      const fields = {
        orderId: order.id,
        amount: totalAmount,
        customerEmail: order.shipping_info?.email || user.email,
        customerPhone: order.shipping_info?.phone || "",
        customerName:
          `${order.shipping_info?.firstName || ""} ${
            order.shipping_info?.lastName || ""
          }`.trim() || user.name,
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
        description:
          error.message || "Failed to initiate payment. Please try again.",
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
      toast({
        title: "Copied",
        description: "Text copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy text.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-6xl mx-auto">
              <Card className="border border-gray-200">
                <CardContent className="p-8 sm:p-12">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Loading Order Details
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 mt-1">
                        Please wait while we fetch your order information...
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

  if (!order) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50/50">
          <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
            <div className="max-w-4xl mx-auto">
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="p-8 sm:p-12 text-center">
                  <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Order Not Found
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
                    The order you're looking for doesn't exist or you don't have
                    access to it.
                  </p>
                  <Link to="/my-orders">
                    <Button size="lg" className="px-6 sm:px-8">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Orders
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

  // Get order data
  const shipping = order.shipping_info ?? {};
  const delivery = order.delivery_info ?? {};
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const catalogItems = Array.isArray(order.catalog_items)
    ? order.catalog_items
    : [];
  const allItems = [...orderItems, ...catalogItems];
  const orderCreated = order.created_at
    ? new Date(order.created_at).toLocaleString()
    : "—";

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 mb-6 sm:mb-8">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  {/* Navigation and Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Link to="/my-orders">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 sm:px-4"
                        >
                          <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">
                            Back to Orders
                          </span>
                          <span className="sm:hidden">Back</span>
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="px-3 sm:px-4"
                      >
                        <RefreshCw
                          className={`h-3 w-3 sm:h-4 sm:w-4 ${
                            refreshing ? "animate-spin" : ""
                          } mr-1 sm:mr-2`}
                        />
                        <span className="hidden sm:inline">
                          {refreshing ? "Refreshing..." : "Refresh"}
                        </span>
                        <span className="sm:hidden">↻</span>
                      </Button>
                    </div>

                    {/* Order Status Badge */}
                    <Badge
                      className={`${getStatusColor(
                        order.status
                      )} text-xs sm:text-sm px-2 sm:px-3 py-1`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </div>
                    </Badge>
                  </div>

                  {/* Order Header Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Placed {orderCreated}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>
                            {allItems.length} item
                            {allItems.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                        ₹{Number(order.amount)?.toLocaleString() || "0"}
                      </p>
                      <Badge
                        className={`${getPaymentStatusColor(
                          order.payment_status
                        )} text-xs mt-1`}
                      >
                        {order.payment_status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Reminder Banner - Only for pending payments */}
            {order.payment_status === "pending" && (
              <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mb-6 sm:mb-8">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-900 text-sm sm:text-base">
                          Payment Pending
                        </h3>
                        <p className="text-xs sm:text-sm text-orange-700">
                          Complete your payment to confirm this order
                        </p>
                      </div>
                    </div>
                    <div className="sm:ml-auto">
                      <Button
                        onClick={handlePayNow}
                        disabled={processingPayment}
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay ₹{Number(order.amount)?.toLocaleString() || "0"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - Order Items and Status */}
              <div className="xl:col-span-2 space-y-6 sm:space-y-8">
                {/* Order Status Details */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Order Status & Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Order Status
                        </p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className="font-medium capitalize text-sm sm:text-base">
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-1">
                          Payment Status
                        </p>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-600" />
                          <span className="font-medium capitalize text-sm sm:text-base">
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {order.payment_method && (
                      <div className="p-3 sm:p-4 bg-primary/5 rounded-lg">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          Payment Details
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Method:</span>
                            <span className="font-medium capitalize">
                              {order.payment_method.replace("_", " ")}
                            </span>
                          </div>
                          {order.upi_reference && (
                            <div className="flex items-center justify-between text-sm">
                              <span>UPI Reference:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">
                                  {order.upi_reference}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCopy(order.upi_reference, "upi")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  {copiedField === "upi" ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                          {order.transaction_id && (
                            <div className="flex items-center justify-between text-sm">
                              <span>Transaction ID:</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">
                                  {order.transaction_id}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleCopy(order.transaction_id, "txn")
                                  }
                                  className="h-6 w-6 p-0"
                                >
                                  {copiedField === "txn" ? (
                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Order Items */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Order Items ({allItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 sm:space-y-6">
                      {allItems.map((item, idx) => {
                        const productDetails = productsCache.get(item.id);
                        const itemImage =
                          productDetails?.image_url || item.image;
                        const itemName =
                          productDetails?.title ||
                          item.name ||
                          item.title ||
                          "Product";

                        return (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border-b border-gray-200 last:border-b-0"
                          >
                            {/* Product Image */}
                            <div className="flex-shrink-0 mx-auto sm:mx-0">
                              {itemImage ? (
                                <img
                                  src={itemImage}
                                  alt={itemName}
                                  className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <ProductFallbackIcon
                                className={`w-16 h-16 sm:w-20 sm:h-20 ${
                                  itemImage ? "hidden" : "flex"
                                }`}
                              />
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 space-y-2 text-center sm:text-left">
                              <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                {itemName}
                              </h3>
                              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs sm:text-sm text-gray-600">
                                <span>Qty: {item.quantity || 1}</span>
                                <span>•</span>
                                <span className="font-medium">
                                  ₹{Number(item.price || 0).toLocaleString()}
                                </span>
                                {productDetails?.catalog_number && (
                                  <>
                                    <span>•</span>
                                    <span>{productDetails.catalog_number}</span>
                                  </>
                                )}
                              </div>
                              {/* Product specifications */}
                              {productDetails && (
                                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs text-gray-500">
                                  {productDetails.material_type && (
                                    <div className="flex items-center gap-1">
                                      <FileText className="h-3 w-3" />
                                      <span>
                                        {productDetails.material_type}
                                      </span>
                                    </div>
                                  )}
                                  {productDetails.weight_grams && (
                                    <div className="flex items-center gap-1">
                                      <Package className="h-3 w-3" />
                                      <span>
                                        {productDetails.weight_grams}g
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Customization Details - FIXED */}
                              {renderCustomizationDetails(
                                item,
                                order.customization_details
                              )}
                            </div>

                            {/* Price */}
                            <div className="text-center sm:text-right">
                              <p className="text-sm sm:text-base font-bold text-gray-900">
                                ₹{Number(item.price || 0).toLocaleString()}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-xs text-gray-500">
                                  ₹
                                  {Number(
                                    (item.price || 0) / item.quantity
                                  ).toLocaleString()}{" "}
                                  each
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                {order.order_notes && (
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Order Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm sm:text-base text-blue-800">
                          {order.order_notes}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Summary and Address */}
              <div className="space-y-6 sm:space-y-8">
                {/* Order Summary */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Order Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{(Number(order.amount) / 1.08).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax (8%)</span>
                        <span>
                          ₹
                          {(
                            Number(order.amount) -
                            Number(order.amount) / 1.08
                          ).toFixed(2)}
                        </span>
                      </div>
                      {order.shipping_cost && (
                        <div className="flex justify-between text-sm">
                          <span>Shipping</span>
                          <span>
                            ₹{Number(order.shipping_cost).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between font-bold text-base sm:text-lg">
                        <span>Total Paid</span>
                        <span>
                          ₹{Number(order.amount)?.toLocaleString() || "0"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card className="border border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(shipping.firstName || shipping.lastName) && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-sm sm:text-base">
                            {shipping.firstName} {shipping.lastName}
                          </span>
                        </div>
                      )}

                      {shipping.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-600" />
                          <span className="text-sm sm:text-base">
                            {shipping.phone}
                          </span>
                        </div>
                      )}

                      {shipping.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-600" />
                          <span className="text-sm sm:text-base">
                            {shipping.email}
                          </span>
                        </div>
                      )}

                      {shipping.address && (
                        <div className="flex items-start gap-2">
                          <Home className="h-4 w-4 text-gray-600 mt-1" />
                          <div className="text-sm sm:text-base space-y-1">
                            <div>{shipping.address}</div>
                            {(shipping.city ||
                              shipping.state ||
                              shipping.zipCode) && (
                              <div>
                                {shipping.city}
                                {shipping.city && shipping.state ? ", " : ""}
                                {shipping.state} {shipping.zipCode}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tracking Information */}
                {(delivery.trackingNumber ||
                  order.status === "shipped" ||
                  order.status === "delivered") && (
                  <Card className="border border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        Tracking Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {delivery.trackingNumber && (
                        <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-blue-800">
                              Tracking Number
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCopy(delivery.trackingNumber, "tracking")
                              }
                              className="h-6 w-6 p-0"
                            >
                              {copiedField === "tracking" ? (
                                <CheckCircle2 className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          <div className="font-mono text-sm text-blue-900">
                            {delivery.trackingNumber}
                          </div>
                        </div>
                      )}

                      {order.status === "delivered" &&
                        delivery.actualDelivery && (
                          <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="h-4 w-4" />
                              <span className="font-medium text-sm">
                                Delivered on{" "}
                                {new Date(
                                  delivery.actualDelivery
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}

                      {order.estimated_delivery_days &&
                        order.status !== "delivered" && (
                          <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2 text-yellow-800">
                              <Clock className="h-4 w-4" />
                              <span className="text-sm">
                                Estimated delivery:{" "}
                                {order.estimated_delivery_days} days from order
                                date
                              </span>
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <Card className="border border-gray-200">
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3">
                      {/* Pay Now Button for Pending Payments */}
                      {order.payment_status === "pending" && (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handlePayNow}
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now - ₹
                              {Number(order.amount)?.toLocaleString() || "0"}
                            </>
                          )}
                        </Button>
                      )}

                      {/* Rate Order Button for Delivered Orders */}
                      {order.status === "delivered" &&
                        order.payment_status !== "pending" && (
                          <Button className="w-full" size="lg">
                            <Star className="h-4 w-4 mr-2" />
                            Rate This Order
                          </Button>
                        )}

                      {/* Track Package Button for Shipped Orders */}
                      {order.status === "shipped" &&
                        delivery.trackingNumber && (
                          <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Track Package
                          </Button>
                        )}

                      {/* Download Invoice Button - Always available except for pending payments */}
                      {order.payment_status !== "pending" && (
                        <Button
                          variant="outline"
                          className="w-full"
                          size="lg"
                          onClick={() => setShowInvoice(true)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Download Invoice
                        </Button>
                      )}

                      {/* View Order Details - Alternative action for pending payments */}
                      {order.payment_status === "pending" && (
                        <Button
                          variant="outline"
                          className="w-full"
                          size="lg"
                          onClick={() => setShowInvoice(true)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Order Summary
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showInvoice && (
        <InvoiceGenerator order={order} onClose={() => setShowInvoice(false)} />
      )}
    </Layout>
  );
}
