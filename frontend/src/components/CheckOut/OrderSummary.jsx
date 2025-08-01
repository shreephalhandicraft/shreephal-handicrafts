import React from "react";

const OrderSummary = ({ items, subtotal, tax, total }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 h-fit">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Order Summary
      </h2>

      {/* Order Items */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={`${item.id}-${JSON.stringify(item.customization)}`}
            className="flex justify-between items-center"
          >
            <div className="flex items-center">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 object-cover rounded-lg mr-3"
                onError={(e) => {
                  e.target.src = "/placeholder-image.jpg";
                }}
              />
              <div>
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
              </div>
            </div>
            <span className="font-medium">
              ₹{(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 mb-6 pb-6 border-b">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">Free</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">₹{tax.toFixed(2)}</span>
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between mb-4">
        <span className="text-lg font-semibold">Total</span>
        <span className="text-lg font-bold text-primary">
          ₹{total.toFixed(2)}
        </span>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Choose your preferred payment method above
      </p>
    </div>
  );
};

export default OrderSummary;
