import React from "react";
import { useCart } from "@/contexts/CartContext";

const OrderSummary = () => {
  const {
    items,
    getTotalItems,
    getBasePrice, // sum(base price * qty)
    getTotalGST, // sum(gstAmount * qty) - variable rates from CartContext
    getTotalPrice, // base + GST
  } = useCart();

  return (
    <div className="bg-gray-50 rounded-lg p-6 h-fit">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Order Summary ({getTotalItems()} items)
      </h2>

      {/* Items Table - Professional Bill Format */}
      <div className="space-y-3 mb-6 overflow-x-auto">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 text-xs font-medium text-gray-700 bg-gray-100 p-2 rounded-t-lg">
          <span>Item</span>
          <span>Qty</span>
          <span>Rate</span>
          <span>Total</span>
        </div>

        {items.map((item) => {
          const basePrice = item.price || 0; // CartContext base price
          const gstAmount = item.gstAmount || 0; // CartContext computed GST
          const gstRate = item.gstRate || 0; // CartContext 0.05/0.18
          const itemSubtotal = basePrice * item.quantity;
          const itemGst = gstAmount * item.quantity;
          const itemTotal = item.priceWithGst * item.quantity; // CartContext total

          return (
            <div
              key={`${item.id}-${JSON.stringify(item.customization)}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 border-b border-gray-200 py-3 items-center"
            >
              <div className="flex items-center space-x-2">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-10 h-10 object-cover rounded border"
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{item.name}</p>
                  {item.variant && (
                    <p className="text-xs text-gray-500">
                      {typeof item.variant === "object"
                        ? Object.entries(item.variant)
                            .map(([k, v]) => `${k}:${v}`)
                            .join(", ")
                        : item.variant}
                    </p>
                  )}
                  {item.customization &&
                    Object.keys(item.customization).length > 0 && (
                      <p className="text-xs text-orange-600">Customized</p>
                    )}
                </div>
              </div>
              <div className="text-sm font-medium">{item.quantity}</div>
              <div className="space-y-0.5">
                <div>₹{basePrice.toFixed(2)}</div>
                {gstRate > 0 && (
                  <div className="text-orange-600 text-xs">
                    GST @{Math.round(gstRate * 100)}%
                  </div>
                )}
              </div>
              <div className="font-semibold text-sm text-right">
                ₹{itemTotal.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill Summary - Matches CartContext math exactly */}
      <div className="space-y-2 p-4 bg-white rounded-lg border shadow-sm mb-4">
        <div className="flex justify-between text-sm">
          <span>Subtotal (Base Price)</span>
          <span>₹{getBasePrice().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-orange-600 font-medium">
          <span>GST (Product-wise)</span>
          <span>+ ₹{getTotalGST().toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 line-through">
          <span>MRP (if applicable)</span>
          <span>—</span>
        </div>
        <div className="flex justify-between pt-2 border-t font-bold text-base">
          <span>NET TOTAL</span>
          <span className="text-primary">₹{getTotalPrice().toFixed(2)}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 text-center p-3 bg-blue-50 rounded border">
        <p>
          <strong>✅ GST Breakdown:</strong> Applied per product (5% or 18% as
          per HSN code)
        </p>
        <p>
          <strong>🚚 Shipping:</strong> FREE | <strong>💳 Payment:</strong>{" "}
          Secure UPI/PhonePe
        </p>
      </div>
    </div>
  );
};

export default OrderSummary;
