const express = require("express");
const PaymentController = require("../controllers/paymentController"); // Change to uppercase
const { body, validationResult } = require("express-validator");
// In src/routes/payment.js
const { optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Validation middleware for payment requests
const validatePaymentRequest = [
  body("orderId").notEmpty().withMessage("Order ID is required"),
  body("amount").isInt({ min: 100 }).withMessage("Amount must be at least ₹1"),
  body("customerEmail").isEmail().withMessage("Valid email is required"),
  body("customerPhone")
    .isMobilePhone("en-IN")
    .withMessage("Valid Indian phone number is required"),
  body("customerName").notEmpty().withMessage("Customer name is required"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }
    next();
  },
];

// Payment initiation
// Add auth middleware to payment routes
router.post(
  "/pay",
  optionalAuth,
  validatePaymentRequest,
  PaymentController.initiatePayment
);

// PhonePe redirect handler
router.post("/redirect", PaymentController.handleRedirect);

// PhonePe callback handler
router.post("/callback", PaymentController.handleCallback);

// Order completion page
router.get("/done", PaymentController.renderOrderComplete);

// Payment status check
router.get("/status/:transactionId", PaymentController.getPaymentStatus);

// Health check for payment system
router.get("/payment/health", PaymentController.getHealthStatus);

module.exports = router;
