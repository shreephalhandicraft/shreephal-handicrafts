import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Heart,
  Share2,
  MessageCircle,
  Phone,
  Mail,
  Loader2,
  Zap,
  AlertCircle,
} from "lucide-react";

const ProductActions = ({
  product,
  getCurrentStock,
  isAddingToCart,
  isBuying,
  isFavourite,
  onAddToCart,
  onBuyNow,
  onToggleFavourite,
  onShare,
  selectedVariant, // Add this prop to get current variant info
  getStockQuantity, // Add this prop to get actual stock quantity
}) => {
  // Enhanced stock checking function
  const isStockAvailable = () => {
    // Check if getCurrentStock function returns true
    const hasStock = getCurrentStock && getCurrentStock();

    // Get actual stock quantity
    const stockQuantity = getStockQuantity ? getStockQuantity() : 0;

    // Check product level stock
    const productInStock = product?.in_stock;
    const productQuantity = product?.quantity || 0;

    // Check variant level stock if variant is selected
    if (selectedVariant) {
      const variantInStock = (selectedVariant.stock_quantity || 0) > 0;
      return hasStock && variantInStock && selectedVariant.stock_quantity > 0;
    }

    // Check product level stock
    return (
      hasStock && productInStock && (stockQuantity > 0 || productQuantity > 0)
    );
  };

  // Get stock quantity for display
  const getAvailableQuantity = () => {
    if (selectedVariant) {
      return selectedVariant.stock_quantity || 0;
    }
    return getStockQuantity ? getStockQuantity() : product?.quantity || 0;
  };

  // Check if buttons should be disabled
  const shouldDisableButtons = () => {
    return !isStockAvailable() || isAddingToCart || isBuying;
  };

  // Debug logging
  console.log("ProductActions stock check:", {
    product: product?.id,
    productInStock: product?.in_stock,
    productQuantity: product?.quantity,
    selectedVariant: selectedVariant?.id,
    variantStock: selectedVariant?.stock_quantity,
    getCurrentStock: getCurrentStock(),
    getStockQuantity: getStockQuantity ? getStockQuantity() : null,
    isStockAvailable: isStockAvailable(),
    shouldDisableButtons: shouldDisableButtons(),
  });

  const handleAddToCartClick = () => {
    console.log("Add to cart clicked", {
      product: product?.id,
      stock: getCurrentStock(),
      available: isStockAvailable(),
    });

    if (!isStockAvailable()) {
      console.warn("Cannot add to cart - out of stock");
      return;
    }

    if (onAddToCart && typeof onAddToCart === "function") {
      onAddToCart();
    } else {
      console.error("onAddToCart is not a function");
    }
  };

  const handleBuyNowClick = () => {
    console.log("Buy now clicked", {
      product: product?.id,
      stock: getCurrentStock(),
      available: isStockAvailable(),
    });

    if (!isStockAvailable()) {
      console.warn("Cannot buy now - out of stock");
      return;
    }

    if (onBuyNow && typeof onBuyNow === "function") {
      onBuyNow();
    } else {
      console.error("onBuyNow is not a function");
    }
  };

  const handleToggleFavouriteClick = () => {
    console.log("Toggle favourite clicked", {
      product: product?.id,
      currentlyFavourite: isFavourite ? isFavourite(product?.id) : false,
    });

    if (onToggleFavourite && typeof onToggleFavourite === "function") {
      onToggleFavourite();
    } else {
      console.error("onToggleFavourite is not a function");
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Stock Warning */}
      {!isStockAvailable() && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <div className="text-sm text-red-800">
            <span className="font-medium">Out of Stock:</span>
            <span className="ml-1">
              {getAvailableQuantity() === 0
                ? "This item is currently unavailable."
                : "Selected variant is out of stock."}
            </span>
          </div>
        </div>
      )}

      {/* Low Stock Warning */}
      {isStockAvailable() &&
        getAvailableQuantity() <= 5 &&
        getAvailableQuantity() > 0 && (
          <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <span className="font-medium">Low Stock:</span>
              <span className="ml-1">
                Only {getAvailableQuantity()}{" "}
                {getAvailableQuantity() === 1 ? "item" : "items"} left in stock.
              </span>
            </div>
          </div>
        )}

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button
          onClick={handleAddToCartClick}
          disabled={shouldDisableButtons()}
          className="h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </Button>

        <Button
          onClick={handleBuyNowClick}
          disabled={shouldDisableButtons()}
          className="h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isBuying ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isBuying ? "Processing..." : "Buy Now"}
        </Button>
      </div>

      {/* Secondary Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          onClick={handleToggleFavouriteClick}
          className={`h-12 ${
            isFavourite && isFavourite(product?.id)
              ? "border-red-300 text-red-600 bg-red-50 hover:bg-red-100"
              : "hover:border-red-300 hover:text-red-600 hover:bg-red-50"
          }`}
        >
          <Heart
            className={`h-4 w-4 mr-2 ${
              isFavourite && isFavourite(product?.id) ? "fill-current" : ""
            }`}
          />
          {isFavourite && isFavourite(product?.id) ? "Saved" : "Save"}
        </Button>

        <Button
          variant="outline"
          onClick={onShare}
          className="h-12 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>

        <Button
          variant="outline"
          className="h-12 hover:border-green-300 hover:text-green-600 hover:bg-green-50"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Ask
        </Button>
      </div>

      {/* Stock Information Display */}
      {isStockAvailable() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800 font-medium">✓ In Stock</span>
            <span className="text-green-600">
              {getAvailableQuantity()} available
            </span>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3 text-sm">Need Help?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a
            href="tel:+919876543210"
            className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Phone className="h-4 w-4" />
            <span className="text-sm">Call Us</span>
          </a>
          <a
            href="mailto:support@example.com"
            className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span className="text-sm">Email Us</span>
          </a>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          Get personalized assistance for bulk orders, customization, or any
          questions.
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="flex items-center justify-center space-x-4 pt-2">
        <Badge
          variant="outline"
          className="text-xs border-green-200 text-green-700 bg-green-50"
        >
          ✓ Authentic Products
        </Badge>
        <Badge
          variant="outline"
          className="text-xs border-blue-200 text-blue-700 bg-blue-50"
        >
          ✓ Secure Payment
        </Badge>
        {product?.cod_allowed && (
          <Badge
            variant="outline"
            className="text-xs border-purple-200 text-purple-700 bg-purple-50"
          >
            ✓ COD Available
          </Badge>
        )}
      </div>
    </div>
  );
};

export default ProductActions;
