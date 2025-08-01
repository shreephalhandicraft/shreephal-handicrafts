const cors = require("cors");

class CorsMiddleware {
  // Basic CORS configuration
  basicCors() {
    const allowedOrigins = this.getAllowedOrigins();

    return cors({
      origin: (origin, callback) => {
        // ✅ CRITICAL FIX: Always allow requests with no origin
        // This includes PhonePe redirects, mobile apps, Postman, etc.
        if (!origin) {
          console.log(
            "🔓 Allowing request with null origin (payment gateway/mobile app)"
          );
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          console.log("✅ Allowing request from:", origin);
          callback(null, true);
        } else {
          console.warn("❌ CORS blocked request from:", origin);
          // ✅ TEMPORARY: Be more lenient during development
          if (process.env.NODE_ENV !== "production") {
            console.log("🔧 Development mode: Allowing blocked origin");
            return callback(null, true);
          }
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
        "X-Verify",
      ],
      exposedHeaders: ["X-Total-Count", "X-RateLimit-Remaining"],
      maxAge: 86400, // 24 hours
    });
  }

  // Production CORS with payment gateway support
  productionCors() {
    const allowedOrigins = this.getAllowedOrigins();

    return cors({
      origin: (origin, callback) => {
        // ✅ FIXED: Always allow null origin for payment gateways
        if (!origin) {
          console.log(
            "🔓 Allowing null origin request (payment gateway or server-to-server)"
          );
          return callback(null, true);
        }

        // Check against allowed origins
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.error("CORS violation attempt", {
            origin,
            timestamp: new Date().toISOString(),
            allowedOrigins,
          });
          callback(new Error("CORS policy violation"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-API-Key",
        "X-Verify",
        "X-Requested-With",
      ],
      optionsSuccessStatus: 200,
      maxAge: 3600, // 1 hour
    });
  }

  // ✅ NEW: Specific CORS for payment routes
  paymentCors() {
    return cors({
      origin: (origin, callback) => {
        // Always allow payment gateway redirects (they often have null origin)
        if (!origin) {
          console.log("💳 Allowing payment gateway redirect");
          return callback(null, true);
        }

        // Allow PhonePe domains
        const paymentOrigins = [
          "https://mercury-uat.phonepe.com",
          "https://mercury.phonepe.com",
          "https://api.phonepe.com",
          "https://api-preprod.phonepe.com",
          ...this.getAllowedOrigins(),
        ];

        if (paymentOrigins.some((allowed) => origin.startsWith(allowed))) {
          callback(null, true);
        } else {
          console.log("🔓 Allowing payment request from:", origin);
          // Be more lenient for payment routes
          callback(null, true);
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-API-Key",
        "X-Verify",
      ],
      optionsSuccessStatus: 200,
      maxAge: 300, // 5 minutes for payment routes
    });
  }

  getAllowedOrigins() {
    const baseOrigins = [
      `http://localhost:3000`,
      `http://localhost:5173`,
      `http://localhost:3001`,
      `https://shrifal-handicrafts.netlify.app`,
      `https://shrifal-handicrafts.onrender.com`,
    ];

    // Add custom origins from environment
    if (process.env.ALLOWED_ORIGINS) {
      return baseOrigins.concat(
        process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
      );
    }

    if (process.env.NODE_ENV === "production") {
      return [...baseOrigins, `https://shrifal-handicrafts.onrender.com`];
    }

    return baseOrigins;
  }

  // CORS error handler
  handleCorsError(err, req, res, next) {
    if (err.message.includes("CORS")) {
      console.warn("CORS error", {
        origin: req.get("origin"),
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      return res.status(403).json({
        success: false,
        message: "CORS policy violation",
        timestamp: new Date().toISOString(),
      });
    }
    next(err);
  }
}

module.exports = new CorsMiddleware();
