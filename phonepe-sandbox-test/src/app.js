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
app.set("trust proxy", true);

// 1. CORS
app.use(
  ["/pay", "/redirect", "/callback", "/webhook"],
  corsMiddleware.paymentCors()
);
app.use(corsMiddleware.basicCors());

// 2. HTTPS Redirect
app.use(httpsRedirect);

// 3. Security
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        formAction: ["'self'", "https://api-preprod.phonepe.com", "https://api.phonepe.com"],
      },
    },
  })
);

// 4. Body Parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Rate Limiting (FIXED CONFIG)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: "Too many payment attempts, please try again later.",
});

// Apply limiters
app.use("/api/", limiter);
app.use(["/pay", "/api/orders"], paymentLimiter);

// 6. View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// 7. Routes (FIXED HANDLERS)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

app.get("/test", (req, res) => {
  res.render("test-payment"); // Ensure 'test-payment.ejs' exists in views
});

// Payment Routes
app.use("/", paymentRoutes);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

// 8. Errors
// Use regex syntax to match everything for 404
app.use(/(.*)/, (req, res) => { 
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
});

app.use(errorHandler.handleErrors.bind(errorHandler));
app.use(corsMiddleware.handleCorsError);

module.exports = app;
