import { Badge } from "@/components/ui/badge";
import { Tag, CheckCircle, AlertCircle } from "lucide-react";

const ProductHeader = ({
  product,
  selectedVariant,
  getCurrentPrice,
  getCurrentStock,
  getStockQuantity,
  formatPrice,
}) => {
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

      {/* Stock Status */}
      <div className="flex items-center space-x-4">
        <Badge
          variant={getCurrentStock() ? "default" : "destructive"}
          className={`${
            getCurrentStock()
              ? "bg-green-100 text-green-800 border-green-200"
              : "bg-red-100 text-red-800 border-red-200"
          }`}
        >
          {getCurrentStock() ? (
            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
          ) : (
            <AlertCircle className="h-3 w-3 mr-1 text-red-600" />
          )}
          {getCurrentStock()
            ? `In Stock (${getStockQuantity()})`
            : "Out of Stock"}
        </Badge>

        {product.min_order_qty && product.min_order_qty > 1 && (
          <span className="text-sm text-gray-600">
            Min. Order: {product.min_order_qty} units
          </span>
        )}
      </div>
    </div>
  );
};

export default ProductHeader;
