import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ FIXED: Add item with proper customization handling
  const addItem = async (itemData) => {
    try {
      console.log("Adding item to cart:", itemData);

      if (user) {
        // For authenticated users - we'll store basic info in DB and full data in localStorage
        // This is because cart_items table doesn't have customization fields
        const { data: existingItem, error: fetchError } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", itemData.productId || itemData.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        if (existingItem) {
          // Update existing item
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({
              quantity: existingItem.quantity + (itemData.quantity || 1),
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingItem.id);

          if (updateError) throw updateError;
        } else {
          // Insert new item
          const { error: insertError } = await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: itemData.productId || itemData.id,
              quantity: itemData.quantity || 1,
            });

          if (insertError) throw insertError;
        }

        // Store full item data (including customization) in localStorage as backup
        const localCartKey = `user_${user.id}_cart_details`;
        const existingLocalCart = JSON.parse(
          localStorage.getItem(localCartKey) || "[]"
        );

        const itemKey = generateItemKey(itemData);
        const existingLocalIndex = existingLocalCart.findIndex(
          (item) => generateItemKey(item) === itemKey
        );

        if (existingLocalIndex >= 0) {
          existingLocalCart[existingLocalIndex].quantity +=
            itemData.quantity || 1;
        } else {
          existingLocalCart.push({
            ...itemData,
            addedAt: new Date().toISOString(),
          });
        }

        localStorage.setItem(localCartKey, JSON.stringify(existingLocalCart));

        // Refresh cart items
        await fetchCartItems();
      } else {
        // Guest user - add to localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const itemKey = generateItemKey(itemData);

        const existingItemIndex = storedCart.findIndex(
          (item) => generateItemKey(item) === itemKey
        );

        if (existingItemIndex >= 0) {
          storedCart[existingItemIndex].quantity += itemData.quantity || 1;
        } else {
          storedCart.push({
            ...itemData,
            addedAt: new Date().toISOString(),
          });
        }

        localStorage.setItem("cart_items", JSON.stringify(storedCart));
        setCartItems(storedCart);
      }

      toast({
        title: "Added to Cart",
        description: `${
          itemData.name || itemData.title
        } has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  // ✅ Helper function to generate unique item key including customization
  const generateItemKey = (item) => {
    const baseKey = `${item.productId || item.id}-${
      item.variantId || "no-variant"
    }`;
    const customizationKey = item.customization
      ? btoa(JSON.stringify(item.customization)).slice(0, 8)
      : "no-custom";
    return `${baseKey}-${customizationKey}`;
  };

  // ✅ FIXED: Fetch cart items with customization data
  const fetchCartItems = async () => {
    setLoading(true);

    try {
      if (user) {
        // Get basic cart data from database
        const { data: cartData, error } = await supabase
          .from("cart_items")
          .select(
            `
            id,
            product_id,
            quantity,
            created_at,
            products!product_id (
              id,
              title,
              price,
              image_url,
              category_id,
              categories!category_id (
                name
              )
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Get detailed cart data (including customization) from localStorage
        const localCartKey = `user_${user.id}_cart_details`;
        const localCartDetails = JSON.parse(
          localStorage.getItem(localCartKey) || "[]"
        );

        const transformedItems =
          cartData?.map((item) => {
            // Find matching detailed item
            const detailedItem = localCartDetails.find(
              (local) => (local.productId || local.id) === item.product_id
            );

            return {
              id: item.product_id,
              productId: item.product_id,
              name: item.products?.title,
              price: item.products?.price || 0,
              image: item.products?.image_url,
              category: item.products?.categories?.name || "Product",
              quantity: item.quantity,
              cartId: item.id,
              variantId: detailedItem?.variantId || null,
              variant: detailedItem?.variant || null,
              customization: detailedItem?.customization || {},
              addedAt: item.created_at,
            };
          }) || [];

        setCartItems(transformedItems);
      } else {
        // Guest user - get from localStorage
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        setCartItems(storedCart);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
      toast({
        title: "Error",
        description: "Failed to load cart items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Update quantity with customization handling
  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(item);
      return;
    }

    try {
      if (user) {
        // Update database
        const { error } = await supabase
          .from("cart_items")
          .update({
            quantity: newQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.cartId);

        if (error) throw error;

        // Update localStorage details
        const localCartKey = `user_${user.id}_cart_details`;
        const localCartDetails = JSON.parse(
          localStorage.getItem(localCartKey) || "[]"
        );
        const updatedLocalCart = localCartDetails.map((localItem) =>
          (localItem.productId || localItem.id) === item.productId &&
          JSON.stringify(localItem.customization) ===
            JSON.stringify(item.customization)
            ? { ...localItem, quantity: newQuantity }
            : localItem
        );
        localStorage.setItem(localCartKey, JSON.stringify(updatedLocalCart));

        // Update local state
        setCartItems((prev) =>
          prev.map((cartItem) =>
            cartItem.cartId === item.cartId
              ? { ...cartItem, quantity: newQuantity }
              : cartItem
          )
        );
      } else {
        // Guest user - update localStorage
        const itemKey = generateItemKey(item);
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.map((cartItem) =>
          generateItemKey(cartItem) === itemKey
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        );

        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      throw error;
    }
  };

  // ✅ FIXED: Remove item with customization handling
  const removeFromCart = async (item) => {
    try {
      if (user) {
        // Remove from database
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", item.cartId);

        if (error) throw error;

        // Remove from localStorage details
        const localCartKey = `user_${user.id}_cart_details`;
        const localCartDetails = JSON.parse(
          localStorage.getItem(localCartKey) || "[]"
        );
        const updatedLocalCart = localCartDetails.filter(
          (localItem) =>
            !(
              (localItem.productId || localItem.id) === item.productId &&
              JSON.stringify(localItem.customization) ===
                JSON.stringify(item.customization)
            )
        );
        localStorage.setItem(localCartKey, JSON.stringify(updatedLocalCart));

        // Update local state
        setCartItems((prev) =>
          prev.filter((cartItem) => cartItem.cartId !== item.cartId)
        );
      } else {
        // Guest user - remove from localStorage
        const itemKey = generateItemKey(item);
        const storedCart = JSON.parse(
          localStorage.getItem("cart_items") || "[]"
        );
        const updatedCart = storedCart.filter(
          (cartItem) => generateItemKey(cartItem) !== itemKey
        );

        localStorage.setItem("cart_items", JSON.stringify(updatedCart));
        setCartItems(updatedCart);
      }
    } catch (error) {
      console.error("Error removing item:", error);
      throw error;
    }
  };

  // In CartContext.js, modify the clearCart function to be more robust
  const clearCart = async () => {
    try {
      console.log("🧹 Clearing cart...");

      if (user) {
        // Clear cart from database
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          console.error("Database clear error:", error);
          // Don't throw error, continue with localStorage clearing
        }

        // Clear localStorage details
        const localCartKey = `user_${user.id}_cart_details`;
        localStorage.removeItem(localCartKey);
      } else {
        // Clear from localStorage
        localStorage.removeItem("cart_items");
      }

      // Always clear context state
      setCartItems([]);

      console.log("✅ Cart cleared successfully");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      // Still clear the UI state even if database fails
      setCartItems([]);
    }
  };

  // Rest of your existing functions...
  const getTotalPrice = () => {
    return cartItems.reduce(
      (total, item) => total + (item.price || 0) * item.quantity,
      0
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ FIXED: Get cart for checkout with proper structure
  const getCartForCheckout = () => {
    return cartItems.map((item) => ({
      id: item.id,
      productId: item.productId || item.id,
      variantId: item.variantId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      variant: item.variant,
      customization: item.customization || {},
    }));
  };

  // Initialize cart on mount
  useEffect(() => {
    fetchCartItems();
  }, [user]);

  // Sync localStorage cart to database when user logs in
  useEffect(() => {
    if (user) {
      syncCartToDatabase();
    }
  }, [user]);

  const syncCartToDatabase = async () => {
    if (!user) return;

    try {
      const storedCart = JSON.parse(localStorage.getItem("cart_items") || "[]");
      if (storedCart.length === 0) return;

      // Move guest cart to user-specific localStorage
      const localCartKey = `user_${user.id}_cart_details`;
      const existingUserCart = JSON.parse(
        localStorage.getItem(localCartKey) || "[]"
      );

      const mergedCart = [...existingUserCart];

      for (const guestItem of storedCart) {
        const existingIndex = mergedCart.findIndex(
          (item) => generateItemKey(item) === generateItemKey(guestItem)
        );

        if (existingIndex >= 0) {
          mergedCart[existingIndex].quantity += guestItem.quantity;
        } else {
          mergedCart.push(guestItem);
        }
      }

      localStorage.setItem(localCartKey, JSON.stringify(mergedCart));
      localStorage.removeItem("cart_items");

      // Sync basic data to database
      for (const item of mergedCart) {
        await addItem(item);
      }

      if (storedCart.length > 0) {
        toast({
          title: "Cart Synced",
          description: `${storedCart.length} item(s) synced to your account.`,
        });
      }
    } catch (error) {
      console.error("Error syncing cart:", error);
    }
  };

  const value = {
    items: cartItems,
    loading,
    addItem,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getCartForCheckout,
    fetchCartItems,
    syncCartToDatabase,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
