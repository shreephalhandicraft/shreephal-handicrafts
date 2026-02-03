import React, { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Separator } from "@/components/ui/separator";
import { Shield, Truck, RotateCcw, Package } from "lucide-react";

// 💰 Price formatting helper
const formatPrice = (price) => {
  return (price || 0).toLocaleString("en-IN", { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// 🐛 Clean size display helper (same as Cart & ProductDetail)
const getCleanSize = (item) => {
  const variant = item.variant;
  
  if (!variant) return 'N/A';
  
  // If variant is a string, try to parse it
  if (typeof variant === 'string') {
    try {
      const parsed = JSON.parse(variant);
      return parsed.sizeDisplay || parsed.size_display || parsed.size || 'N/A';
    } catch {
      return variant;
    }
  }
  
  // If variant is an object
  if (typeof variant === 'object' && variant !== null) {
    return variant.sizeDisplay || variant.size_display || variant.size || 'N/A';
  }
  
  return 'N/A';
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
      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center flex-shrink-0">
        <div className="text-center">
          <Package className="h-6 w-6 text-gray-400 mx-auto" />
        </div>
      </div>
    );
  }
  
  return (
    <img 
      src={item.image} 
      alt={item.name} 
      className="w-16 h-16 object-cover rounded-lg flex-shrink-0" 
      onError={handleImageError}
      loading="lazy"
    />
  );
};

const OrderSummary = () => {
  const {
    items,
    getTotalItems,
    getBasePrice, // sum(base price * qty)
    getTotalGST, // sum(gstAmount * qty) - variable rates from CartContext
    getTotalPrice, // base + GST
  } = useCart();

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-lg border-2 border-gray-200 p-8 h-fit sticky top-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Order Summary
        <span className="text-primary ml-2">({getTotalItems()} items)</span>
      </h2>

      {/* Items List - Enhanced Cards */}
      <div className="space-y-4 mb-6">
        {items.map((item) => {
          const basePrice = item.price || 0;
          const gstRate = item.gstRate || 0;
          const itemTotal = item.priceWithGst * item.quantity;

          return (
            <div
              key={`${item.id}-${JSON.stringify(item.customization)}`}
              className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <ProductImage item={item} />
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                  {item.name}
                </h3>
                
                {/* Size Badge */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {getCleanSize(item)}
                  </span>
                  {item.customization && Object.keys(item.customization).length > 0 && (
                    <span className="inline-flex px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full text-xs font-medium">
                      Customized
                    </span>
                  )}
                </div>
                
                {/* Price & Quantity */}
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Qty: {item.quantity}</span>
                    {gstRate > 0 && (
                      <span className="text-orange-600 ml-2">
                        • GST @{Math.round(gstRate * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">
                      ₹{formatPrice(itemTotal)}
                    </div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-gray-500">
                        ₹{formatPrice(item.priceWithGst)} each
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Price Breakdown - Enhanced */}
      <div className="space-y-3 p-6 bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Subtotal (Base Price)</span>
          <span className="font-semibold text-gray-900">₹{formatPrice(getBasePrice())}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-orange-600 font-medium">GST (Product-wise)</span>
          <span className="text-orange-600 font-semibold">+₹{formatPrice(getTotalGST())}</span>
        </div>
        
        <Separator />
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-green-600 font-semibold">FREE</span>
        </div>
        
        <Separator className="border-gray-300" />
        
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

      {/* Trust Badges */}
      <div className="space-y-3 pt-6 border-t border-gray-200 mb-6">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="font-medium">Secure Payment</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Truck className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <span className="font-medium">Free Shipping</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <RotateCcw className="h-5 w-5 text-purple-600 flex-shrink-0" />
          <span className="font-medium">7-Day Returns</span>
        </div>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-xs text-gray-700 text-center leading-relaxed">
          <strong className="text-blue-700">✅ GST Breakdown:</strong> Applied per product (5% or 18%)
          <br />
          <strong className="text-blue-700">🚚 Shipping:</strong> FREE on all orders
          <br />
          <strong className="text-blue-700">💳 Payment:</strong> Secure UPI/PhonePe
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
