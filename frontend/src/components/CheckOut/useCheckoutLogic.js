import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useStockReservation } from "@/hooks/useStockReservation";
import { calculateOrderTotals, calculateItemPricing, createItemSnapshot } from "@/utils/billingUtils";
import { initiateRazorpayPayment } from '@/utils/razorpayPaymentHandler';

// ✨ UX #2 FIX: Payment error message mapping
const PAYMENT_ERROR_MESSAGES = {
  // Insufficient funds
  INSUFFICIENT_FUNDS: {
    title: "Insufficient Balance",
    description: "Your account doesn't have enough balance to complete this payment. Please add funds to your account or try another payment method.",
    action: "Try another payment method or add funds to your account."
  },
  INSUFFICIENT_BALANCE: {
    title: "Insufficient Balance",
    description: "Your account doesn't have enough balance to complete this payment. Please add funds to your account or try another payment method.",
    action: "Try another payment method or add funds to your account."
  },
  
  // Payment declined
  PAYMENT_DECLINED: {
    title: "Payment Declined",
    description: "Your payment was declined by your bank. This could be due to daily transaction limits, security restrictions, or insufficient funds.",
    action: "Contact your bank for details or try another payment method."
  },
  TRANSACTION_DECLINED: {
    title: "Payment Declined",
    description: "Your payment was declined by your bank. This could be due to daily transaction limits, security restrictions, or insufficient funds.",
    action: "Contact your bank for details or try another payment method."
  },
  DECLINED: {
    title: "Payment Declined",
    description: "Your payment was declined by your bank. This could be due to daily transaction limits, security restrictions, or insufficient funds.",
    action: "Contact your bank for details or try another payment method."
  },
  
  // User cancelled
  USER_CANCELLED: {
    title: "Payment Cancelled",
    description: "You cancelled the payment. Your cart has been saved and you can retry anytime.",
    action: "You can proceed to checkout again when ready."
  },
  CANCELLED: {
    title: "Payment Cancelled",
    description: "You cancelled the payment. Your cart has been saved and you can retry anytime.",
    action: "You can proceed to checkout again when ready."
  },
  USER_CANCELED: { // Alternative spelling
    title: "Payment Cancelled",
    description: "You cancelled the payment. Your cart has been saved and you can retry anytime.",
    action: "You can proceed to checkout again when ready."
  },
  
  // Timeout errors
  TRANSACTION_TIMEOUT: {
    title: "Payment Timed Out",
    description: "Your payment request timed out. This could be due to network issues or bank server delays. Your money has NOT been deducted.",
    action: "Please check your bank statement and retry. If money was deducted, contact support."
  },
  TIMEOUT: {
    title: "Payment Timed Out",
    description: "Your payment request timed out. This could be due to network issues or bank server delays. Your money has NOT been deducted.",
    action: "Please check your bank statement and retry. If money was deducted, contact support."
  },
  GATEWAY_TIMEOUT: {
    title: "Payment Gateway Timeout",
    description: "Payment gateway did not respond in time. Your money has NOT been deducted.",
    action: "Please retry your payment. If issue persists, try again in a few minutes."
  },
  
  // Invalid card/details
  INVALID_CARD: {
    title: "Invalid Card Details",
    description: "The card details you entered are invalid. Please check your card number, expiry date, and CVV.",
    action: "Verify your card details and try again."
  },
  INVALID_CARD_NUMBER: {
    title: "Invalid Card Number",
    description: "The card number you entered is invalid. Please check and enter the correct card number.",
    action: "Verify your card number and try again."
  },
  INVALID_CVV: {
    title: "Invalid CVV",
    description: "The CVV/CVC number you entered is invalid. Please check the 3-4 digit code on the back of your card.",
    action: "Enter the correct CVV and try again."
  },
  CARD_EXPIRED: {
    title: "Card Expired",
    description: "Your card has expired. Please use a different card to complete your payment.",
    action: "Use a different card with a valid expiry date."
  },
  
  // Bank errors
  BANK_ERROR: {
    title: "Bank System Error",
    description: "Your bank's system encountered an error while processing your payment. This is not an issue with our system.",
    action: "Please wait a few minutes and retry, or contact your bank."
  },
  ISSUER_DOWN: {
    title: "Bank Server Unavailable",
    description: "Your bank's server is currently unavailable. This is a temporary issue.",
    action: "Please try again in a few minutes or use a different bank/card."
  },
  BANK_UNAVAILABLE: {
    title: "Bank Unavailable",
    description: "Your bank's payment service is currently unavailable. This is a temporary issue.",
    action: "Please try again later or use a different payment method."
  },
  
  // Generic payment error
  PAYMENT_ERROR: {
    title: "Payment Error",
    description: "An error occurred while processing your payment. Your money has NOT been deducted.",
    action: "Please try again. If the issue persists, try a different payment method."
  },
  PAYMENT_FAILED: {
    title: "Payment Failed",
    description: "Your payment could not be completed. Your money has NOT been deducted.",
    action: "Please try again or use a different payment method."
  },
  
  // Network errors
  NETWORK_ERROR: {
    title: "Network Error",
    description: "A network error occurred during payment. Your money has NOT been deducted.",
    action: "Please check your internet connection and try again."
  },
  CONNECTION_ERROR: {
    title: "Connection Error",
    description: "Unable to connect to payment gateway. Please check your internet connection.",
    action: "Retry with a stable internet connection."
  },
  
  // UPI specific errors
  UPI_PIN_INCORRECT: {
    title: "Incorrect UPI PIN",
    description: "The UPI PIN you entered is incorrect. Please try again with the correct PIN.",
    action: "Enter the correct UPI PIN. Be careful, multiple wrong attempts may lock your account."
  },
  UPI_COLLECT_REQUEST_REJECTED: {
    title: "UPI Request Rejected",
    description: "Your UPI collect request was rejected or expired.",
    action: "Please retry the payment and approve the request within the time limit."
  },
  VPA_NOT_FOUND: {
    title: "Invalid UPI ID",
    description: "The UPI ID you entered was not found. Please check and enter a valid UPI ID.",
    action: "Verify your UPI ID (e.g., name@bank) and try again."
  }
};

