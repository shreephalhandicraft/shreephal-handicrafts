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

  // ✅ ISSUE #5: Use order_details_full view for comprehensive order + items data
  const fetchOrder = async () => {
    try {
      setLoading(true);

      console.log("\n=== FETCHING ORDER DETAILS (NEW VIEW) ===");
      console.log("Order ID:", orderId);
      console.log("User ID:", user.id);

      // ✅ Query the comprehensive view with all order and item details
      const { data, error } = await supabase
        .from("order_details_full")
        .select("*")
        .eq("order_id", orderId)
        .eq("user_id", user.id);

      console.log("Order details from view:", { data, error });

      if (error) throw error;

      if (data && data.length > 0) {
        // ✅ First row contains order info (all rows have same order info)
        const orderData = {
          id: data[0].order_id,
          user_id: data[0].user_id,
          status: data[0].status,
          payment_status: data[0].payment_status,
          payment_method: data[0].payment_method,
          amount: data[0].total_price,
          shipping_cost: data[0].shipping_cost,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
          shipping_info: data[0].shipping_info,
          delivery_info: data[0].delivery_info,
          order_notes: data[0].order_notes,
          customization_details: data[0].customization_details,
          requires_customization: data[0].requires_customization,
          estimated_delivery_days: data[0].estimated_delivery_days,
          upi_reference: data[0].upi_reference,
          transaction_id: data[0].transaction_id,
          production_status: data[0].production_status,
        };

        // ✅ Extract items from view rows (each row is an order item)
        const orderItems = data.map((row) => ({
          id: row.product_id,
          product_id: row.product_id,
          quantity: row.quantity,
          price: row.unit_price * row.quantity, // Total price for this item
          unit_price: row.unit_price,
          // Product details from view
          name: row.product_name,
          title: row.product_name,
          image: row.product_image,
          catalog_number: row.catalog_number,
          material_type: row.material_type,
          weight_grams: row.weight_grams,
          // Store item metadata
          item_id: row.item_id,
          item_created_at: row.item_created_at,
        }));

        setOrder(orderData);
        setItems(orderItems);

        console.log("✅ Order loaded:", orderData);
        console.log("✅ Items loaded:", orderItems.length, "items");
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
      const totalAmount = Math.round(Number(order.amount) * 100);

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

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8 lg:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header - truncated for space, full version in actual file */}
            <Card className="border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-primary/10 mb-6 sm:mb-8">
              <CardContent className="p-4 sm:p-6">
                {/* Navigation and header content... */}
              </CardContent>
            </Card>

            {/* Payment Banner... */}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
              {/* Order Items and full order UI - see full file... */}
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
