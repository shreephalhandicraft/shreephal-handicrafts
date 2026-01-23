import { createContext, useContext, useState, useEffect, useRef } from "react";
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
  
  // ✅ FIX BUG #4: Prevent race condition with sync lock
  const syncLockRef = useRef(false);

  // ✅ FIXED: Check stock availability with variant_id
  const checkStockAvailability = async (variantId, requestedQty) => {
    try {
      if (!variantId) {
        return { available: false, stock: 0, error: 'Variant ID required' };
      }

      const { data: variant, error } = await supabase
        .from('product_variants')
        .select('stock_quantity, size_display, product_id, products(title)')
        .eq('id', variantId)
        .single();

      if (error) {
        console.error('Stock check error:', error);
        return { available: false, stock: 0, error: 'Failed to check stock' };
      }

      if (!variant) {
        return { available: false, stock: 0, error: 'Product variant not found' };
      }

      // Calculate existing quantity in cart for this variant
      const existingQty = cartItems
        .filter(item => item.variantId === variantId)
        .reduce((sum, item) => sum + item.quantity, 0);

      const totalRequested = existingQty + requestedQty;
      const available = totalRequested <= variant.stock_quantity;

      return {
        available,
        stock: variant.stock_quantity,
        existingQty,
        totalRequested,
        productTitle: variant.products?.title || 'Product',
        sizeDisplay: variant.size_display
      };
    } catch (error) {
      console.error('Stock availability check failed:', error);
      return { available: false, stock: 0, error: error.message };
    }
  };

  // ✅ FIXED: Add item with variant_id to database
  const addItem = async (itemData) => {
    try {
      console.log("Adding item to cart:", {
        id: itemData.id,
        productId: itemData.productId,
        variantId: itemData.variantId,
        name: itemData.name,
        price: itemData.price
      });

      // ✅ CRITICAL: Validate variantId is present
      if (!itemData.variantId) {
        toast({
          title: "Missing Size",
          description: "Please select a size before adding to cart.",
          variant: "destructive",
        });
        return false;
      }

      // ✅ VALIDATE STOCK BEFORE ADDING
      const stockCheck = await checkStockAvailability(
        itemData.variantId,
        itemData.quantity || 1
      );

      if (!stockCheck.available) {
        if (stockCheck.stock === 0) {
          toast({
            title: "Out of Stock",
            description: `${stockCheck.productTitle} (${stockCheck.sizeDisplay}) is currently out of stock.`,
            variant: "destructive",
          });
        } else if (stockCheck.existingQty > 0) {
          toast({
            title: "Insufficient Stock",
            description: `Only ${stockCheck.stock} available. You already have ${stockCheck.existingQty} in cart.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Insufficient Stock",
            description: `Only ${stockCheck.stock} available for ${stockCheck.productTitle} (${stockCheck.sizeDisplay}).`,
            variant: "destructive",
          });
        }
        return false;
      }

      if (user) {
        // ✅ FIXED: Check existing cart item WITH variant_id
        const { data: existingItem, error: fetchError } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("user_id", user.id)
          .eq("product_id", itemData.productId || itemData.id)
          .eq("variant_id", itemData.variantId)  // ✅ NOW INCLUDES variant_id
          .maybeSingle();  // Use maybeSingle instead of single to avoid error

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Cart fetch error:", fetchError);
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
          // ✅ FIXED: Insert new item WITH variant_id
          const { error: insertError } = await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: itemData.productId || itemData.id,
              variant_id: itemData.variantId,  // ✅ NOW SAVES variant_id
              quantity: itemData.quantity || 1,
            });

          if (insertError) {
            console.error("Cart insert error:", insertError);
            throw insertError;
          }
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
        description: `${itemData.name || itemData.title} has been added to your cart.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
      return false;
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

  // ✅ FIXED: Fetch cart items with variant_id
  const fetchCartItems = async () => {
    setLoading(true);

    try {
      if (user) {
        // ✅ FIXED: Select variant_id from cart_items
        const { data: cartData, error } = await supabase
          .from("cart_items")
          .select(
            `
            id,
            product_id,
            variant_id,
            quantity,
            created_at,
            products!product_id (
              id,
              title,
              price,
              gst_5pct,     
              gst_18pct,
              image_url,
              category_id,
              categories!category_id (
                name
              )
            ),
            product_variants!variant_id (
              id,
              size_display,
              price,
              sku
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Fetch cart error:", error);
          throw error;
        }

        // Get detailed cart data (including customization) from localStorage
        const localCartKey = `user_${user.id}_cart_details`;
        const localCartDetails = JSON.parse(
          localStorage.getItem(localCartKey) || "[]"
        );

        const transformedItems =
          cartData?.map((item) => {
            // Find matching detailed item
            const detailedItem = localCartDetails.find(
              (local) => 
                (local.productId || local.id) === item.product_id &&
                local.variantId === item.variant_id
            );
            
            // Use variant price if available, otherwise product base price
            const basePrice = item.product_variants?.price || item.products?.price || 0;
            
            let gstRate = 0;
            if (item.products?.gst_5pct) {
              gstRate = 0.05;
            } else if (item.products?.gst_18pct) {
              gstRate = 0.18;
            }
            const gstAmount = basePrice * gstRate;
            const priceWithGst = basePrice + gstAmount;

            return {
              id: item.product_id,
              productId: item.product_id,
              variantId: item.variant_id,  // ✅ NOW INCLUDES variantId
              name: item.products?.title,
              price: basePrice,
              gstRate,
              gstAmount,
              priceWithGst,
              image: item.products?.image_url,
              category: item.products?.categories?.name || "Product",
              quantity: item.quantity,
              cartId: item.id,
              variant: {
                id: item.product_variants?.id,
                sizeDisplay: item.product_variants?.size_display,
                sku: item.product_variants?.sku,
              },
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

  // ✅ Update quantity with stock validation
  const updateQuantity = async (item, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(item);
      return;
    }

    // ✅ VALIDATE STOCK BEFORE UPDATING
    if (item.variantId) {
      const stockCheck = await checkStockAvailability(
        item.variantId,
        newQuantity - item.quantity // Only check the difference
      );

      if (!stockCheck.available) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${stockCheck.stock} available in stock.`,
          variant: "destructive",
        });
        return;
      }
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
          localItem.variantId === item.variantId &&
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

  // ✅ Remove item from cart
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
              localItem.variantId === item.variantId &&
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

  // ✅ FIX BUG #8: Clear cart with error detection
  const clearCart = async () => {
    try {
      console.log("🧹 Clearing cart...");

      if (user) {
        // ✅ FIX BUG #8: Throw error if database clear fails
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("user_id", user.id);

        if (error) {
          console.error("❌ Database clear failed:", error);
          throw new Error(`Failed to clear cart from database: ${error.message}`);
        }

        // Clear localStorage details
        const localCartKey = `user_${user.id}_cart_details`;
        localStorage.removeItem(localCartKey);
        
        console.log("✅ Database cart cleared successfully");
      } else {
        // Clear guest cart from localStorage
        localStorage.removeItem("cart_items");
        console.log("✅ Guest cart cleared successfully");
      }

      // Clear UI state
      setCartItems([]);
      
      console.log("✅ Cart cleared completely");
    } catch (error) {
      console.error("❌ Failed to clear cart:", error);
      
      // ✅ FIX BUG #8: Show user error, but still clear UI to prevent confusion
      toast({
        title: "Warning",
        description: "Cart cleared from view, but database sync failed. Items may reappear on refresh.",
        variant: "destructive",
      });
      
      // Still clear UI to prevent worse UX
      setCartItems([]);
      
      // Re-throw so caller knows operation partially failed
      throw error;
    }
  };

  // ✅ FIX: Calculate totals with fallback for guest cart items
  const getBasePrice = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.price || 0;
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const getTotalGST = () => {
    return cartItems.reduce((total, item) => {
      const gstAmount = item.gstAmount || 0;
      return total + gstAmount * item.quantity;
    }, 0);
  };

  // ✅ FIX: Fallback to item.price if priceWithGst is missing (guest cart)
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.priceWithGst || item.price || 0;
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // ✅ FIXED: Get cart for checkout with variantId
  const getCartForCheckout = () => {
    return cartItems.map((item) => ({
      id: item.id,
      productId: item.productId || item.id,
      variantId: item.variantId,  // ✅ NOW INCLUDES variantId
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

  // ✅ FIX BUG #4: Sync cart with lock to prevent race conditions
  useEffect(() => {
    if (user && !syncLockRef.current) {
      syncCartToDatabase();
    }
  }, [user]);

  const syncCartToDatabase = async () => {
    // ✅ FIX BUG #4: Check lock before proceeding
    if (syncLockRef.current) {
      console.log("⚠️ Cart sync already in progress, skipping...");
      return;
    }

    if (!user) return;

    try {
      // ✅ FIX BUG #4: Set lock
      syncLockRef.current = true;
      
      const storedCart = JSON.parse(localStorage.getItem("cart_items") || "[]");
      if (storedCart.length === 0) {
        syncLockRef.current = false;
        return;
      }

      console.log(`🔄 Syncing ${storedCart.length} guest cart items to user account...`);

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
      
      // ✅ FIX BUG #4: Clear guest cart BEFORE async operations
      localStorage.removeItem("cart_items");

      // ✅ FIX BUG #4: Sync to database sequentially (not in parallel)
      let syncedCount = 0;
      for (const item of mergedCart) {
        const success = await addItem(item);
        if (success) syncedCount++;
      }

      if (storedCart.length > 0) {
        toast({
          title: "Cart Synced",
          description: `${syncedCount} item(s) synced to your account.`,
        });
      }
      
      console.log(`✅ Cart sync complete: ${syncedCount}/${mergedCart.length} items synced`);
    } catch (error) {
      console.error("❌ Error syncing cart:", error);
      toast({
        title: "Sync Failed",
        description: "Some cart items may not have synced. Please check your cart.",
        variant: "destructive",
      });
    } finally {
      // ✅ FIX BUG #4: Always release lock
      syncLockRef.current = false;
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
    getBasePrice,
    getTotalGST,
    getCartForCheckout,
    fetchCartItems,
    syncCartToDatabase,
    checkStockAvailability,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
