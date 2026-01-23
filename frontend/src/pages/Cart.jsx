import { Layout } from "@/components/Layout";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/SEO/SEOHead";
import { PAGE_SEO } from "@/config/seoConfig";

const Cart = () => {
  // ✅ FIX: Use correct CartContext API
  const { 
    items, 
    removeFromCart,      // ✅ Correct function name
    updateQuantity, 
    getTotalPrice,       // ✅ Correct function name (not getCartTotal)
    loading 
  } = useCart();

  // ✅ FIX: Handle quantity changes with absolute values
  const handleQuantityChange = (item, delta) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item, newQuantity);
    }
  };

  return (
    <Layout>
      {/* SEO with noindex - don't want cart pages in Google */}
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
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="bg-white p-6 rounded-lg shadow-sm flex gap-4">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="w-24 h-24 object-cover rounded" 
                      onError={(e) => {
                        e.target.src = '/placeholder-product.jpg';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.variant?.sizeDisplay && (
                        <p className="text-sm text-gray-500 mt-1">Size: {item.variant.sizeDisplay}</p>
                      )}
                      <p className="text-primary font-semibold mt-1">
                        ₹{(item.priceWithGst || item.price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {/* ✅ FIX: Use handleQuantityChange with item object */}
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
                    </div>
                    {/* ✅ FIX: Pass full item object to removeFromCart */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeFromCart(item)}
                      disabled={loading}
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-900">Order Summary</h2>
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      {/* ✅ FIX: Use getTotalPrice() instead of getCartTotal() */}
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
                      {/* ✅ FIX: Use getTotalPrice() instead of getCartTotal() */}
                      <span className="text-primary">
                        ₹{getTotalPrice().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <Link to="/checkout">
                    <Button className="w-full" size="lg" disabled={loading}>
                      Proceed to Checkout
                    </Button>
                  </Link>
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
