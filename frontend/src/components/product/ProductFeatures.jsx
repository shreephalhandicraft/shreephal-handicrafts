import { Badge } from "@/components/ui/badge";
import {
  Star,
  Palette,
  Sparkles,
  Package2,
  Shield,
  Award,
  Zap,
  Settings,
  CheckCircle,
} from "lucide-react";

const ProductFeatures = ({ product }) => {
  const features = [];

  // Add features based on product properties
  if (product.is_customizable) {
    features.push({
      icon: <Palette className="h-4 w-4" />,
      title: "Fully Customizable",
      description: "Personalize with your text, colors, and designs",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    });
  }

  if (product.foil_available) {
    features.push({
      icon: <Sparkles className="h-4 w-4" />,
      title: "Foil Options Available",
      description: "Premium foil finishing for elegant look",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    });
  }

  if (product.bulk_order_allowed) {
    features.push({
      icon: <Package2 className="h-4 w-4" />,
      title: "Bulk Orders Welcome",
      description: "Special pricing for large quantities",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    });
  }

  if (product.cod_allowed) {
    features.push({
      icon: <Shield className="h-4 w-4" />,
      title: "Cash on Delivery",
      description: "Pay when you receive your order",
      color: "text-green-600",
      bgColor: "bg-green-100",
    });
  }

  if (product.featured) {
    features.push({
      icon: <Award className="h-4 w-4" />,
      title: "Featured Product",
      description: "One of our most popular items",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    });
  }

  // Always add these standard features
  features.push(
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Quality Guaranteed",
      description: "Premium materials and craftsmanship",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Fast Processing",
      description: "Quick turnaround on all orders",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    }
  );

  if (features.length === 0) return null;

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
      <div className="flex items-center space-x-2">
        <Star className="h-5 w-5 text-gray-700" />
        <h3 className="font-semibold text-gray-900 text-lg">
          Product Features
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className={`${feature.bgColor} p-2 rounded-lg flex-shrink-0`}>
              <div className={feature.color}>{feature.icon}</div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">
                {feature.title}
              </h4>
              <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Additional Product Specs */}
      {(product.material_type || product.base_type || product.thickness) && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 text-sm mb-3 flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Technical Specifications
          </h4>
          <div className="flex flex-wrap gap-2">
            {product.material_type && (
              <Badge variant="secondary" className="text-xs">
                Material: {product.material_type}
              </Badge>
            )}
            {product.base_type && (
              <Badge variant="secondary" className="text-xs">
                Base: {product.base_type}
              </Badge>
            )}
            {product.thickness && (
              <Badge variant="secondary" className="text-xs">
                Thickness: {product.thickness}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Order Limits */}
      {(product.min_order_qty > 1 || product.max_order_qty) && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-sm text-blue-800">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="font-medium">Order Information:</span>
          </div>
          <div className="text-xs text-blue-700 mt-1 space-y-1">
            {product.min_order_qty > 1 && (
              <div>• Minimum order quantity: {product.min_order_qty} units</div>
            )}
            {product.max_order_qty && (
              <div>• Maximum order quantity: {product.max_order_qty} units</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFeatures;
