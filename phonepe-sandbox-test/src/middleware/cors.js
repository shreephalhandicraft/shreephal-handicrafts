const cors = require("cors");

class CorsMiddleware {
  // Basic CORS configuration
  basicCors() {
    const allowedOrigins = this.getAllowedOrigins();

    return cors({
      origin: (origin, callback) => {
        // 1. Allow mobile apps, Postman, and server-to-server (null origin)
        if (!origin) {
          console.log("🔓 Allowing request with no origin");
          return callback(null, true);
        }

        // 2. Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
          // console.log("✅ Allowed:", origin); // Uncomment for debugging
          callback(null, true);
        } else {
          console.warn(`❌ CORS Blocked: ${origin}`);
          
          // Optional: Allow all in development/testing if needed
          // return callback(null, true); 
          
          callback(new Error(`CORS not allowed for origin: ${origin}`));
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
      maxAge: 86400,
    });
  }

  // Production CORS (Use this for your main routes)
  productionCors() {
    return this.basicCors(); // Re-use the robust logic above
  }

  // Payment CORS (More permissive for callbacks)
  paymentCors() {
    return cors({
      origin: (origin, callback) => {
        // Payment gateways usually send no origin or specific domains
        if (!origin) return callback(null, true);

        const paymentDomains = [
          "phonepe.com",
          "mercury-uat.phonepe.com",
          ...this.getAllowedOrigins()
        ];

        // Allow if it matches our list OR if it is a subdomain of phonepe
        if (
          this.getAllowedOrigins().includes(origin) ||
          origin.includes("phonepe.com")
        ) {
          callback(null, true);
        } else {
          console.log(`💳 Allowing payment redirect from unknown: ${origin}`);
          callback(null, true); // Be permissive for payments to avoid failed transactions
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Verify", "X-Requested-With"],
      optionsSuccessStatus: 200
    });
  }

  // ✅ FIXED: Updated with correct URLs
  getAllowedOrigins() {
    const baseOrigins = [
           
      // ✅ YOUR OLD SPELLING (Keep just in case)
      "https://shrifal-handicrafts.netlify.app",
      "https://shrifal-handicrafts.onrender.com",

      // ✅ YOUR NEW SPELLING (The Fix)
      "https://shreephal-handicrafts.onrender.com",
      
      // ⚠️ IMPORTANT: ADD YOUR FRONTEND URL HERE IF IT CHANGED
      // "https://shreephal-handicrafts.netlify.app", 
    ];

    // Add env variables if they exist
    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim());
      return [...baseOrigins, ...envOrigins];
    }

    return baseOrigins;
  }

  handleCorsError(err, req, res, next) {
    if (err.message.includes("CORS")) {
      console.error("⛔ CORS ERROR CAUGHT:", err.message);
      return res.status(403).json({
        success: false,
        message: "CORS policy violation",
        error: err.message
      });
    }
    next(err);
  }
}

module.exports = new CorsMiddleware();
