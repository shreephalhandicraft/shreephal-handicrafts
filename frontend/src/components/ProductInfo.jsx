// components/ProductInfo.jsx
import { Badge } from "@/components/ui/badge";
import {
  Tag,
  CheckCircle,
  XCircle,
  Weight,
  Ruler,
  Palette,
  Shield,
} from "lucide-react";

const formatPrice = (priceInPaise) =>
  ((priceInPaise || 0) / 100).toLocaleString("en-IN");

const formatDimensions = (dimensions) => {
  if (!dimensions) return null;

  if (typeof dimensions === "string") return dimensions;

  if (typeof dimensions === "object") {
    const { length, width, height, unit = "cm" } = dimensions;
    if (length && width && height) {
      return `${length}×${width}×${height} ${unit}`;
    } else if (length && width) {
      return `${length}×${width} ${unit}`;
    }
  }

  return null;
};

const ProductInfo = ({
  product,
  selectedVariant,
  currentPrice,
  currentStock,
  stockQuantity,
}) => {
  const formattedDimensions = formatDimensions(
    selectedVariant?.dimensions || product.dimensions
  );

  const currentWeight = selectedVariant?.weight_grams || product.weight_grams;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center flex-wrap gap-2">
          <Badge
            variant="outline"
            className="text-primary border-primary/30 bg-primary/5"
          >
            <Tag className="h-3 w-3 mr-1" />
            {product.categories?.name || "Uncategorized"}
          </Badge>
          {product.catalog_number && (
            <Badge variant="secondary" className="text-xs">
              #{product.catalog_number}
            </Badge>
          )}
          {product.featured && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
              Featured
            </Badge>
          )}
        </div>

        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          {product.title}
        </h1>

        {/* Price Section */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-primary">
              ₹{formatPrice(currentPrice)}
            </span>
            {selectedVariant && selectedVariant.price !== product.price && (
              <span className="text-lg text-gray-500 line-through">
                ₹{formatPrice(product.price)}
              </span>
            )}
          </div>

          {selectedVariant && (
            <p className="text-sm text-gray-600">
              Price for {selectedVariant.size_label || "selected variant"}
            </p>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center space-x-4">
          <Badge
            variant={currentStock ? "default" : "destructive"}
            className={`${
              currentStock
                ? "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }`}
          >
            {currentStock ? (
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <XCircle className="h-3 w-3 mr-1 text-red-600" />
            )}
            {currentStock ? `In Stock (${stockQuantity})` : "Out of Stock"}
          </Badge>

          {product.min_order_qty && product.min_order_qty > 1 && (
            <span className="text-sm text-gray-600">
              Min. Order: {product.min_order_qty} units
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="prose prose-gray max-w-none bg-gray-50 p-6 rounded-2xl border border-gray-200">
          <p className="text-gray-700 leading-relaxed text-lg m-0">
            {product.description}
          </p>
        </div>
      )}

      {/* Product Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {product.material_type && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Palette className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Material</span>
            </div>
            <p className="text-gray-700">{product.material_type}</p>
          </div>
        )}

        {currentWeight && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Weight className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Weight</span>
            </div>
            <p className="text-gray-700">{currentWeight}g</p>
          </div>
        )}

        {formattedDimensions && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Ruler className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Dimensions</span>
            </div>
            <p className="text-gray-700">{formattedDimensions}</p>
          </div>
        )}

        {product.thickness && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Ruler className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Thickness</span>
            </div>
            <p className="text-gray-700">{product.thickness}</p>
          </div>
        )}

        {product.base_type && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Base Type</span>
            </div>
            <p className="text-gray-700">{product.base_type}</p>
          </div>
        )}

        {product.foil_available && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-gray-600" />
              <span className="font-medium text-gray-900">Foil Option</span>
            </div>
            <p className="text-gray-700">Available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductInfo;