// ✨ UX #2 FIX: Parse payment error and return user-friendly message
const parsePaymentError = (errorMessage) => {
  if (!errorMessage) {
    return {
      title: "Payment Failed",
      description: "Your payment was not processed. Please try again.",
      action: "If the issue persists, try a different payment method or contact support."
    };
  }
  
  const upperMessage = errorMessage.toUpperCase();
  
  if (PAYMENT_ERROR_MESSAGES[upperMessage]) {
    return PAYMENT_ERROR_MESSAGES[upperMessage];
  }
  
  for (const [key, value] of Object.entries(PAYMENT_ERROR_MESSAGES)) {
    if (upperMessage.includes(key)) {
      return value;
    }
  }
  
  return {
    title: "Payment Failed",
    description: `Your payment could not be completed: ${errorMessage}. Your money has NOT been deducted.`,
    action: "Please try again or use a different payment method. If you need help, contact support with this error message."
  };
};

export const useCheckoutLogic = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, clearCart, getCartForCheckout } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const payFormRef = useRef(null);
  
  const { reserveStock, confirmMultipleReservations, getAvailableStock } = useStockReservation();

  // State
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [productGSTData, setProductGSTData] = useState({});
  const [gstDataLoaded, setGstDataLoaded] = useState(false);
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

  // Fetch product GST data when cart changes
  useEffect(() => {
    const fetchProductGSTData = async () => {
      const cartItems = getCartForCheckout();
      if (cartItems.length === 0) {
        setGstDataLoaded(true);
        return;
      }
      
      const productIds = [...new Set(cartItems.map(item => item.productId))];
      
      try {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('id, gst_5pct, gst_18pct')
          .in('id', productIds);
        
        if (error) {
          setGstDataLoaded(true);
          return;
        }
        
        const gstDataMap = {};
        productsData.forEach(p => {
          gstDataMap[p.id] = {
            gst_5pct: p.gst_5pct || false,
            gst_18pct: p.gst_18pct || false
          };
        });
        
        setProductGSTData(gstDataMap);
        setGstDataLoaded(true);
      } catch (error) {
        setGstDataLoaded(true);
      }
    };
    
    fetchProductGSTData();
  }, [items.length, getCartForCheckout]);

  // Calculate totals with enriched cart items
  const { enrichedCartItems, orderTotals, subtotal, tax, total } = useMemo(() => {
    const cartItems = getCartForCheckout();
    
    if (!gstDataLoaded && cartItems.length > 0) {
      return {
        enrichedCartItems: [],
        orderTotals: { subtotal: 0, gst5Total: 0, gst18Total: 0, totalGST: 0, grandTotal: 0 },
        subtotal: 0,
        tax: 0,
        total: 0
      };
    }
    
    const enrichedItems = cartItems.map(item => ({
      ...item,
      gst_5pct: productGSTData[item.productId]?.gst_5pct || false,
      gst_18pct: productGSTData[item.productId]?.gst_18pct || false
    }));
    
    const totals = calculateOrderTotals(enrichedItems);
    
    return {
      enrichedCartItems: enrichedItems,
      orderTotals: totals,
      subtotal: totals.subtotal,
      tax: totals.totalGST,
      total: totals.grandTotal
    };
  }, [getCartForCheckout, productGSTData, gstDataLoaded]);

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
      
      toast({
        title: "Cart Validation Failed",
        description: `Some items are missing size selection: ${itemNames}. Please remove and re-add these items with proper size selection.`,
        variant: "destructive",
        duration: 8000,
      });
      
      return false;
    }
    
    return true;
  }, [getCartForCheckout, toast]);

  // Stock re-validation before checkout
  const validateStockAvailability = useCallback(async () => {
    const cartItems = getCartForCheckout();
    const stockIssues = [];
    
    for (const item of cartItems) {
      if (!item.variantId) {
        stockIssues.push({
          item: item.name,
          issue: 'Missing variant ID',
        });
        continue;
      }
      
      try {
        const availableStock = await getAvailableStock(item.variantId);
        
        if (availableStock < item.quantity) {
          stockIssues.push({
            item: item.name,
            requested: item.quantity,
            available: availableStock,
            issue: availableStock === 0 ? 'Out of stock' : 'Insufficient stock',
          });
        }
      } catch (error) {
        stockIssues.push({
          item: item.name,
          issue: 'Could not verify stock availability',
        });
      }
    }
    
    if (stockIssues.length > 0) {
      const issueMessages = stockIssues.map(issue => {
        if (issue.issue === 'Out of stock') {
          return `• ${issue.item}: Out of stock`;
        } else if (issue.issue === 'Insufficient stock') {
          return `• ${issue.item}: Only ${issue.available} available (you have ${issue.requested} in cart)`;
        } else {
          return `• ${issue.item}: ${issue.issue}`;
        }
      });
      
      const descriptionText = `Some items in your cart are no longer available:\n\n${issueMessages.join('\n')}\n\nPlease update your cart and try again.`;
      
      toast({
        title: "Stock Unavailable",
        description: descriptionText,
        variant: "destructive",
        duration: 10000,
      });
      
      return false;
    }
    
    return true;
  }, [getCartForCheckout, getAvailableStock, toast]);

  // Validate GST data is loaded
  const validateGSTData = useCallback(() => {
    if (!gstDataLoaded) {
      toast({
        title: "Loading...",
        description: "Please wait while we load product information.",
        variant: "default",
      });
      return false;
    }
    
    const cartItems = getCartForCheckout();
    const missingGSTData = cartItems.filter(item => !productGSTData[item.productId]);
    
    if (missingGSTData.length > 0) {
      toast({
        title: "Data Loading Error",
        description: "Some product information is missing. Please refresh the page and try again.",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  }, [gstDataLoaded, getCartForCheckout, productGSTData, toast]);

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

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const isRetryableError = (error, statusCode) => {
    if (statusCode && statusCode >= 400 && statusCode < 500) {
      return false;
    }
    
    const retryableMessages = [
      'network',
      'timeout',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      '5',
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return retryableMessages.some(msg => errorMessage.includes(msg));
  };

  const uploadCustomizationImage = useCallback(async (file, itemName) => {
    const maxRetries = 3;
    const baseDelay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
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
          
          if (attempt < maxRetries && isRetryableError(new Error(errorMessage), statusCode)) {
            const delayMs = baseDelay * Math.pow(2, attempt - 1);
            await delay(delayMs);
            continue;
          }
          
          throw new Error(errorMessage);
        }
        
        const cloudinaryData = await cloudinaryResponse.json();
        
        return {
          url: cloudinaryData.secure_url,
          public_id: cloudinaryData.public_id,
          format: cloudinaryData.format,
          width: cloudinaryData.width,
          height: cloudinaryData.height,
          bytes: cloudinaryData.bytes
        };
        
      } catch (error) {
        if (attempt < maxRetries && isRetryableError(error, null)) {
          const delayMs = baseDelay * Math.pow(2, attempt - 1);
          await delay(delayMs);
          continue;
        }
        
        throw new Error(`Failed to upload customization image for ${itemName}: ${error.message}`);
      }
    }
    
    throw new Error(`Failed to upload customization image for ${itemName} after ${maxRetries} attempts`);
  }, []);

  const createOrder = useCallback(
    async (paymentMethod = "PayNow") => {
      try {
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
        
        // Fetch fresh GST data from database
        const productIds = [...new Set(cartItems.map(item => item.productId))];
        
        const { data: freshGSTData, error: gstError } = await supabase
          .from('products')
          .select('id, gst_5pct, gst_18pct, title, catalog_number, price')
          .in('id', productIds);
        
        if (gstError) {
          throw new Error('Failed to load product tax information. Please try again.');
        }
        
        const gstDataMap = {};
        freshGSTData.forEach(p => {
          gstDataMap[p.id] = p;
        });
        
        // Enrich cart items with fresh GST data
        const enrichedItems = cartItems.map(item => ({
          ...item,
          gst_5pct: gstDataMap[item.productId]?.gst_5pct || false,
          gst_18pct: gstDataMap[item.productId]?.gst_18pct || false
        }));

        const itemsWithoutVariant = enrichedItems.filter(item => !item.variantId);
        if (itemsWithoutVariant.length > 0) {
          throw new Error(
            `Some items are missing size selection. Please remove and re-add these items: ${itemsWithoutVariant.map(i => i.name).join(", ")}`
          );
        }

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

        // Calculate totals from enriched items with fresh GST data
        const shippingCost = 0;
        const recalculatedTotals = calculateOrderTotals(enrichedItems, shippingCost);
        
        const customizationDetails = createCustomizationDetails(enrichedItems);

        const variantIds = enrichedItems.map(item => item.variantId);
        
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, size_display, sku')
          .in('id', variantIds);

        const variantDataMap = {};
        
        if (variantsData) {
          variantsData.forEach(v => {
            variantDataMap[v.id] = v;
          });
        }

        // Map "razorpay" to "PayNow" for database compatibility
        const dbPaymentMethod = paymentMethod === "razorpay" ? "PayNow" : paymentMethod;

        const orderData = {
          user_id: authUser.id,
          customer_id: customer.id,
          
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
          
          subtotal: recalculatedTotals.subtotal,
          total_gst: recalculatedTotals.totalGST,
          gst_5_total: recalculatedTotals.gst5Total,
          gst_18_total: recalculatedTotals.gst18Total,
          shipping_cost: shippingCost,
          grand_total: recalculatedTotals.grandTotal,
          order_total: recalculatedTotals.grandTotal,
          
          status: "pending",
          payment_status: "pending",
          payment_method: dbPaymentMethod,
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
          throw new Error(`Database error: ${orderError.message}`);
        }

        const processedCartItems = [];
        
        for (const item of enrichedItems) {
          let customizationData = item.customization && Object.keys(item.customization).length > 0 
            ? { ...item.customization } 
            : null;
          
          if (customizationData?.uploadedImage && customizationData.uploadedImage instanceof File) {
            try {
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
        
        const orderItemsData = processedCartItems.map(item => {
          const productData = gstDataMap[item.productId] || {};
          const variantData = variantDataMap[item.variantId] || {};
          const pricing = calculateItemPricing(item, productData);
          
          return {
            order_id: order.id,
            product_id: item.productId,
            variant_id: item.variantId,
            
            product_name: item.name || productData.title || 'Unknown Product',
            product_catalog_number: productData.catalog_number || null,
            variant_size_display: item.variant || variantData.size_display || 'Unknown Size',
            variant_sku: variantData.sku || null,
            
            quantity: pricing.quantity,
            
            base_price: pricing.basePrice,
            gst_rate: pricing.gstRate,
            gst_amount: pricing.gstAmount,
            unit_price_with_gst: pricing.unitPriceWithGST,
            item_subtotal: pricing.itemSubtotal,
            item_gst_total: pricing.itemGSTTotal,
            item_total: pricing.itemTotal,
            
            customization_data: item.processedCustomization
          };
        });

        const { data: insertedItems, error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData)
          .select('*');

        if (itemsError) {
          await supabase.from('orders').delete().eq('id', order.id);
          throw new Error(
            `Failed to create order items: ${itemsError.message}. Order cancelled.`
          );
        }

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
          }
        }

        if (customizationRequests.length > 0) {
          await supabase
            .from('customization_requests')
            .insert(customizationRequests)
            .select('*');
        }

        const stockReservations = [];
        
        try {
          for (const item of processedCartItems) {
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
          }

          const reservationIds = stockReservations.map(r => r.reservationId);
          await confirmMultipleReservations(reservationIds);

        } catch (error) {
          await supabase.from('customization_requests').delete().eq('order_id', order.id);
          await supabase.from('order_items').delete().eq('order_id', order.id);
          await supabase.from('orders').delete().eq('id', order.id);
          
          let userMessage = error.message;
          if (error.message.includes('Insufficient stock')) {
            userMessage = `Stock unavailable: ${error.message}`;
          } else if (error.message.includes('Reserved stock')) {
            userMessage = 'Items currently in other carts. Please try again in a few minutes.';
          }
          
          throw new Error(userMessage);
        }
        
        return order;
      } catch (error) {
        throw error;
      }
    },
    [
      user?.id, 
      formData, 
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
  if (!validateCartItems()) return;
  if (!validateGSTData()) return;
  
  const stockAvailable = await validateStockAvailability();
  if (!stockAvailable) return;

  setProcessingPayment(true);

  try {
    const order = await createOrder("razorpay");

    const orderTotal = order.order_total || order.grand_total;

    await initiateRazorpayPayment({
      orderId: order.id,
      amount: orderTotal,
      customerName: `${formData.firstName} ${formData.lastName}`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      
      onSuccess: async (paymentData) => {
        try {
          const cartCleared = await clearCart();
          
          if (!cartCleared) {
            toast({
              title: "Payment Successful - Cart Warning",
              description: "Payment completed but cart clear failed. Please manually clear your cart.",
              variant: "default",
              duration: 8000,
            });
          }

          toast({
            title: "Payment Successful! 🎉",
            description: `Order #${order.id.slice(0, 8)} has been confirmed. Redirecting...`,
            duration: 3000,
          });

          setTimeout(() => {
            navigate(`/order/${order.id}`, { replace: true });
          }, 2000);

        } catch (error) {
          toast({
            title: "Payment Successful",
            description: "Your payment was successful. Redirecting to order page...",
            duration: 3000,
          });
          
          setTimeout(() => {
            navigate(`/order/${order.id}`, { replace: true });
          }, 2000);
        }
      },
      
      onFailure: async (errorData) => {
        try {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'cancelled',
              order_notes: errorData.error || 'Payment failed',
            })
            .eq('id', order.id);

          toast({
            title: "Payment Failed",
            description: errorData.error || "Payment could not be completed. Please try again.",
            variant: "destructive",
            duration: 8000,
          });
        } catch (dbError) {
          // Silent error - order status update failed
        }
        
        setProcessingPayment(false);
      },
    });

  } catch (error) {
    toast({
      title: "Payment Error",
      description: error.message || "Failed to initiate payment. Please try again.",
      variant: "destructive",
    });
    
    setProcessingPayment(false);
  }
}, [
  validateForm, 
  validateCartItems, 
  validateGSTData, 
  validateStockAvailability, 
  formData, 
  total,
  createOrder, 
  clearCart,
  toast, 
  navigate,
  supabase
  ]);
  
  const handleCODPayment = useCallback(async () => {
    if (!validateForm()) return;
    if (!validateCartItems()) return;
    if (!validateGSTData()) return;
    
    const stockAvailable = await validateStockAvailability();
    if (!stockAvailable) return;

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

      const orderTotal = order.order_total || order.grand_total;
      toast({
        title: "Order Placed Successfully!",
        description: `Order #${order.id.slice(
          0,
          8
        )} has been placed. You'll pay ₹${orderTotal.toFixed(2)} on delivery.`,
      });

      navigate(`/order/${order.id}`);
    } catch (error) {
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  }, [validateForm, validateCartItems, validateGSTData, validateStockAvailability, createOrder, clearCart, toast, navigate]);

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

        const parsedError = parsePaymentError(message);

        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
            status: "cancelled",
            order_notes: message || "Payment failed",
          })
          .eq("id", orderId);

        toast({
          title: parsedError.title,
          description: parsedError.action
            ? `${parsedError.description}\n👉 ${parsedError.action}`
            : parsedError.description,
          variant: "destructive",
          duration: 8000,
        });

        setTimeout(() => {
          setProcessingPayment(false);
        }, 1000);
      } catch (error) {
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
    loading: loading || !gstDataLoaded,
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
  };
};