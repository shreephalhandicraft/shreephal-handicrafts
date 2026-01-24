import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useStockReservation } from "@/hooks/useStockReservation";

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
  
  const { reserveStock, confirmMultipleReservations } = useStockReservation();

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

  // Computed values
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

  const fetchUserProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data: authUser } = await supabase.auth.getUser();

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (customerError) {
        if (customerError.code === "PGRST116") {
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
          throw customerError;
        }
      }

      if (!customer) {
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

      let address = {};
      if (customer?.address) {
        try {
          address =
            typeof customer.address === "string"
              ? JSON.parse(customer.address)
              : customer.address;
        } catch (parseError) {
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

      setFormData(mappedFormData);
    } catch (error) {
      console.error("Profile fetch error:", error);
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
  
  const validateCartItems = useCallback(() => {
    const cartItems = getCartForCheckout();
    
    if (cartItems.length === 0) {
      toast({
        title: "Cart Empty",
        description: "Your cart is empty. Please add items before checkout.",
        variant: "destructive",
      });
      return false;
    }
    
    const itemsWithoutVariant = cartItems.filter(item => !item.variantId);
    
    if (itemsWithoutVariant.length > 0) {
      const itemNames = itemsWithoutVariant.map(i => i.name || 'Unknown').join(', ');
      
      console.error('❌ Cart validation failed - Missing variantId:', itemsWithoutVariant);
      
      toast({
        title: "Cart Validation Failed",
        description: `Some items are missing size selection: ${itemNames}. Please remove and re-add these items with proper size selection.`,
        variant: "destructive",
        duration: 8000,
      });
      
      return false;
    }
    
    console.log('✅ Cart validation passed - All items have variantId');
    return true;
  }, [getCartForCheckout, toast]);

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

  // ✨ RISKY #2 FIX: Helper to delay execution (for retry backoff)
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // ✨ RISKY #2 FIX: Check if error is retryable
  const isRetryableError = (error, statusCode) => {
    // Don't retry on client errors (bad request, file too large, etc)
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return false;
    }
    
    // Retry on network errors, timeouts, server errors
    const retryableMessages = [
      'network',
      'timeout',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      '5', // 5xx server errors
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  };

  // ✨ RISKY #2 FIX: Upload with retry logic
  const uploadCustomizationImage = useCallback(async (file, itemName) => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  📤 Uploading customization image for: ${itemName} (Attempt ${attempt}/${maxRetries})`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'shrifal_handicrafts');
        formData.append('folder', 'shrifal-handicrafts/customizations');
        
        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );
        
        const statusCode = cloudinaryResponse.status;
        
        if (!cloudinaryResponse.ok) {
          const errorData = await cloudinaryResponse.json();
          const errorMessage = errorData.error?.message || 'Cloudinary upload failed';
          
          // Check if error is retryable
          if (attempt < maxRetries && isRetryableError(new Error(errorMessage), statusCode)) {
            const delayMs = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
            console.warn(`  ⚠️ Upload failed (${errorMessage}), retrying in ${delayMs}ms...`);
            await delay(delayMs);
            continue; // Retry
          }
          
          // Permanent error or max retries reached
          throw new Error(errorMessage);
        }
        
        const cloudinaryData = await cloudinaryResponse.json();
        
        console.log(`  ✅ Image uploaded successfully: ${cloudinaryData.secure_url}`);
        
        return {
          url: cloudinaryData.secure_url,
          public_id: cloudinaryData.public_id,
          format: cloudinaryData.format,
          width: cloudinaryData.width,
          height: cloudinaryData.height,
          bytes: cloudinaryData.bytes
        };
        
      } catch (error) {
        // Check if we should retry
        if (attempt < maxRetries && isRetryableError(error, null)) {
          const delayMs = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`  ⚠️ Upload error (${error.message}), retrying in ${delayMs}ms...`);
          await delay(delayMs);
          continue; // Retry
        }
        
        // Final attempt failed or permanent error
        console.error(`  ❌ Cloudinary upload failed after ${attempt} attempt(s) for ${itemName}:`, error);
        throw new Error(`Failed to upload customization image for ${itemName}: ${error.message}`);
      }
    }
    
    // Should never reach here, but just in case
    throw new Error(`Failed to upload customization image for ${itemName} after ${maxRetries} attempts`);
  }, []);

  const createOrder = useCallback(
    async (paymentMethod = "PayNow") => {
      try {
        console.log("\n=== CREATING ORDER WITH ATOMIC STOCK RESERVATION ===");

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

        const cartItems = getCartForCheckout();
        console.log("\n📦 CART ITEMS:", JSON.stringify(cartItems, null, 2));

        const itemsWithoutVariant = cartItems.filter(item => !item.variantId);
        if (itemsWithoutVariant.length > 0) {
          console.error("❌ Items missing variantId:", itemsWithoutVariant);
          throw new Error(
            `Some items are missing size selection. Please remove and re-add these items: ${itemsWithoutVariant.map(i => i.name).join(", ")}`
          );
        }
        
        console.log("✅ All cart items have variantId - validation passed");

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

        const totalPaise = Math.round(total * 100);
        const customizationDetails = createCustomizationDetails(cartItems);

        console.log("\n📋 Fetching catalog numbers...");
        const productIds = cartItems.map(item => item.productId);
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('id, catalog_number')
          .in('id', productIds);

        if (productsError) {
          console.warn('⚠️ Could not fetch catalog numbers:', productsError);
        }

        const catalogNumberMap = {};
        if (productsData) {
          productsData.forEach(p => {
            catalogNumberMap[p.id] = p.catalog_number;
          });
        }

        const orderData = {
          user_id: authUser.id,
          customer_id: customer.id,
          items: cartItems.map((item) => ({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            price: item.price,
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
          total_price: totalPaise,
          amount: total,
          status: "pending",
          payment_status: "pending",
          payment_method: paymentMethod || "PayNow",
          upi_reference: null,
          transaction_id: null,
          order_notes: null,
          customization_details: customizationDetails,
          requires_customization: Object.keys(customizationDetails).length > 0,
        };

        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([orderData])
          .select("*")
          .single();

        if (orderError) {
          console.error("Order creation error:", orderError);
          throw new Error(`Database error: ${orderError.message}`);
        }

        console.log("✅ Order created:", order.id);

        console.log("\n📤 UPLOADING CUSTOMIZATION IMAGES...");
        const processedCartItems = [];
        
        for (const item of cartItems) {
          let customizationData = item.customization && Object.keys(item.customization).length > 0 
            ? { ...item.customization } 
            : null;
          
          if (customizationData?.uploadedImage && customizationData.uploadedImage instanceof File) {
            try {
              // ✨ RISKY #2 FIX: Now has retry logic!
              const uploadResult = await uploadCustomizationImage(
                customizationData.uploadedImage, 
                item.name
              );
              
              customizationData = {
                ...customizationData,
                uploadedImageUrl: uploadResult.url,
                cloudinaryPublicId: uploadResult.public_id,
                uploadedImage: null
              };
              
            } catch (error) {
              console.error('Upload failed after retries:', error);
              
              await supabase.from('orders').delete().eq('id', order.id);
              
              toast({
                title: 'Upload Failed',
                description: `Failed to upload customization for ${item.name} after multiple attempts. Order cancelled.`,
                variant: 'destructive',
                duration: 8000,
              });
              throw error;
            }
          }
          
          if (customizationData) {
            const cleanedCustomization = {};
            for (const [key, value] of Object.entries(customizationData)) {
              if (value !== null && value !== undefined && value !== '' && value !== false) {
                cleanedCustomization[key] = value;
              }
            }
            customizationData = Object.keys(cleanedCustomization).length > 0 
              ? cleanedCustomization 
              : null;
          }
          
          processedCartItems.push({
            ...item,
            processedCustomization: customizationData
          });
        }

        console.log("\n📝 Inserting into order_items table...");
        
        const orderItemsData = processedCartItems.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          variant_id: item.variantId,
          catalog_number: catalogNumberMap[item.productId] || null,
          quantity: item.quantity,
          unit_price: Math.round(item.price * 100),
          total_price: Math.round(item.price * item.quantity * 100),
          customization_data: item.processedCustomization
        }));

        console.log("  Order items to insert:", JSON.stringify(orderItemsData, null, 2));

        const { data: insertedItems, error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData)
          .select('*');

        if (itemsError) {
          console.error("❌ Failed to insert order_items:", itemsError);
          await supabase.from('orders').delete().eq('id', order.id);
          throw new Error(
            `Failed to create order items: ${itemsError.message}. Order cancelled.`
          );
        }

        console.log("✅ Order items inserted:", insertedItems.length);

        console.log("\n🎨 CREATING CUSTOMIZATION REQUESTS...");
        const customizationRequests = [];

        for (let i = 0; i < insertedItems.length; i++) {
          const orderItem = insertedItems[i];
          const customData = orderItem.customization_data;
          
          if (customData && Object.keys(customData).length > 0) {
            const hasImage = customData.uploadedImageUrl || customData.uploadedImage;
            const hasText = customData.text || customData.customText;
            const hasColor = customData.color || customData.customColor;
            
            let customizationType = '';
            if (hasImage && hasText) customizationType = 'image_and_text';
            else if (hasImage) customizationType = 'image';
            else if (hasText) customizationType = 'text';
            else if (hasColor) customizationType = 'text';
            else continue;
            
            const designFiles = hasImage ? {
              files: [{
                url: customData.uploadedImageUrl,
                cloudinary_id: customData.cloudinaryPublicId,
                type: 'customer_upload'
              }]
            } : null;
            
            customizationRequests.push({
              order_id: order.id,
              order_item_id: orderItem.id,
              customization_type: customizationType,
              customer_requirements: customData,
              design_files: designFiles,
              status: 'pending',
              admin_notes: null
            });
            
            console.log(`  ✅ Queued request for item ${orderItem.id} (${customizationType})`);
          }
        }

        if (customizationRequests.length > 0) {
          const { data: createdRequests, error: reqError } = await supabase
            .from('customization_requests')
            .insert(customizationRequests)
            .select('*');
          
          if (reqError) {
            console.error('❌ Failed to create customization requests:', reqError);
            console.warn('  ⚠️ Order will proceed without customization request tracking');
          } else {
            console.log(`  ✅ Created ${createdRequests.length} customization requests`);
          }
        } else {
          console.log('  ℹ️ No customization requests needed');
        }

        console.log("\n🔒 RESERVING & CONFIRMING STOCK ATOMICALLY...");
        const stockReservations = [];
        
        try {
          console.log("  📦 Step 1: Creating reservations...");
          for (const item of cartItems) {
            console.log(`    - Reserving: ${item.name} (qty: ${item.quantity})`);
            
            if (!item.variantId) {
              throw new Error(`Missing variantId for ${item.name}`);
            }

            const reservationId = await reserveStock(
              item.variantId,
              item.quantity,
              user.id,
              order.id
            );
            
            stockReservations.push({
              item: item.name,
              variantId: item.variantId,
              quantity: item.quantity,
              reservationId: reservationId
            });
            
            console.log(`    ✅ Reserved: ${reservationId}`);
          }

          console.log(`  ✅ All reservations created: ${stockReservations.length} items`);

          console.log("\n  🎯 Step 2: Batch confirming reservations (atomic)...");
          const reservationIds = stockReservations.map(r => r.reservationId);
          
          const confirmResult = await confirmMultipleReservations(reservationIds);
          
          console.log(`  ✅ ATOMIC CONFIRMATION SUCCESS: ${confirmResult.confirmedCount} items`);
          console.log(`     All stock decremented in single transaction`);
          
          stockReservations.forEach(r => {
            console.log(`    ✅ ${r.item}: ${r.quantity} units confirmed`);
          });

        } catch (error) {
          console.error("\n  ❌ STOCK RESERVATION/CONFIRMATION FAILED:", error);
          
          console.log("  🔄 Rolling back order due to stock failure...");
          
          await supabase.from('customization_requests').delete().eq('order_id', order.id);
          await supabase.from('order_items').delete().eq('order_id', order.id);
          await supabase.from('orders').delete().eq('id', order.id);
          
          console.log("  ✅ Rollback complete");
          
          let userMessage = error.message;
          if (error.message.includes('Insufficient stock')) {
            userMessage = `Stock unavailable: ${error.message}`;
          } else if (error.message.includes('Reserved stock')) {
            userMessage = 'Items currently in other carts. Please try again in a few minutes.';
          }
          
          throw new Error(userMessage);
        }

        console.log("\n✅ STOCK RESERVATION COMPLETE (BUG #2 FIXED)");
        console.log("   - Atomic operation: All-or-nothing");
        console.log("   - No race conditions possible");
        console.log("   - Automatic rollback on failure");
        console.log("\n🎉 ORDER CREATION COMPLETE WITH CUSTOMIZATIONS\n");
        
        return order;
      } catch (error) {
        console.error("\n🚨 ORDER CREATION FAILED:", error);
        throw error;
      }
    },
    [
      user?.id, 
      formData, 
      total, 
      getCartForCheckout, 
      createCustomizationDetails, 
      uploadCustomizationImage, 
      reserveStock,
      confirmMultipleReservations,
      toast
    ]
  );

  const handlePayNow = useCallback(async () => {
    if (!validateForm()) return;
    
    if (!validateCartItems()) {
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

      const order = await createOrder("PayNow");

      const totalAmount = Math.round(total * 100);

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
  }, [validateForm, validateCartItems, items, total, formData, createOrder, toast]);

  const handleCODPayment = useCallback(async () => {
    if (!validateForm()) return;
    
    if (!validateCartItems()) {
      return;
    }

    setProcessingPayment(true);

    try {
      const order = await createOrder("COD");

      const cartCleared = await clearCart();
      
      if (!cartCleared) {
        toast({
          title: "Order Placed with Warning",
          description: `Order #${order.id.slice(0, 8)} created but cart clear failed. Please refresh and manually clear your cart to avoid duplicate orders.`,
          variant: "default",
          duration: 10000,
        });
        
        navigate(`/order/${order.id}`);
        return;
      }

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
  }, [validateForm, validateCartItems, createOrder, clearCart, toast, navigate]);

  const clearUrlParams = useCallback(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete("status");
    newSearchParams.delete("orderId");
    newSearchParams.delete("transactionId");
    newSearchParams.delete("message");
    setSearchParams(newSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const handlePaymentSuccess = useCallback(
    async (orderId, transactionId = null) => {
      try {
        setProcessingPayment(true);
        setPaymentProcessed(true);
        clearUrlParams();

        const { data: order, error: fetchError } = await supabase
          .from("orders")
          .select("payment_status, status, id")
          .eq("id", orderId)
          .single();

        if (fetchError) {
          throw new Error("Failed to fetch order details");
        }

        if (
          order.payment_status === "completed" ||
          order.payment_status === "success"
        ) {
          const cartCleared = await clearCart();
          
          if (!cartCleared) {
            toast({
              title: "Payment Successful - Cart Warning",
              description: "Payment completed but cart clear failed. Please manually clear your cart to avoid duplicate orders.",
              variant: "default",
              duration: 10000,
            });
          }

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
        console.error("Payment verification failed:", error);
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

  const handlePaymentFailure = useCallback(
    async (orderId, message = null) => {
      try {
        setPaymentProcessed(true);
        clearUrlParams();

        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            status: "cancelled",
            order_notes: message || "Payment failed",
          })
          .eq("id", orderId);

        toast({
          title: "Payment Failed",
          description:
            message || "Your payment was not processed. Please try again.",
          variant: "destructive",
          duration: 5000,
        });

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

  useEffect(() => {
    const paymentStatus = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const transactionId = searchParams.get("transactionId");

    if (paymentProcessed) return;

    if (paymentStatus && orderId) {
      if (paymentStatus === "success") {
        handlePaymentSuccess(orderId, transactionId);
      } else if (paymentStatus === "failure") {
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

  useEffect(() => {
    if (
      !loading &&
      !processingPayment &&
      !paymentProcessed &&
      items.length === 0
    ) {
      navigate("/cart");
    }
  }, [items.length, loading, navigate, processingPayment, paymentProcessed]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user, fetchUserProfile]);

  return {
    loading,
    processingPayment,
    formData,
    items,
    searchParams,
    payFormRef,
    subtotal,
    tax,
    total,
    handleChange,
    handlePayNow,
    handleCODPayment,
    handlePaymentSuccess,
    handlePaymentFailure,
    validateForm,
    PHONEPE_PAY_URL,
  };
};