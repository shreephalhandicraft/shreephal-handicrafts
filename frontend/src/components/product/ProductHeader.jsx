import { Badge } from "@/components/ui/badge";
import { Tag, CheckCircle, AlertCircle, Flame } from "lucide-react";

const ProductHeader = ({
  product,
  selectedVariant,
  getCurrentPrice,
  getCurrentStock,
  getStockQuantity,
  formatPrice,
}) => {
  const stockQuantity = getStockQuantity();
  const isInStock = getCurrentStock();
  const isLowStock = isInStock && stockQuantity <= 5;
  const isVeryLowStock = isInStock && stockQuantity <= 2;

  return (
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
        
        {/* ✅ NEW: Low Stock Badge */}
        {isLowStock && (
          <Badge 
            className={`${
              isVeryLowStock
                ? "bg-red-100 text-red-800 border-red-300 animate-pulse"
                : "bg-orange-100 text-orange-800 border-orange-300"
            } font-semibold`}
          >
            {isVeryLowStock && <Flame className="h-3 w-3 mr-1" />}
            Low Stock
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
            ₹{formatPrice(getCurrentPrice())}
          </span>
          {selectedVariant && selectedVariant.price !== product.price && (
            <span className="text-lg text-gray-500 line-through">
              ₹{formatPrice(product.price)}
            </span>
          )}
        </div>

        {selectedVariant && (
          <p className="text-sm text-gray-600">
            Price for {selectedVariant.size_code || "selected variant"}
          </p>
        )}
      </div>

      {/* ✅ ENHANCED: Stock Status with Urgency Messaging */}
      <div className="space-y-2">
        <div className="flex items-center space-x-4 flex-wrap">
          <Badge
            variant={isInStock ? "default" : "destructive"}
            className={`${
              isInStock
                ? isLowStock
                  ? "bg-orange-100 text-orange-800 border-orange-200"
                  : "bg-green-100 text-green-800 border-green-200"
                : "bg-red-100 text-red-800 border-red-200"
            }`}
          >
            {isInStock ? (
              <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
            )}
            {isInStock ? "In Stock" : "Out of Stock"}
          </Badge>

          {product.min_order_qty && product.min_order_qty > 1 && (
            <span className="text-sm text-gray-600">
              Min. Order: {product.min_order_qty} units
            </span>
          )}
        </div>

        {/* ✅ NEW: Low Stock Warning Message */}
        {isLowStock && (
          <div
            className={`${
              isVeryLowStock
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-orange-50 border-orange-200 text-orange-800"
            } border rounded-lg p-3 flex items-center space-x-2`}
          >
            {isVeryLowStock && <Flame className="h-4 w-4 flex-shrink-0" />}
            <span className="text-sm font-medium">
              {isVeryLowStock ? (
                <>
                  ⚡ <strong>Only {stockQuantity} left!</strong> Order now before it's gone.
                </>
              ) : (
                <>
                  ⏰ Only <strong>{stockQuantity} left</strong> in stock. Order soon!
                </>
              )}
            </span>
          </div>
        )}

        {/* ✅ NEW: Healthy Stock Message */}
        {isInStock && !isLowStock && stockQuantity < 20 && (
          <p className="text-sm text-gray-600">
            ✅ {stockQuantity} units available
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductHeader;
