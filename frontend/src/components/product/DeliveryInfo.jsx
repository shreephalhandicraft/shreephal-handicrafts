import {
  Truck,
  Clock,
  Calendar,
  MapPin,
  CreditCard,
  Package,
  Info,
} from "lucide-react";

const DeliveryInfo = ({ product, estimatedDays = 7 }) => {
  const paymentMethods = [];

  if (product.cod_allowed) {
    paymentMethods.push({
      icon: <Package className="h-3 w-3" />,
      name: "Cash on Delivery",
      description: "Pay when you receive",
    });
  }

  paymentMethods.push({
    icon: <CreditCard className="h-3 w-3" />,
    name: "Online Payment",
    description: "UPI, Cards, Net Banking",
  });

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
      <div className="flex items-center space-x-2">
        <Truck className="h-5 w-5 text-green-600" />
        <h3 className="font-semibold text-green-900 text-lg">
          Delivery Information
        </h3>
      </div>

      {/* Delivery Time */}
      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 text-sm">
            Delivery Time
          </span>
        </div>
        <p className="text-gray-700 text-sm">
          {estimatedDays}-{estimatedDays + 3} business days
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Delivery time may vary based on location
        </p>
      </div>

      {/* Processing Time */}
      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 text-sm">
            Processing Time
          </span>
        </div>
        <p className="text-gray-700 text-sm">
          {product.is_customizable ? "2-3 business days" : "1-2 business days"}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          {product.is_customizable
            ? "For customized products"
            : "Standard processing"}
        </p>
      </div>

      {/* Coverage Area */}
      <div className="bg-white p-4 rounded-xl border border-green-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 text-sm">
            Service Area
          </span>
        </div>
        <p className="text-gray-700 text-sm">India-wide delivery available</p>
        <p className="text-xs text-gray-600 mt-1">
          Remote areas may take additional time
        </p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <h4 className="font-medium text-green-900 text-sm flex items-center">
          <CreditCard className="h-4 w-4 mr-2" />
          Payment Options
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {paymentMethods.map((method, index) => (
            <div
              key={index}
              className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-green-200"
            >
              <div className="text-green-600">{method.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900">
                  {method.name}
                </div>
                <div className="text-xs text-gray-600">
                  {method.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="space-y-2">
        {product.is_customizable && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-800">Custom Orders:</span>
              <span className="text-blue-700 ml-1">
                Customized products take additional processing time and cannot
                be cancelled once production starts.
              </span>
            </div>
          </div>
        )}

        {product.bulk_order_allowed && (
          <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-blue-800">Bulk Orders:</span>
              <span className="text-blue-700 ml-1">
                Contact us for bulk pricing and delivery information.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryInfo;
