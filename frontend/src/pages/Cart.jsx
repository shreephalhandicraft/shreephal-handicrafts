import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEO/SEOHead";
import { PAGE_SEO } from "@/config/seoConfig";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Cart = () => {
  const { 
    items, 
    removeFromCart,
    updateQuantity, 
    getTotalPrice,
    loading 
  } = useCart();

  const handleQuantityChange = (item, delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item, newQuantity);
    }
  };

  // ✨ UX #4 FIX: Check for invalid items (missing variantId)
  const invalidItems = items.filter(item => !item.variantId);
  const hasInvalidItems = invalidItems.length > 0;

  return (
    <Layout>
      <SEOHead
        title={PAGE_SEO.cart.title}
        description={PAGE_SEO.cart.description}
        keywords={PAGE_SEO.cart.keywords}
        path={PAGE_SEO.cart.path}
        noindex={true}
      />

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-gray-900">Shopping Cart</h1>

          {/* ✨ UX #4 FIX: Global warning if invalid items exist */}
          {hasInvalidItems && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Cart Validation Error:</strong> {invalidItems.length} item(s) in your cart are missing size selection and cannot be checked out. 
                Please remove these items to proceed with your order.
              </AlertDescription>
            </Alert>
          )}

          {items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start shopping to add items to your cart</p>
              <Link to="/shop"><Button>Browse Products</Button></Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                  // ✨ UX #4 FIX: Check if this item is invalid
                  const isInvalid = !item.variantId;
                  
                  return (
                    <div 
                      key={`${item.productId}-${item.variantId || 'no-variant'}`} 
                      className={`bg-white p-6 rounded-lg shadow-sm flex gap-4 ${
                        isInvalid ? 'border-2 border-red-300 bg-red-50' : ''
                      }`}
                    >
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-24 h-24 object-cover rounded" 
                        onError={(e) => {
                          e.target.src = '/placeholder-product.jpg';
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          
                          {/* ✨ UX #4 FIX: Warning badge for invalid items */}
                          {isInvalid && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                              <AlertTriangle className="h-3 w-3" />
                              Invalid
                            </span>
                          )}
                        </div>
                        
                        {/* Show size if valid */}
                        {!isInvalid && item.variant?.sizeDisplay && (
                          <p className="text-sm text-gray-500 mt-1">Size: {item.variant.sizeDisplay}</p>
                        )}
                        
                        {/* ✨ UX #4 FIX: Helper text for invalid items */}
                        {isInvalid && (
                          <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-800">
                            <p className="font-medium">⚠️ This item is missing size selection</p>
                            <p className="text-xs mt-1">
                              This item cannot be checked out. Please remove it and re-add from the product page with a size selection.
                            </p>
                          </div>
                        )}
                        
                        <p className="text-primary font-semibold mt-1">
                          ₹{(item.priceWithGst || item.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        
                        {/* Only show quantity controls for valid items */}
                        {!isInvalid && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleQuantityChange(item, -1)}
                              disabled={loading}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center">{item.quantity}</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleQuantityChange(item, 1)}
                              disabled={loading}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFromCart(item)}
                        disabled={loading}
                        className={isInvalid ? 'text-red-600 hover:text-red-700 hover:bg-red-100' : ''}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Order Summary</h2>
                  
                  {/* ✨ UX #4 FIX: Show invalid items count */}
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
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold">
                        ₹{getTotalPrice().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-sm text-gray-500">Calculated at checkout</span>
                    </div>
                    <div className="border-t pt-3 flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        ₹{getTotalPrice().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  
                  {/* ✨ UX #4 FIX: Disable checkout if invalid items exist */}
                  {hasInvalidItems ? (
                    <Button 
                      className="w-full" 
                      size="lg" 
                      disabled={true}
                      variant="destructive"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Fix Cart to Checkout
                    </Button>
                  ) : (
                    <Link to="/checkout">
                      <Button className="w-full" size="lg" disabled={loading}>
                        Proceed to Checkout
                      </Button>
                    </Link>
                  )}
                  
                  {/* ✨ UX #4 FIX: Helper text for disabled checkout */}
                  {hasInvalidItems && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                      Remove invalid items to enable checkout
                    </p>
                  )}
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