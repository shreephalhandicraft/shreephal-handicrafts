import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

const PHONEPE_PAY_URL = import.meta.env.VITE_BACKEND_URL
  ? `${import.meta.env.VITE_BACKEND_URL}/pay`
  : "http://localhost:3000/pay";

export const useCheckoutLogic = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, getTotalPrice, clearCart, getCartForCheckout } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const payFormRef = useRef(null);

  // State
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
  });

  // Computed values (used for display only, not for order creation)
  const subtotal = getTotalPrice();
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Handle form input changes
  const handleChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }, []);

  // 🔒 SERVER-SIDE PRICE VALIDATION FUNCTION
  const validatePricesFromDatabase = useCallback(async (cartItems) => {
    console.log("🔒 Starting server-side price validation...");
    
    // Extract variant IDs from cart
    const variantIds = cartItems
      .map(item => item.variantId)
      .filter(Boolean);

    if (variantIds.length === 0) {
      throw new Error("No valid product variants found in cart");
    }

    console.log("🔍 Validating prices for variants:", variantIds);

    // Fetch real prices from database
    const { data: dbVariants, error: priceError } = await supabase
      .from('product_variants')
      .select('id, price, stock_quantity, product_id')
      .in('id', variantIds);

    if (priceError) {
      console.error("❌ Price fetch error:", priceError);
      throw new Error("Failed to validate product prices. Please try again.");
    }

    if (!dbVariants || dbVariants.length === 0) {
      throw new Error("No products found in database. Please refresh your cart.");
    }

    console.log("📊 Database prices fetched:", dbVariants);

    // Validate each cart item
    let serverCalculatedSubtotal = 0;
    const validatedItems = [];
    const priceChanges = [];
    const stockIssues = [];

    for (const item of cartItems) {
      const dbVariant = dbVariants.find(v => v.id === item.variantId);
      
      if (!dbVariant) {
        throw new Error(`Product "${item.name}" is no longer available. Please remove it from your cart.`);
      }
      
      // Price validation (allow 1 paisa tolerance for floating point rounding)
      const priceDifference = Math.abs(item.price - dbVariant.price);
      if (priceDifference > 0.01) {
        console.warn(`⚠️ Price mismatch detected for "${item.name}"`);
        console.warn(`   Cart price: ₹${item.price}`);
        console.warn(`   Database price: ₹${dbVariant.price}`);
        
        priceChanges.push({
          name: item.name,
          cartPrice: item.price,
          actualPrice: dbVariant.price,
        });
      }
      
      // Stock validation
      if (dbVariant.stock_quantity < item.quantity) {
        console.warn(`⚠️ Insufficient stock for "${item.name}"`);
        console.warn(`   Requested: ${item.quantity}`);
        console.warn(`   Available: ${dbVariant.stock_quantity}`);
        
        stockIssues.push({
          name: item.name,
          requested: item.quantity,
          available: dbVariant.stock_quantity,
        });
      }
      
      // Use database price (the source of truth)
      const validatedPrice = dbVariant.price;
      serverCalculatedSubtotal += validatedPrice * item.quantity;
      
      validatedItems.push({
        ...item,
        price: validatedPrice, // Override with DB price
      });
    }

    // Report issues if found
    if (priceChanges.length > 0) {
      const changedProducts = priceChanges.map(p => 
        `${p.name}: ₹${p.cartPrice} → ₹${p.actualPrice}`
      ).join(', ');
      
      throw new Error(
        `Price changed for: ${changedProducts}. Please refresh your cart and try again.`
      );
    }

    if (stockIssues.length > 0) {
      const outOfStock = stockIssues.map(s => 
        `${s.name}: Only ${s.available} available (you requested ${s.requested})`
      ).join(', ');
      
      throw new Error(
        `Insufficient stock: ${outOfStock}. Please update quantities and try again.`
      );
    }

    // Calculate tax and total with server prices
    const serverTax = serverCalculatedSubtotal * 0.08;
    const serverTotal = serverCalculatedSubtotal + serverTax;
    const serverTotalPaise = Math.round(serverTotal * 100);

    console.log("✅ Price validation successful!");
    console.log("📊 Server calculations:", {
      subtotal: serverCalculatedSubtotal.toFixed(2),
      tax: serverTax.toFixed(2),
      total: serverTotal.toFixed(2),
      totalPaise: serverTotalPaise,
    });

    // Warn if client and server totals differ significantly (more than ₹1 difference)
    const totalDifference = Math.abs(serverTotal - total);
    if (totalDifference > 1) {
      console.warn("⚠️ Client/Server total mismatch detected!");
      console.warn(`   Client total: ₹${total.toFixed(2)}`);
      console.warn(`   Server total: ₹${serverTotal.toFixed(2)}`);
      console.warn(`   Difference: ₹${totalDifference.toFixed(2)}`);
      console.warn("   Using server-calculated total for security.");
    }

    return {
      validatedItems,
      serverSubtotal: serverCalculatedSubtotal,
      serverTax,
      serverTotal,
      serverTotalPaise,
    };
  }, [total]);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) {
      console.log("❌ No user ID found");
      return;
    }

    try {
      setLoading(true);
      console.log("🔍 Fetching profile for user ID:", user.id);

      const { data: authUser } = await supabase.auth.getUser();
      console.log("👤 Auth user:", authUser.user);

      console.log("🔎 Querying customers table with user_id:", user.id);

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("📊 Customer query result:", { customer, customerError });

      if (customerError) {
        if (customerError.code === "PGRST116") {
          console.log(
            "📝 No customer profile found (PGRST116), using auth data only"
          );
          setFormData({
            firstName: "",
            lastName: "",
            email: authUser.user?.email || "",
            phone: authUser.user?.phone || "",
            address: "",
            city: "",
            state: "",
            zipCode: "",
          });
          setLoading(false);
          return;
        } else {
          console.error("❌ Customer fetch error:", customerError);
          throw customerError;
        }
      }

      if (!customer) {
        console.log("📝 Customer data is null/undefined");
        setFormData({
          firstName: "",
          lastName: "",
          email: authUser.user?.email || "",
          phone: authUser.user?.phone || "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
        });
        setLoading(false);
        return;
      }

      console.log("📋 Customer data found:", customer);
      console.log("📍 Raw address field:", customer.address);

      let address = {};
      if (customer?.address) {
        try {
          address =
            typeof customer.address === "string"
              ? JSON.parse(customer.address)
              : customer.address;
          console.log("🏠 Parsed address:", address);
        } catch (parseError) {
          console.error("❌ Address parsing error:", parseError);
          console.log(
            "🔍 Address value that failed to parse:",
            customer.address
          );
          address = {};
        }
      }

      const mappedFormData = {
        firstName: customer.name?.split(" ")[0] || "",
        lastName: customer.name?.split(" ").slice(1).join(" ") || "",
        email: authUser.user?.email || customer.email || "",
        phone: authUser.user?.phone || customer.phone || "",
        address: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
      };

      console.log("📝 Mapped form data:", mappedFormData);
      setFormData(mappedFormData);
      console.log("✅ Form populated with customer data");
    } catch (error) {
      console.error("❌ Profile fetch error:", error);
      toast({
        title: "Error",
        description:
          "Failed to load profile data. Please fill the form manually.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  // Form validation
  const validateForm = useCallback(() => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "state",
      "zipCode",
    ];

    for (const field of required) {
      if (!formData[field]?.trim()) {
        toast({
          title: "Validation Error",
          description: `Please fill in ${field
            .replace(/([A-Z])/g, " $1")
            .toLowerCase()}`,
          variant: "destructive",
        });
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }, [formData, toast]);

  // Create customization details for order
  const createCustomizationDetails = useCallback((cartItems) => {
    const customizationDetails = {};

    cartItems.forEach((item) => {
      if (item.customization && Object.keys(item.customization).length > 0) {
        const { productId, productTitle, ...actualCustomization } =
          item.customization;

        customizationDetails[item.productId || item.id] = {
          productId: item.productId || item.id,
          productTitle: item.name,
          variantId: item.variantId || null,
          customizations: actualCustomization,
          timestamp: new Date().toISOString(),
        };
      }
    });

    return customizationDetails;
  }, []);

  // Create order in database with server-side price validation
  const createOrder = useCallback(
    async (paymentMethod = "PayNow") => {
      try {
        console.log("=== CREATING ORDER WITH PRICE VALIDATION ===");
        console.log("User ID:", user?.id);

        if (!user?.id) {
          throw new Error("User not authenticated");
        }

        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          throw new Error("Authentication failed");
        }

        // Get or create customer
        let customer;
        const { data: existingCustomer, error: customerFetchError } =
          await supabase
            .from("customers")
            .select("id")
            .eq("user_id", authUser.id)
            .single();

        if (customerFetchError && customerFetchError.code !== "PGRST116") {
          throw new Error(
            "Failed to fetch customer: " + customerFetchError.message
          );
        }

        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          const { data: newCustomer, error: customerCreateError } =
            await supabase
              .from("customers")
              .insert({
                user_id: authUser.id,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
              })
              .select("id")
              .single();

          if (customerCreateError) {
            throw new Error(
              "Failed to create customer: " + customerCreateError.message
            );
          }
          customer = newCustomer;
        }

        // Get cart items
        const cartItems = getCartForCheckout();
        
        if (cartItems.length === 0) {
          throw new Error("Cart is empty");
        }

        // 🔒 VALIDATE PRICES FROM DATABASE
        console.log("🔒 Validating prices with database...");
        const { 
          validatedItems, 
          serverSubtotal,
          serverTax,
          serverTotal, 
          serverTotalPaise 
        } = await validatePricesFromDatabase(cartItems);
        
        console.log("✅ Price validation passed!");

        // Create customization details
        const customizationDetails = createCustomizationDetails(validatedItems);

        // Build order data with VALIDATED prices
        const orderData = {
          user_id: authUser.id,
          customer_id: customer.id,
          items: validatedItems.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: item.price, // ✅ This is now the validated database price
            quantity: item.quantity,
            image: item.image || "",
            variant: item.variant,
            customization: item.customization || {},
          })),
          shipping_info: {
            firstName: formData.firstName || "",
            lastName: formData.lastName || "",
            phone: formData.phone || "",
            address: formData.address || "",
            city: formData.city || "",
            state: formData.state || "",
            zipCode: formData.zipCode || "",
          },
          delivery_info: {
            method: "standard",
            estimatedDays: "3-5",
          },
          total_price: serverTotalPaise, // ✅ Server-calculated total in paise
          amount: serverTotal, // ✅ Server-calculated total in rupees
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod || "PayNow",
          upi_reference: null,
          transaction_id: null,
          order_notes: null,
          customization_details: customizationDetails,
          requires_customization: Object.keys(customizationDetails).length > 0,
        };

        console.log("📦 Creating order with validated data:", {
          ...orderData,
          items: `${orderData.items.length} items`,
        });

        const { data, error } = await supabase
          .from("orders")
          .insert([orderData])
          .select("*")
          .single();

        if (error) {
          console.error("💥 INSERT ERROR:", error);
          throw new Error(`Database error: ${error.message}`);
        }

        console.log("✅ Order created successfully with ID:", data.id);
        console.log("💰 Order total (validated):", serverTotal);
        
        return data;
      } catch (error) {
        console.error("🚨 CREATE ORDER FAILED:", error);
        throw error;
      }
    },
    [user?.id, formData, getCartForCheckout, validatePricesFromDatabase, createCustomizationDetails]
  );

  // Handle PayNow payment
  const handlePayNow = useCallback(async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);

    try {
      const cartItemsForPhonePe = items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        customization: item.customization || {},
      }));

      // Create order with validated prices
      const order = await createOrder("PayNow");
      console.log("📦 Keeping cart until payment confirmation...");

      // Use the validated amount from the order
      const totalAmount = order.total_price; // Already in paise from server validation

      const requiredElements = [
        "pp-order-id",
        "pp-amount",
        "pp-customer-email",
        "pp-customer-phone",
        "pp-customer-name",
        "pp-cart-items",
        "pp-shipping-info",
      ];

      for (const elementId of requiredElements) {
        const element = document.getElementById(elementId);
        if (!element) {
          throw new Error(`Required form element ${elementId} not found`);
        }
      }

      document.getElementById("pp-order-id").value = order.id;
      document.getElementById("pp-amount").value = totalAmount;
      document.getElementById("pp-customer-email").value = formData.email;
      document.getElementById("pp-customer-phone").value = formData.phone;
      document.getElementById(
        "pp-customer-name"
      ).value = `${formData.firstName} ${formData.lastName}`;
      document.getElementById("pp-cart-items").value =
        JSON.stringify(cartItemsForPhonePe);
      document.getElementById("pp-shipping-info").value = JSON.stringify({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
      });

      if (payFormRef.current) {
        payFormRef.current.submit();
      } else {
        throw new Error("Payment form reference not found");
      }
    } catch (error) {
      console.error("PayNow failed:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Payment initialization failed",
        variant: "destructive",
      });
      setProcessingPayment(false);
    }
  }, [validateForm, items, formData, createOrder, toast]);

  // Handle Cash on Delivery
  const handleCODPayment = useCallback(async () => {
    if (!validateForm()) return;
    if (items.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);

    try {
      // Create order with validated prices
      const order = await createOrder("COD");

      console.log("🧹 Clearing cart after successful COD order...");
      await clearCart();
      console.log("✅ Cart cleared successfully");

      toast({
        title: "Order Placed Successfully!",
        description: `Order #${order.id.slice(
          0,
          8
        )} has been placed. You'll pay on delivery.`,
      });

      navigate(`/order/${order.id}`);
    } catch (error) {
      console.error("COD Payment error:", error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  }, [validateForm, items, createOrder, clearCart, toast, navigate]);

  // Clear URL parameters helper
  const clearUrlParams = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("status");
    newSearchParams.delete("orderId");
    newSearchParams.delete("transactionId");
    newSearchParams.delete("message");
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(
    async (orderId, transactionId = null) => {
      try {
        console.log("🎉 Processing payment success for order:", orderId);
        setProcessingPayment(true);
        setPaymentProcessed(true);

        // Clear URL parameters immediately
        clearUrlParams();

        const { data: order, error: fetchError } = await supabase
          .from("orders")
          .select("payment_status, status, id")
          .eq("id", orderId)
          .single();

        if (fetchError) {
          throw new Error("Failed to fetch order details");
        }

        console.log("📋 Order status:", order);

        if (
          order.payment_status === "completed" ||
          order.payment_status === "success"
        ) {
          console.log("🧹 Clearing cart after successful payment...");
          await clearCart();
          console.log("✅ Cart cleared successfully");

          if (transactionId) {
            await supabase
              .from("orders")
              .update({ transaction_id: transactionId })
              .eq("id", orderId);
          }

          toast({
            title: "Payment Successful! 🎉",
            description: "Your order has been confirmed. Redirecting...",
            duration: 3000,
          });

          setTimeout(() => {
            navigate(`/order/${orderId}`, { replace: true });
          }, 2000);
        } else {
          toast({
            title: "Payment Verification Failed",
            description: "Please contact support if money was deducted.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("❌ Payment verification failed:", error);
        toast({
          title: "Payment Verification Failed",
          description: error.message || "Please contact support.",
          variant: "destructive",
        });
      } finally {
        setProcessingPayment(false);
      }
    },
    [clearCart, toast, navigate, clearUrlParams]
  );

  // Handle payment failure
  const handlePaymentFailure = useCallback(
    async (orderId, message = null) => {
      try {
        console.log("❌ Processing payment failure for order:", orderId);
        setPaymentProcessed(true);

        // Clear URL parameters immediately to prevent re-processing
        clearUrlParams();

        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            status: "cancelled",
            order_notes: message || "Payment failed",
          })
          .eq("id", orderId);

        // Show error toast only once
        toast({
          title: "Payment Failed",
          description:
            message || "Your payment was not processed. Please try again.",
          variant: "destructive",
          duration: 5000,
        });

        console.log("🛒 Keeping cart for retry");

        // Navigate back to checkout after a delay
        setTimeout(() => {
          setProcessingPayment(false);
        }, 1000);
      } catch (error) {
        console.error("Error handling payment failure:", error);
        toast({
          title: "Error",
          description:
            "Failed to process payment failure. Please contact support.",
          variant: "destructive",
        });
      } finally {
        setProcessingPayment(false);
      }
    },
    [toast, clearUrlParams]
  );

  // Check for payment status on mount - ONLY ONCE
  useEffect(() => {
    const paymentStatus = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const transactionId = searchParams.get("transactionId");

    // Prevent duplicate processing
    if (paymentProcessed) {
      console.log("⚠️ Payment already processed, skipping...");
      return;
    }

    if (paymentStatus && orderId) {
      if (paymentStatus === "success") {
        console.log("🎉 Payment success detected, handling...");
        handlePaymentSuccess(orderId, transactionId);
      } else if (paymentStatus === "failure") {
        console.log("❌ Payment failure detected");
        const failureMessage = searchParams.get("message");
        handlePaymentFailure(orderId, failureMessage);
      }
    }
  }, [
    searchParams,
    handlePaymentSuccess,
    handlePaymentFailure,
    paymentProcessed,
  ]);

  // Redirect if cart becomes empty (but not during payment processing)
  useEffect(() => {
    if (
      !loading &&
      !processingPayment &&
      !paymentProcessed &&
      items.length === 0
    ) {
      console.log("Cart is empty, redirecting to cart page...");
      navigate("/cart");
    }
  }, [items.length, loading, navigate, processingPayment, paymentProcessed]);

  // Fetch user profile on mount
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user, fetchUserProfile]);

  return {
    // State
    loading,
    processingPayment,
    formData,
    items,
    searchParams,
    payFormRef,

    // Computed values
    subtotal,
    tax,
    total,

    // Functions
    handleChange,
    handlePayNow,
    handleCODPayment,
    handlePaymentSuccess,
    handlePaymentFailure,
    validateForm,

    // Additional utilities
    PHONEPE_PAY_URL,
  };
};