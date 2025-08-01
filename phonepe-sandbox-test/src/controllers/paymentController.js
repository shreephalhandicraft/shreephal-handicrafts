const axios = require("axios");
const crypto = require("crypto");

class PaymentController {
  static async initiatePayment(req, res) {
    console.log("=== REAL PHONEPE PAYMENT INITIATION ===");
    console.log("Method:", req.method);
    console.log("Body:", req.body);

    try {
      const { orderId, amount, customerEmail, customerPhone, customerName } =
        req.body;

      // Validation
      if (
        !orderId ||
        !amount ||
        !customerEmail ||
        !customerPhone ||
        !customerName
      ) {
        console.log("❌ Validation failed - missing fields");
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
          received: req.body,
        });
      }

      console.log("✅ Validation passed");
      // INDUSTRY STANDARD: Dynamic URL generation
      const getBaseUrl = (req) => {
        const protocol =
          req.secure || req.headers["x-forwarded-proto"] === "https"
            ? "https"
            : "http";
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        return `${protocol}://${host}`;
      };

      const baseUrl = getBaseUrl(req);
      const redirectUrl = `${baseUrl}/redirect`;
      const callbackUrl = `${baseUrl}/callback`;

      console.log("🔗 Generated URLs:", { redirectUrl, callbackUrl });
      // *** STEP 1: FIND EXISTING ORDER (don't create new one) ***
      try {
        const { supabaseAdmin } = require("../config/supabaseClient");

        console.log("🔍 Looking up existing order in database...");

        // Find the order that was created by frontend
        const { data: existingOrder, error: findError } = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (findError || !existingOrder) {
          console.error("❌ Order not found:", findError);
          return res.status(404).json({
            success: false,
            message: "Order not found. Please try again.",
            error: findError?.message,
          });
        }

        console.log("✅ Found existing order:", existingOrder);

        // Update order status to indicate payment initiation
        const { data: updatedOrder, error: updateError } = await supabaseAdmin
          .from("orders")
          .update({
            payment_method: "phonepe",
            payment_status: "initiated", // New status to track payment initiation
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId)
          .select("*")
          .single();

        if (updateError) {
          console.error("❌ Order update failed:", updateError);
          return res.status(500).json({
            success: false,
            message: "Failed to update order",
            error: updateError.message,
          });
        }

        console.log("✅ Order updated for payment initiation:", updatedOrder);
      } catch (dbError) {
        console.error("❌ Database error:", dbError);
        return res.status(500).json({
          success: false,
          message: "Database connection failed",
          error: dbError.message,
        });
      }

      // *** STEP 2: Proceed with PhonePe payment (same as before) ***
      console.log("🔄 Preparing PhonePe API call...");

      // PhonePe configuration
      const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT86";
      const SALT_KEY =
        process.env.PHONEPE_SALT_KEY || "96434309-7796-489d-8924-ab56988a6076";
      const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
      const BASE_URL =
        process.env.PHONEPE_BASE_URL ||
        "https://api-preprod.phonepe.com/apis/pg-sandbox";

      // // Generate callback and redirect URLs
      // const redirectUrl = `${req.protocol}://${req.get("host")}/redirect`;
      // const callbackUrl = `${req.protocol}://${req.get("host")}/callback`;

      console.log("🔗 URLs:", { redirectUrl, callbackUrl });

      // Create payment payload
      const paymentPayload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: orderId,
        merchantUserId: `USER_${Date.now()}`,
        amount: parseInt(amount),
        redirectUrl: redirectUrl,
        redirectMode: "POST",
        callbackUrl: callbackUrl,
        mobileNumber: customerPhone.replace(/\D/g, "").slice(-10),
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      console.log(
        "📋 Payment Payload:",
        JSON.stringify(paymentPayload, null, 2)
      );

      // Convert to base64
      const base64Payload = Buffer.from(
        JSON.stringify(paymentPayload)
      ).toString("base64");

      // Generate checksum
      const checksumString = base64Payload + "/pg/v1/pay" + SALT_KEY;
      const sha256Hash = crypto
        .createHash("sha256")
        .update(checksumString)
        .digest("hex");
      const checksum = sha256Hash + "###" + SALT_INDEX;

      // Prepare request data
      const requestData = { request: base64Payload };
      const headers = {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        accept: "application/json",
      };

      console.log("📤 Making API call to PhonePe...");

      // Make API call to PhonePe
      const response = await axios.post(`${BASE_URL}/pg/v1/pay`, requestData, {
        headers,
        timeout: 30000,
        validateStatus: function (status) {
          return status < 500;
        },
      });

      console.log("📥 PhonePe Response Status:", response.status);
      console.log(
        "📥 PhonePe Response Data:",
        JSON.stringify(response.data, null, 2)
      );

      // Handle response
      if (
        response.data.success &&
        response.data.data?.instrumentResponse?.redirectInfo?.url
      ) {
        const redirectUrl =
          response.data.data.instrumentResponse.redirectInfo.url;

        console.log("✅ PhonePe payment initiated successfully");
        console.log("🔗 Redirect URL:", redirectUrl);

        return res.redirect(redirectUrl);
      } else {
        console.log("❌ PhonePe initiation failed");

        // Update order status to failed
        try {
          const { supabaseAdmin } = require("../config/supabaseClient");
          await supabaseAdmin
            .from("orders")
            .update({
              status: "failed",
              payment_status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        } catch (updateError) {
          console.error("Failed to update order status:", updateError);
        }

        return res.status(400).json({
          success: false,
          message: "Payment gateway error",
          details: response.data.message || "Unable to process payment",
          phonepeResponse: response.data,
        });
      }
    } catch (error) {
      console.error("❌ Payment initiation error:", error.message);

      if (error.response) {
        console.error("PhonePe API Error Response:", {
          status: error.response.status,
          data: error.response.data,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Payment initiation failed",
        error: error.message,
      });
    }
  }

  static async handleRedirect(req, res) {
    console.log("=== PHONEPE REDIRECT HANDLER ===");
    console.log("Request body:", req.body);

    try {
      const { code, merchantId, transactionId, providerReferenceId, amount } =
        req.body;

      if (!transactionId) {
        console.error("❌ Missing transaction ID in redirect");
        return res.status(400).render("payment-failed", {
          error: "Invalid payment response",
          details: "Transaction ID missing",
          orderId: "N/A",
        });
      }

      const orderId = transactionId;
      const phonepeTransactionId = providerReferenceId;

      // Determine payment status
      let paymentStatus = "failed";
      let orderStatus = "failed";
      let success = false;

      if (code === "PAYMENT_SUCCESS") {
        paymentStatus = "completed";
        orderStatus = "confirmed";
        success = true;
        console.log("✅ Payment successful");
      } else {
        console.log("❌ Payment failed with code:", code);
      }

      // *** UPDATE DATABASE ***
      try {
        const { supabaseAdmin } = require("../config/supabaseClient");

        console.log("💾 Updating order in database...");
        console.log("Order ID to update:", orderId);

        const updateData = {
          status: orderStatus,
          payment_status: paymentStatus,
          transaction_id: phonepeTransactionId || "",
          upi_reference: providerReferenceId || "",
          updated_at: new Date().toISOString(),
        };

        console.log("📋 Update data:", updateData);

        const { data: updatedOrder, error: updateError } = await supabaseAdmin
          .from("orders")
          .update(updateData)
          .eq("id", orderId)
          .select("*");

        if (updateError) {
          console.error("❌ Database update failed:", updateError);
        } else if (updatedOrder && updatedOrder.length > 0) {
          console.log("✅ Database updated successfully:", updatedOrder[0]);

          // Insert payment record for tracking
          if (paymentStatus === "completed") {
            const { error: paymentError } = await supabaseAdmin
              .from("payments")
              .insert([
                {
                  order_id: orderId,
                  phonepe_txn_id: phonepeTransactionId,
                  status: paymentStatus,
                  amount: parseInt(amount) || updatedOrder[0].total_price,
                  phonepe_response: JSON.stringify(req.body),
                  created_at: new Date().toISOString(),
                },
              ]);

            if (paymentError) {
              console.error("❌ Payment record insertion failed:", paymentError);
            } else {
              console.log("✅ Payment record inserted");
            }
          }
        } else {
          console.warn("⚠️ No order found with ID:", orderId);
        }
      } catch (dbError) {
        console.error("❌ Database error in redirect handler:", dbError);
      }

      // ✅ FIXED: Redirect to frontend instead of rendering template
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      
      if (success) {
        // Redirect to checkout with success parameters
        const redirectUrl = `${frontendUrl}/checkout?status=success&orderId=${orderId}&transactionId=${phonepeTransactionId || ''}`;
        console.log("🔗 Redirecting to frontend with success:", redirectUrl);
        return res.redirect(redirectUrl);
      } else {
        // Redirect to checkout with failure parameters
        const redirectUrl = `${frontendUrl}/checkout?status=failure&orderId=${orderId}&message=${encodeURIComponent('Payment failed')}`;
        console.log("🔗 Redirecting to frontend with failure:", redirectUrl);
        return res.redirect(redirectUrl);
      }

    } catch (error) {
      console.error("❌ Redirect handler error:", error);
      
      // Redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const redirectUrl = `${frontendUrl}/checkout?status=failure&message=${encodeURIComponent('Payment processing error')}`;
      return res.redirect(redirectUrl);
    }
  }

  // ✅ ADDED: Alternative method that renders template for debugging
  static async handleRedirectWithTemplate(req, res) {
    console.log("=== PHONEPE REDIRECT HANDLER (Template Version) ===");
    console.log("Request body:", req.body);

    try {
      const { code, merchantId, transactionId, providerReferenceId, amount } =
        req.body;

      if (!transactionId) {
        console.error("❌ Missing transaction ID in redirect");
        return res.status(400).render("payment-failed", {
          error: "Invalid payment response",
          details: "Transaction ID missing",
          orderId: "N/A",
        });
      }

      const orderId = transactionId;
      const phonepeTransactionId = providerReferenceId;
      let success = code === "PAYMENT_SUCCESS";

      // Update database (same as above)
      // ... database update logic ...

      // Render payment result page with redirect script
      return res.render("payment-success", {
        success: success,
        orderId: orderId,
        transactionId: phonepeTransactionId,
        frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
        amount: amount || "N/A",
        paymentStatus: success ? "completed" : "failed",
        // ✅ ADDED: Auto-redirect parameters
        redirectToCheckout: true,
        redirectUrl: success 
          ? `/checkout?status=success&orderId=${orderId}&transactionId=${phonepeTransactionId || ''}`
          : `/checkout?status=failure&orderId=${orderId}&message=${encodeURIComponent('Payment failed')}`
      });
    } catch (error) {
      console.error("❌ Redirect handler error:", error);
      return res.status(500).render("payment-failed", {
        error: "Payment processing error",
        details: "Please contact support if payment was deducted",
        orderId: req.body.transactionId || "N/A",
      });
    }
  }


  static async handleCallback(req, res) {
    console.log("=== PHONEPE CALLBACK HANDLER ===");
    console.log("Request body:", req.body);

    try {
      const { code, transactionId, providerReferenceId } = req.body;

      if (!transactionId) {
        console.error("❌ Missing transaction ID in callback");
        return res.status(400).json({
          success: false,
          message: "Transaction ID missing",
        });
      }

      const orderId = transactionId;
      const phonepeTransactionId = providerReferenceId;

      // Determine status
      let paymentStatus = "failed";
      let orderStatus = "failed";

      if (code === "PAYMENT_SUCCESS") {
        paymentStatus = "completed";
        orderStatus = "confirmed";
        console.log("✅ Callback: Payment successful");
      } else if (code === "PAYMENT_PENDING" || code === "PAYMENT_INITIATED") {
        paymentStatus = "pending";
        orderStatus = "pending";
        console.log("⏳ Callback: Payment pending");
      } else {
        console.log("❌ Callback: Payment failed");
      }

      // In a real application, update database here
      console.log("💾 Would update database via callback:", {
        orderId,
        status: orderStatus,
        payment_status: paymentStatus,
        transaction_id: phonepeTransactionId,
      });

      console.log("✅ Callback processed successfully");

      res.status(200).json({
        success: true,
        message: "Callback processed successfully",
      });
    } catch (error) {
      console.error("❌ Callback handler error:", error);
      res.status(500).json({
        success: false,
        message: "Callback processing failed",
      });
    }
  }

  static async renderOrderComplete(req, res) {
    console.log("=== ORDER COMPLETE PAGE ===");
    console.log("Query params:", req.query);

    try {
      const { orderId, status } = req.query;

      // Mock order data for now
      const mockOrder = {
        id: orderId || "test-order-123",
        status: status || "completed",
        payment_status: "completed",
        total_price: 1000,
        created_at: new Date().toISOString(),
      };

      const frontendOrderUrl = `${
        process.env.FRONTEND_URL || "http://localhost:5173"
      }/order/${orderId}`;

      res.render("order-complete", {
        order: mockOrder,
        frontendUrl: frontendOrderUrl,
        success: true,
      });
    } catch (error) {
      console.error("❌ Order complete error:", error);
      res.status(500).render("payment-failed", {
        error: "Unable to load order details",
        details: "Please check your order status in your account",
        orderId: req.query.orderId || "N/A",
      });
    }
  }

  static async getPaymentStatus(req, res) {
    console.log("=== PAYMENT STATUS CHECK ===");
    console.log("Transaction ID:", req.params.transactionId);

    try {
      const { transactionId } = req.params;

      // PhonePe configuration
      const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT86";
      const SALT_KEY =
        process.env.PHONEPE_SALT_KEY || "96434309-7796-489d-8924-ab56988a6076";
      const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";
      const BASE_URL =
        process.env.PHONEPE_BASE_URL ||
        "https://api-preprod.phonepe.com/apis/pg-sandbox";

      // Generate checksum for status check
      const checksumString =
        `/pg/v1/status/${MERCHANT_ID}/${transactionId}` + SALT_KEY;
      const sha256Hash = crypto
        .createHash("sha256")
        .update(checksumString)
        .digest("hex");
      const checksum = sha256Hash + "###" + SALT_INDEX;

      const headers = {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": MERCHANT_ID,
        accept: "application/json",
      };

      const url = `${BASE_URL}/pg/v1/status/${MERCHANT_ID}/${transactionId}`;

      console.log("📤 Checking status with PhonePe API:", url);

      const response = await axios.get(url, {
        headers,
        timeout: 15000,
        validateStatus: function (status) {
          return status < 500;
        },
      });

      console.log("📥 PhonePe Status Response:", response.data);

      res.json({
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Status check error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch payment status",
        details: error.response?.data || error.message,
      });
    }
  }

  static getHealthStatus(req, res) {
    try {
      const config = {
        merchantId: process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT86",
        baseUrl:
          process.env.PHONEPE_BASE_URL ||
          "https://api-preprod.phonepe.com/apis/pg-sandbox",
        configured: !!(
          process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY
        ),
      };

      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        phonepe: config,
      });
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({
        status: "ERROR",
        message: "Health check failed",
        error: error.message,
      });
    }
  }
}

module.exports = PaymentController;
