import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useFavourites } from "@/contexts/FavouritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { Minus, Plus, Trash2, ShoppingBag, Heart, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Cart = () => {
  const { user } = useAuth();
  const { addToFavourites } = useFavourites();
  const { toast } = useToast();

  // Use CartContext instead of local state
  const { items, updateQuantity, removeFromCart, getTotalPrice, loading } =
    useCart();

  const [updatingItems, setUpdatingItems] = useState(new Set());

  // Move item to wishlist
  const handleMoveToWishlist = async (item) => {
    const favouriteItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      category: item.category || "Product",
      rating: 4.5,
    };

    try {
      await addToFavourites(favouriteItem);
      await handleRemoveItem(item);

      toast({
        title: "Moved to Wishlist",
        description: `${item.name} has been moved to your wishlist.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move item to wishlist.",
        variant: "destructive",
      });
    }
  };

  // Handle quantity update with loading state
  const handleQuantityUpdate = async (item, newQuantity) => {
    if (newQuantity < 1) return;

    const itemKey = getItemKey(item);
    setUpdatingItems((prev) => new Set(prev).add(itemKey));

    try {
      await updateQuantity(item, newQuantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quantity.",
        variant: "destructive",
      });
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // Handle item removal with loading state
  const handleRemoveItem = async (item) => {
    const itemKey = getItemKey(item);
    setUpdatingItems((prev) => new Set(prev).add(itemKey));

    try {
      await removeFromCart(item);
      toast({
        title: "Removed from Cart",
        description: `${item.name} has been removed from your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item.",
        variant: "destructive",
      });
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemKey);
        return newSet;
      });
    }
  };

  // Helper function for cart item keys
  const getItemKey = (item) =>
    `${item.id}-${JSON.stringify(item.customization || {})}`;

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ Helper function to render customization details
  const renderCustomization = (item) => {
    if (!item?.customization) return null;

    const customization = item.customization;
    const uploadedImage = customization.uploadedImage;

    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600 font-medium mb-2">
          Customizations:
        </p>

        {/* Display uploaded image if it exists */}
        {uploadedImage?.url && (
          <div className="flex items-center gap-2 mb-2">
            <img
              src={uploadedImage.url}
              alt="Custom upload"
              className="w-12 h-12 object-cover rounded border"
              onError={(e) => {
                e.target.src = "/placeholder-image.jpg";
              }}
            />
            <span className="text-xs text-gray-600">
              {uploadedImage.fileName || "Custom Image"}
            </span>
          </div>
        )}

        {/* Display other customization options */}
        {Object.entries(customization).map(([key, value]) => {
          // Skip uploadedImage as we handle it separately
          if (key === "uploadedImage") return null;

          // Skip empty values
          if (!value || value === "") return null;

          return (
            <div key={key} className="text-xs text-gray-600 mb-1">
              <span className="font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}:
              </span>{" "}
              <span>
                {typeof value === "object" ? JSON.stringify(value) : value}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading cart...</span>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="py-20">
          <div className="container mx-auto px-4 text-center">
            <ShoppingBag className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link to="/shop">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Shopping Cart
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const itemKey = getItemKey(item);
                const isUpdating = updatingItems.has(itemKey);

                return (
                  <div
                    key={itemKey}
                    className={`bg-white rounded-lg shadow-sm border p-6 ${
                      isUpdating ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/80x80?text=No+Image";
                        }}
                      />

                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.name}
                        </h3>

                        {/* Display variant info if available */}
                        {item.variant && (
                          <p className="text-sm text-gray-600 mb-1">
                            Variant:{" "}
                            {typeof item.variant === "object"
                              ? Object.entries(item.variant)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(", ")
                              : item.variant}
                          </p>
                        )}

                        <p className="text-2xl font-bold text-primary">
                          ₹{item.price}
                        </p>

                        {/* ✅ FIXED: Safe customization rendering */}
                        {renderCustomization(item)}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMoveToWishlist(item)}
                            disabled={isUpdating}
                            className="text-pink-500 hover:text-pink-700 p-1 transition-colors disabled:opacity-50"
                            title="Move to Wishlist"
                          >
                            <Heart className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            disabled={isUpdating}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors disabled:opacity-50"
                            title="Remove from Cart"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleQuantityUpdate(item, item.quantity - 1)
                            }
                            disabled={isUpdating || item.quantity <= 1}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityUpdate(item, item.quantity + 1)
                            }
                            disabled={isUpdating}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6 h-fit">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Items ({getTotalItems()})
                  </span>
                  <span className="font-medium">
                    ₹{getTotalPrice().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (8%)</span>
                  <span className="font-medium">
                    ₹{(getTotalPrice() * 0.08).toFixed(2)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-primary">
                      ₹{(getTotalPrice() * 1.08).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <Link to={user ? "/checkout" : "/login"} className="block">
                <Button className="w-full mb-4">
                  {user ? "Proceed to Checkout" : "Login to Checkout"}
                </Button>
              </Link>

              <Link to="/shop" className="block">
                <Button variant="outline" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Cart;
