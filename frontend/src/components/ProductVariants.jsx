// components/ProductVariants.jsx
import { Badge } from "@/components/ui/badge";
import { Box, Ruler, Weight } from "lucide-react";

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

const ProductVariants = ({ variants, selectedVariant, onVariantSelect }) => {
  if (!variants || variants.length === 0) return null;

  const formatPrice = (priceInPaise) =>
    ((priceInPaise || 0) / 100).toLocaleString("en-IN");

  return (
    <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
      <div className="flex items-center space-x-2">
        <Box className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold text-blue-900 text-lg">
          Available Sizes & Variants
        </h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {variants.map((variant) => {
          const formattedDimensions = formatDimensions(variant.dimensions);
          const isSelected = selectedVariant?.id === variant.id;
          const inStock = (variant.stock_quantity || 0) > 0;

          return (
            <div
              key={variant.id}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-blue-600 bg-blue-600/10 shadow-lg ring-2 ring-blue-200"
                  : inStock
                  ? "border-gray-200 hover:border-blue-400 hover:shadow-md bg-white"
                  : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
              }`}
              onClick={() => inStock && onVariantSelect(variant)}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  {/* Size Label */}
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-semibold ${
                        isSelected ? "text-blue-900" : "text-gray-900"
                      }`}
                    >
                      {variant.size_label ||
                        variant.size_code ||
                        "Standard Size"}
                    </span>
                    {variant.size_code &&
                      variant.size_label !== variant.size_code && (
                        <Badge variant="outline" className="text-xs">
                          {variant.size_code}
                        </Badge>
                      )}
                    {isSelected && (
                      <Badge className="bg-blue-600 text-white text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>

                  {/* Specifications */}
                  <div className="space-y-1">
                    {formattedDimensions && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Ruler className="h-3 w-3 mr-1.5" />
                        <span>{formattedDimensions}</span>
                      </div>
                    )}

                    {variant.weight_grams && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Weight className="h-3 w-3 mr-1.5" />
                        <span>{variant.weight_grams}g</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Stock */}
                <div className="text-right ml-4">
                  <div
                    className={`text-lg font-bold ${
                      isSelected ? "text-blue-600" : "text-gray-900"
                    }`}
                  >
                    ₹{formatPrice(variant.price)}
                  </div>
                  <div className="flex items-center justify-end text-sm mt-1">
                    <div
                      className={`w-2 h-2 rounded-full mr-1.5 ${
                        inStock ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        inStock ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {inStock
                        ? `${variant.stock_quantity} in stock`
                        : "Out of stock"}
                    </span>
                  </div>
                </div>
              </div>

              {!inStock && (
                <div className="mt-2 text-xs text-gray-500 italic">
                  This variant is currently unavailable
                </div>
              )}
            </div>
          );
        })}
      </div>

      {variants.length > 2 && (
        <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded-lg">
          💡 <strong>Tip:</strong> Different sizes may have different prices and
          availability. Select your preferred size to see the exact price and
          stock status.
        </div>
      )}
    </div>
  );
};

export default ProductVariants;
