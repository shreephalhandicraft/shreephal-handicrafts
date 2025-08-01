const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const path = require("path");

const config = require("./config/environment");
const errorHandler = require("./middleware/errorHandler");
const corsMiddleware = require("./middleware/cors");

// Route imports
const paymentRoutes = require("./routes/payment");
const orderRoutes = require("./routes/orders");
const productRoutes = require("./routes/products");
const userRoutes = require("./routes/users");
const uploadRoutes = require("./routes/upload");
const categoryRoutes = require("./routes/categories");
const httpsRedirect = require("./middleware/httpsRedirect");

const app = express();

// Trust proxy - CRITICAL for Render/Netlify deployments
app.set("trust proxy", true);

// ✅ FIXED: Apply different CORS for different routes
// Payment routes get special CORS treatment
app.use(
  ["/pay", "/redirect", "/callback", "/webhook"],
  corsMiddleware.paymentCors()
);

// Regular API routes get standard CORS
app.use("/api", corsMiddleware.basicCors());

// General CORS for other routes
app.use(corsMiddleware.basicCors());

app.use(httpsRedirect);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Strict rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many payment attempts, please try again later.",
});
app.use("/pay", paymentLimiter);
app.use("/api/orders", paymentLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression
app.use(compression());

// View engine for payment pages
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.get("/test", (req, res) => {
  res.render("test-payment");
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

// Payment routes (no /api prefix for PhonePe compatibility)
app.use("/", paymentRoutes);

// 404 handler
app.use("/*catchAll", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handler
app.use(errorHandler.handleErrors.bind(errorHandler));
// Add CORS error handler
app.use(corsMiddleware.handleCorsError);

module.exports = app;
