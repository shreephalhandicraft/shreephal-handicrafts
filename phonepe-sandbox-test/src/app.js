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

// 1. CORS (Keep this first)
app.use(
  ["/pay", "/redirect", "/callback", "/webhook"],
  corsMiddleware.paymentCors()
);
app.use(corsMiddleware.basicCors()); // Default for everything else

// 2. HTTPS Redirect
app.use(httpsRedirect);

// 3. Security (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        // ✅ Allow form submissions to PhonePe
        formAction: ["'self'", "https://api-preprod.phonepe.com", "https://api.phonepe.com"],
      },
    },
  })
);

// 4. Body Parsing (Move up before Rate Limiting for logging purposes if needed)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 5. Rate Limiting
const limiter = rateLimit({ /* ... */ });
const paymentLimiter = rateLimit({ /* ... */ });

// Apply limiters
app.use("/api/", limiter);
app.use(["/pay", "/api/orders"], paymentLimiter);
// Note: Do NOT rate limit /callback or /redirect strongly, as they come from PhonePe/Users

// 6. View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// 7. Routes
app.get("/health", /* ... */);
app.get("/test", /* ... */);

// Payment Routes (Mount these first to avoid collisions)
app.use("/", paymentRoutes); 

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);

// 8. Errors
app.use("/*catchAll", /* ... */);
app.use(errorHandler.handleErrors.bind(errorHandler));
app.use(corsMiddleware.handleCorsError);

module.exports = app;