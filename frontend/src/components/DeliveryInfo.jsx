// components/DeliveryInfo.jsx
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Clock,
  MapPin,
  Package,
  Shield,
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const DeliveryInfo = ({ product, estimatedDays = 7 }) => {
  const deliveryOptions = [
    {
      icon: <Truck className="h-4 w-4" />,
      title: "Standard Delivery",
      description: `${estimatedDays}-${estimatedDays + 3} business days`,
      price: "Free",
      highlight: true,
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Express Delivery",
      description: `${Math.max(
        1,
        estimatedDays - 3
      )}-${estimatedDays} business days`,
      price: "₹99",
      highlight: false,
    },
  ];

  const paymentMethods = [];

  if (product.cod_allowed) {
    paymentMethods.push({
      icon: <Package className="h-3 w-3" />,
      name: "Cash on Delivery",
      description: "Pay when you receive",
    });
  }

  paymentMethods.push(
    {
      icon: <CreditCard className="h-3 w-3" />,
      name: "Online Payment",
      description: "UPI, Cards, Net Banking",
    },
    {
      icon: <Shield className="h-3 w-3" />,
      name: "Secure Checkout",
      description: "256-bit SSL encryption",
    }
  );

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
      <div className="flex items-center space-x-2">
        <Truck className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-900 text-lg">
          Delivery & Payment
        </h3>
      </div>

      {/* Delivery Options */}
      <div className="space-y-3">
        <h4 className="font-medium text-green-900 text-sm flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          Delivery Options
        </h4>

        <div className="space-y-2">
          {deliveryOptions.map((option, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                option.highlight
                  ? "bg-green-100 border-green-300 shadow-sm"
                  : "bg-white border-green-200 hover:border-green-300"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-1.5 rounded-lg ${
                    option.highlight ? "bg-green-200" : "bg-gray-100"
                  }`}
                >
                  <div
                    className={
                      option.highlight ? "text-green-700" : "text-gray-600"
                    }
                  >
                    {option.icon}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    {option.title}
                  </div>
                  <div className="text-xs text-gray-600">
                    {option.description}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`font-medium text-sm ${
                    option.price === "Free" ? "text-green-600" : "text-gray-900"
                  }`}
                >
                  {option.price}
                </div>
                {option.highlight && (
                  <Badge
                    variant="outline"
                    className="text-xs mt-1 border-green-400 text-green-700"
                  >
                    Recommended
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900 text-sm">
              Coverage Area
            </span>
          </div>
          <p className="text-gray-700 text-sm">Pan India delivery available</p>
          <p className="text-xs text-gray-600 mt-1">
            Some remote areas may take longer
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-900 text-sm">
              Processing Time
            </span>
          </div>
          <p className="text-gray-700 text-sm">
            {product.is_customizable
              ? "2-3 business days"
              : "1-2 business days"}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {product.is_customizable
              ? "For customized products"
              : "Standard processing"}
          </p>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <h4 className="font-medium text-green-900 text-sm flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Methods
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {paymentMethods.map((method, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-green-200"
            >
              <div className="text-green-600">{method.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-xs text-gray-900">
                  {method.name}
                </div>
                <div className="text-xs text-gray-600 truncate">
                  {method.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Special Notes */}
      <div className="space-y-2">
        {product.is_customizable && (
          <div className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-yellow-800">
                Customization Note:
              </span>
              <span className="text-yellow-700 ml-1">
                Custom orders may take additional 1-2 days for processing and
                cannot be cancelled once production begins.
              </span>
            </div>
          </div>
        )}

        {product.bulk_order_allowed && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-800">Bulk Orders:</span>
              <span className="text-blue-700 ml-1">
                Special pricing and faster delivery available for bulk orders.
                Contact us for quotes.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Guarantee */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="h-5 w-5" />
          <span className="font-semibold">Delivery Guarantee</span>
        </div>
        <p className="text-sm opacity-90">
          We guarantee safe delivery of your order. In case of damage during
          transit, we'll replace it at no extra cost.
        </p>
      </div>
    </div>
  );
};

export default DeliveryInfo;
