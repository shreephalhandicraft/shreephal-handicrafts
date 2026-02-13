import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  AlertTriangle,
  Shield,
  Truck,
  RotateCcw,
  Package
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { SEOHead } from "@/components/SEO/SEOHead";
import { PAGE_SEO } from "@/config/seoConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 🐛 FIX: Clean size display helper (same as ProductDetail & OrderDetail)
const getCleanSize = (item) => {
  const sizeDisplay = item.variant?.sizeDisplay || item.variant?.size;
  
  if (typeof sizeDisplay === 'string') {
    try {
      const parsed = JSON.parse(sizeDisplay);
      return parsed.sizeDisplay || parsed.size_display || sizeDisplay;
    } catch {
      return sizeDisplay;
    }
  }
  
  if (typeof sizeDisplay === 'object' && sizeDisplay !== null) {
    return sizeDisplay.sizeDisplay || sizeDisplay.size_display || sizeDisplay.size || 'N/A';
  }
  
  return 'N/A';
};

// 💰 Price formatting helper
const formatPrice = (price) => {
  return (price || 0).toLocaleString("en-IN", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// 🖼️ Product Image Component with proper fallback
const ProductImage = ({ item }) => {
  const [hasError, setHasError] = useState(false);
  
  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };
  
  // If image failed to load, show placeholder
  if (hasError || !item.image) {
    return (
      <div className="w-32 h-32 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-1" />
          <span className="text-xs text-gray-500 font-medium">
            {item.name?.charAt(0) || 'P'}
          </span>
        </div>
      </div>
    );
  }
  
  return (
    <img 
      src={item.image} 
      alt={item.name} 
      className="w-32 h-32 object-cover rounded-xl hover:scale-105 transition-transform cursor-pointer" 
      onError={handleImageError}
      loading="lazy"
    />
  );
};

const Cart = () => {
  const { 
    items, 
    removeFromCart,
    updateQuantity, 
    getTotalPrice,
    clearCart,
    loading 
  } = useCart();

  const handleQuantityChange = (item, delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item, newQuantity);
    }
  };

  // ✅ Check for invalid items (missing variantId)
  const invalidItems = items.filter(item => !item.variantId);
  const hasInvalidItems = invalidItems.length > 0;
  
  // Calculate total units
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Layout>
      <SEOHead
        title={PAGE_SEO.cart.title}
        description={PAGE_SEO.cart.description}
        keywords={PAGE_SEO.cart.keywords}
        path={PAGE_SEO.cart.path}
        noindex={true}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
        <div className="container mx-auto px-4">
          {/* Header with Clear Cart */}
          {items.length > 0 ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Shopping Cart 
                <span className="text-primary ml-2">({totalUnits} {totalUnits === 1 ? 'item' : 'items'})</span>
              </h1>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (confirm('Are you sure you want to clear all items from your cart?')) {
                    clearCart();
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>
          ) : (
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Shopping Cart</h1>
          )}

          {/* Global warning if invalid items exist */}
          {hasInvalidItems && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cart Validation Error:</strong> {invalidItems.length} item(s) in your cart are missing size selection and cannot be checked out. 
                Please remove these items to proceed with your order.
              </AlertDescription>
            </Alert>
          )}

          {/* Empty Cart State */}
          {items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Looks like you haven't added anything to your cart yet. 
                Start shopping to find amazing handicrafts!
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/shop">
                  <Button size="lg" className="px-8">
                    Browse Products
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button size="lg" variant="outline" className="px-8">
                    View Categories
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                  const isInvalid = !item.variantId;
                  
                  return (
                    <div 
                      key={`${item.productId}-${item.variantId || 'no-variant'}`} 
                      className={`bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border ${
                        isInvalid ? 'border-2 border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex gap-6">
                        {/* Product Image - Clickable with Fallback */}
                        <Link 
                          to={`/category/${item.categorySlug || 'products'}/products/${item.productId}`}
                          className="flex-shrink-0"
                        >
                          <ProductImage item={item} />
                        </Link>
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            {/* Product Name - Clickable */}
                            <Link 
                              to={`/category/${item.categorySlug || 'products'}/products/${item.productId}`}
                              className="flex-1"
                            >
                              <h3 className="text-lg font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2">
                                {item.name}
                              </h3>
                            </Link>
                            
                            {/* Invalid Badge */}
                            {isInvalid && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full ml-2">
                                <AlertTriangle className="h-3 w-3" />
                                Invalid
                              </span>
                            )}
                          </div>
                          
                          {/* Size Badge */}
                          {!isInvalid && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="inline-flex px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                Size: {getCleanSize(item)}
                              </span>
                            </div>
                          )}
                          
                          {/* Invalid Item Helper */}
                          {isInvalid && (
                            <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg text-sm text-red-800">
                              <p className="font-medium">⚠️ This item is missing size selection</p>
                              <p className="text-xs mt-1">
                                This item cannot be checked out. Please remove it and re-add from the product page with a size selection.
                              </p>
                            </div>
                          )}
                          
                          {/* Price Display */}
                          {!isInvalid && (
                            <div className="mt-3 space-y-1">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">
                                  ₹{formatPrice(item.price)}
                                </span>
                                <span className="text-sm text-gray-500">per unit</span>
                              </div>
                              
                              {/* Item Subtotal */}
                              {item.quantity > 1 && (
                                <div className="text-sm text-gray-600">
                                  ₹{formatPrice(item.price)} × {item.quantity} = 
                                  <span className="font-semibold text-gray-900 ml-1">
                                    ₹{formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Quantity Controls - Larger */}
                          {!isInvalid && (
                            <div className="flex items-center gap-3 mt-4">
                              <Button 
                                size="lg" 
                                variant="outline" 
                                className="h-10 w-10 p-0 hover:bg-primary/10 hover:border-primary"
                                onClick={() => handleQuantityChange(item, -1)}
                                disabled={loading}
                              >
                                <Minus className="h-5 w-5" />
                              </Button>
                              <span className="text-lg font-semibold w-16 text-center">
                                {item.quantity}
                              </span>
                              <Button 
                                size="lg" 
                                variant="outline" 
                                className="h-10 w-10 p-0 hover:bg-primary/10 hover:border-primary"
                                onClick={() => handleQuantityChange(item, 1)}
                                disabled={loading}
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Remove Button */}
                        <Button 
                          variant="ghost" 
                          size="lg"
                          onClick={() => removeFromCart(item)}
                          disabled={loading}
                          className={`flex-shrink-0 ${isInvalid ? 'text-red-600 hover:text-red-700 hover:bg-red-100' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                        >
                          <Trash2 className="h-6 w-6" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl shadow-lg border-2 border-gray-200 sticky top-8">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Order Summary</h2>
                  
                  {/* Invalid Items Warning */}
                  {hasInvalidItems && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-800">
                        {invalidItems.length} invalid item{invalidItems.length > 1 ? 's' : ''} in cart
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Remove invalid items to checkout
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4 mb-6">
                    {/* Items Count */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Items ({items.length})</span>
                      <span className="font-medium text-gray-900">{totalUnits} units</span>
                    </div>
                    
                    {/* Subtotal */}
                    <div className="flex justify-between">
                      <span className="text-gray-700">Subtotal</span>
                      <span className="font-semibold text-gray-900">
                        ₹{formatPrice(getTotalPrice())}
                      </span>
                    </div>
                    
                    {/* GST Info */}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">GST (Included)</span>
                      <span className="text-gray-600">
                        ₹{formatPrice(getTotalPrice() * 0.15)}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    {/* Shipping */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-green-600 font-medium">FREE</span>
                    </div>
                    
                    <Separator className="border-gray-300" />
                    
                    {/* Total */}
                    <div className="flex justify-between items-baseline pt-2">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary">
                          ₹{formatPrice(getTotalPrice())}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          (Incl. all taxes)
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Checkout Button */}
                  {hasInvalidItems ? (
                    <Button 
                      className="w-full h-14 text-lg" 
                      disabled={true}
                      variant="destructive"
                    >
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Fix Cart to Checkout
                    </Button>
                  ) : (
                    <Link to="/checkout">
                      <Button 
                        className="w-full h-14 text-lg bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 shadow-lg"
                        disabled={loading}
                      >
                        Proceed to Checkout
                      </Button>
                    </Link>
                  )}
                  
                  {/* Continue Shopping */}
                  <Link to="/shop">
                    <Button 
                      variant="outline" 
                      className="w-full mt-3 h-12"
                    >
                      Continue Shopping
                    </Button>
                  </Link>
                  
                  {/* Helper for Invalid */}
                  {hasInvalidItems && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Remove invalid items to enable checkout
                    </p>
                  )}
                  
                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span>Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span>Free Shipping</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <RotateCcw className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span>7-Day Returns</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Cart;