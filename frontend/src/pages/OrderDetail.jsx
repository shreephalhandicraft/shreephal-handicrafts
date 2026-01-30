import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import InvoiceGenerator from "@/components/InvoiceGenerator";
import { calculateItemPricing, calculateOrderTotals, formatCurrency } from "@/utils/billingUtils";  // ✅ FIXED import
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
    ? "https://Shreephal-Handicrafts.onrender.com/pay"
    : "http://localhost:3000/pay";

// Helper function to render customization details
const renderCustomizationDetails = (item, customizationDetails) => {
  if (!customizationDetails) return null;

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

  const customText = customizations.text ? customizations.text.trim() : "";
  const customSize = customizations.size ? customizations.size.trim() : "";
  const customColor = customizations.color ? customizations.color.trim() : "";
  const customUploadedImage = customizations.uploadedImage || null;
  const productTitle = customizationDetail.productTitle
    ? customizationDetail.productTitle.trim()
    : "";

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

// Status helpers
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    if (!orderId || !user) return;
    fetchOrder();
  }, [orderId, user]);

  const fetchOrder = async () => {
    try {
      setLoading(true);

      console.log("\n=== FETCHING ORDER DETAILS (BILLING FIX) ===");
      console.log("Order ID:", orderId);
      console.log("User ID:", user.id);

      // Query the comprehensive view with all order and item details
      const { data, error } = await supabase
        .from("order_details_full")
        .select("*")
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      console.log("Order details from view:", { data, error });

      if (error) throw error;

      if (data && data.length > 0) {
        const orderData = {
          id: data[0].order_id,
          user_id: data[0].user_id,
          status: data[0].order_status,
          payment_status: data[0].payment_status,
          payment_method: data[0].payment_method,
          order_total: data[0].order_total,
          amount: data[0].amount,
          total_price: data[0].total_price,
          subtotal: data[0].subtotal,
          total_gst: data[0].total_gst,
          gst_5_total: data[0].gst_5_total,
          gst_18_total: data[0].gst_18_total,
          shipping_cost: data[0].shipping_cost,
          created_at: data[0].order_date,
          updated_at: data[0].updated_at,
          shipping_info: data[0].shipping_info,
          delivery_info: data[0].delivery_info,
          order_notes: data[0].order_notes,
          customization_details: null,
          requires_customization: data[0].customization_data ? true : false,
          estimated_delivery_days: null,
          upi_reference: null,
          transaction_id: data[0].transaction_id,
          production_status: null,
        };

        // Map order items with all billing fields
        const orderItems = data.map((row) => {
          // ✅ FIX: Convert numeric gst_rate to boolean flags for billingUtils
          const gstRate = parseFloat(row.gst_rate) || 0;
          
          return {
            id: row.product_id,
            product_id: row.product_id,
            quantity: row.quantity,
            // All price fields for billing utilities to use
            item_total: row.item_total,
            total_price: row.total_price,
            unit_price: row.unit_price,
            unit_price_with_gst: row.unit_price_with_gst,
            base_price: row.base_price,
            gst_amount: row.gst_amount,
            gst_rate: gstRate,
            // ✅ NEW: Add GST flags for billingUtils compatibility
            gst_5pct: gstRate === 5,
            gst_18pct: gstRate === 18,
            price: row.base_price,  // For calculateItemPricing
            price_at_order: row.unit_price_with_gst, // Price WITH GST
            // Product details
            name: row.product_name,
            title: row.product_name,
            image: row.product_image,
            catalog_number: row.catalog_number,
            material_type: null,
            weight_grams: null,
            item_id: row.item_id,
            item_created_at: null,
            customization: row.customization_data,
            variant: {
              sizeDisplay: row.size_display,
              sizeNumeric: row.size_numeric,
              sizeUnit: row.size_unit,
            },
          };
        });

        setOrder(orderData);
        setItems(orderItems);

        console.log("✅ Order loaded (BILLING FIX):");
        console.log("  - Order Data:", orderData);
        console.log("  - Items:", orderItems.length);
        console.log("  - First item GST data:", {
          gst_rate: orderItems[0]?.gst_rate,
          gst_5pct: orderItems[0]?.gst_5pct,
          gst_18pct: orderItems[0]?.gst_18pct
        });
      } else {
        console.warn("⚠️ No order data found");
        setOrder(null);
        setItems([]);
      }
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
    toast({
      title: "Refreshed",
      description: "Order details have been updated.",
    });
    setRefreshing(false);
  };

  const handlePayNow = async () => {
    if (!order) return;

    setProcessingPayment(true);

    try {
      // ✅ Use billing utilities
      const totals = calculateOrderTotals(items, order.shipping_cost || 0);
      const totalAmount = Math.round(totals.grandTotal * 100); // Convert to paise

      const form = document.createElement("form");
      form.method = "POST";
      form.action = PHONEPE_PAY_URL;
      form.style.display = "none";

      const shipping = order.shipping_info ?? {};
      const fields = {
        orderId: order.id,
        amount: totalAmount,
        customerEmail: shipping.email || user.email,
        customerPhone: shipping.phone || "",
        customerName:
          `${shipping.firstName || ""} ${shipping.lastName || ""}`.trim() ||
          user.name,
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

  const shipping = order.shipping_info ?? {};
  const delivery = order.delivery_info ?? {};
  const orderCreated = order.created_at
    ? new Date(order.created_at).toLocaleString()
    : "—";

  // ✅ Calculate totals using billing utilities
  const totals = calculateOrderTotals(items, order.shipping_cost || 0);
  
  console.log("💰 Calculated totals:", totals);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 mb-6 sm:mb-8">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <Link to="/my-orders">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-primary/10"
                    >
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
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                    />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      Placed on {orderCreated}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Badge
                      className={`${getStatusColor(order.status)} text-xs sm:text-sm px-2 sm:px-3 py-1`}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">
                          {order.status || "Pending"}
                        </span>
                      </div>
                    </Badge>

                    {order.payment_status && (
                      <Badge
                        className={`${getPaymentStatusColor(order.payment_status)} text-xs sm:text-sm px-2 sm:px-3 py-1`}
                      >
                        Payment: {order.payment_status}
                      </Badge>
                    )}

                    {order.payment_method && (
                      <Badge
                        variant="outline"
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        {order.payment_method}
                      </Badge>
                    )}

                    {order.requires_customization && (
                      <Badge
                        variant="outline"
                        className="text-xs sm:text-sm px-2 sm:px-3 py-1 bg-orange-50 text-orange-700 border-orange-200"
                      >
                        <Wrench className="h-3 w-3 mr-1" />
                        Customized
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Pending Alert */}
            {order.payment_status === "pending" && (
              <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 mb-6 sm:mb-8">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-orange-900 text-base sm:text-lg">
                          Payment Pending
                        </h3>
                        <p className="text-sm sm:text-base text-orange-700 mt-1">
                          Complete your payment to confirm this order. Your items
                          are reserved but the order won't be processed until
                          payment is received.
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      onClick={handlePayNow}
                      disabled={processingPayment}
                      className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap"
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay {formatCurrency(totals.grandTotal)}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              {/* Left Column - Order Items */}
              <div className="xl:col-span-2 space-y-6 sm:space-y-8">
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Package className="h-5 w-5 text-primary" />
                      Order Items ({items.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {items.map((item, index) => {
                        // ✅ Use billing utilities for pricing
                        const pricing = calculateItemPricing(item);
                        
                        console.log(`📦 Item ${index + 1} pricing:`, {
                          name: item.name,
                          input: {
                            price: item.price,
                            gst_rate: item.gst_rate,
                            gst_5pct: item.gst_5pct,
                            gst_18pct: item.gst_18pct,
                            quantity: item.quantity
                          },
                          output: pricing
                        });

                        return (
                          <div key={item.item_id || index}>
                            <div className="flex gap-3 sm:gap-4">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <ProductFallbackIcon
                                className="h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0"
                                style={{
                                  display: item.image ? "none" : "flex",
                                }}
                              />

                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
                                  {item.name || item.title || "Product"}
                                </h4>

                                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2">
                                  {item.catalog_number && (
                                    <span>SKU: {item.catalog_number}</span>
                                  )}
                                  {item.variant?.sizeDisplay && (
                                    <>
                                      <span>•</span>
                                      <span>Size: {item.variant.sizeDisplay}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span>Qty: {pricing.quantity}</span>
                                  {pricing.gstRate > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-orange-600">GST @{pricing.gstRate}%</span>
                                    </>
                                  )}
                                </div>

                                <div className="flex items-baseline gap-2">
                                  <span className="text-base sm:text-lg font-bold text-gray-900">
                                    {formatCurrency(pricing.itemTotal)}
                                  </span>
                                  {pricing.quantity > 1 && (
                                    <span className="text-xs sm:text-sm text-gray-500">
                                      ({formatCurrency(pricing.unitPriceWithGST)} each)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Customization details */}
                            {item.customization &&
                              Object.keys(item.customization).length > 0 && (
                                <div className="mt-3">
                                  {renderCustomizationDetails(
                                    item,
                                    { [item.product_id]: { customizations: item.customization } }
                                  )}
                                </div>
                              )}

                            {index < items.length - 1 && (
                              <Separator className="mt-4 sm:mt-6" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Order Notes */}
                {order.order_notes && (
                  <Card className="border border-blue-200 bg-blue-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-blue-900">
                        <AlertCircle className="h-5 w-5" />
                        Order Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm sm:text-base text-blue-800">
                        {order.order_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Order Summary & Details */}
              <div className="space-y-6 sm:space-y-8">
                {/* Order Summary */}
                <Card className="border border-gray-200 sticky top-8">
                  <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                    <CardTitle className="text-lg sm:text-xl">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between text-sm sm:text-base">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-semibold">
                          {formatCurrency(totals.subtotal)}
                        </span>
                      </div>

                      {totals.totalGST > 0 && (
                        <div className="flex justify-between text-sm sm:text-base text-orange-600">
                          <span>GST</span>
                          <span className="font-semibold">
                            +{formatCurrency(totals.totalGST)}
                          </span>
                        </div>
                      )}

                      {totals.shippingCost > 0 && (
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600">Shipping</span>
                          <span className="font-semibold">
                            {formatCurrency(totals.shippingCost)}
                          </span>
                        </div>
                      )}

                      <Separator />

                      <div className="flex justify-between text-base sm:text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">
                          {formatCurrency(totals.grandTotal)}
                        </span>
                      </div>

                      {order.payment_status === "pending" && (
                        <Button
                          onClick={handlePayNow}
                          disabled={processingPayment}
                          className="w-full mt-4"
                          size="lg"
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </>
                          )}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setShowInvoice(true)}
                        disabled={order.payment_status === "pending"}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Information */}
                <Card className="border border-gray-200">
                  <CardHeader className="border-b border-gray-200 bg-gray-50/50">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Truck className="h-5 w-5 text-primary" />
                      Shipping Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4 text-sm sm:text-base">
                      {(shipping.firstName || shipping.lastName) && (
                        <div className="flex items-start gap-3">
                          <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">Name</p>
                            <p className="font-medium text-gray-900">
                              {shipping.firstName} {shipping.lastName}
                            </p>
                          </div>
                        </div>
                      )}

                      {shipping.phone && (
                        <div className="flex items-start gap-3">
                          <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">
                              {shipping.phone}
                            </p>
                          </div>
                        </div>
                      )}

                      {(shipping.address ||
                        shipping.city ||
                        shipping.state ||
                        shipping.zipCode) && (
                        <div className="flex items-start gap-3">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs sm:text-sm text-gray-500">Address</p>
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

                      {delivery.method && (
                        <div className="pt-3 sm:pt-4 border-t border-gray-200">
                          <p className="text-xs sm:text-sm text-gray-500 mb-1">
                            Delivery Method
                          </p>
                          <p className="font-medium text-gray-900 capitalize">
                            {delivery.method.replace("_", " ")}
                          </p>
                          {delivery.estimatedDays && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              Estimated: {delivery.estimatedDays} days
                            </p>
                          )}
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
      {showInvoice && (
        <InvoiceGenerator 
          order={{ ...order, items }} 
          onClose={() => setShowInvoice(false)} 
        />
      )}
    </Layout>
  );
}
