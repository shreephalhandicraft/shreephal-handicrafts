const express = require("express");
const router = express.Router();
const { supabaseAdmin } = require("../config/supabaseClient");

// Update the create order endpoint in orders.js:
router.post("/", async (req, res) => {
  try {
    console.log("=== CREATE ORDER ===");
    console.log("Request body:", req.body);

    const {
      customerInfo,
      items,
      shippingAddress,
      totalAmount,
      paymentMethod = "phonepe",
    } = req.body;

    // Validate required fields
    if (!customerInfo || !items || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: customerInfo, items, totalAmount",
      });
    }

    // Create order data matching your existing schema
    const orderData = {
      user_id: null, // Set this if you have user authentication
      customer_id: null, // Set this if you have a customers table
      items: JSON.stringify(items),
      status: "pending",
      total_price: parseInt(totalAmount), // Use total_price
      amount: parseInt(totalAmount), // Your table has both fields
      shipping_info: JSON.stringify({
        customer_name: customerInfo.name,
        customer_email: customerInfo.email,
        customer_phone: customerInfo.phone,
        address: shippingAddress || {}
      }),
      payment_method: paymentMethod,
      payment_status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("💾 Inserting order data:", orderData);

    // Insert into Supabase
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert([orderData])
      .select("*")
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create order",
        error: error.message,
      });
    }

    console.log("✅ Order created successfully:", order);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});


// Get order by ID
router.get("/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("=== GET ORDER ===");
    console.log("Order ID:", orderId);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(404).json({
        success: false,
        message: "Order not found",
        error: error.message,
      });
    }

    console.log("✅ Order found:", order);

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("❌ Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Update order status
router.put("/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, paymentStatus, transactionId, phonepeResponse } = req.body;

    console.log("=== UPDATE ORDER STATUS ===");
    console.log("Order ID:", orderId);
    console.log("New status:", status);
    console.log("Payment status:", paymentStatus);

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (paymentStatus) updateData.payment_status = paymentStatus;
    if (transactionId) updateData.transaction_id = transactionId;
    if (phonepeResponse)
      updateData.phonepe_response = JSON.stringify(phonepeResponse);

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select("*")
      .single();

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(404).json({
        success: false,
        message: "Order not found or update failed",
        error: error.message,
      });
    }

    console.log("✅ Order updated successfully:", order);

    res.json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    console.error("❌ Update order error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Get all orders (with pagination)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    console.log("=== GET ALL ORDERS ===");
    console.log("Page:", page, "Limit:", limit, "Status filter:", status);

    let query = supabaseAdmin
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error("❌ Database error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch orders",
        error: error.message,
      });
    }

    console.log(`✅ Found ${orders.length} orders`);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("❌ Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
