const cors = require("cors");

class CorsMiddleware {
  // Basic CORS configuration
  basicCors() {
    return cors({
      origin: (origin, callback) => {
        // 1. Allow mobile apps, Postman, and server-to-server (null origin)
        if (!origin) {
          console.log("🔓 CORS: Allowing request with no origin");
          return callback(null, true);
        }

        const allowedOrigins = this.getAllowedOrigins();

        // 2. Check if origin is allowed
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          // 🚨 DEBUGGING: Log the exact failing origin
          console.warn(`❌ CORS Blocked Origin: '${origin}'`);

          // ✅ TEMPORARY FIX: Allow EVERYTHING to unblock you right now
          // Once you see the log, you can add that specific URL to allowedOrigins
          console.log("⚠️ TEMPORARY: Allowing blocked origin for debugging");
          return callback(null, true);

          // callback(new Error("Not allowed by CORS")); // Commented out for now
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

  // Production CORS
  productionCors() {
    return this.basicCors();
  }

  // Payment CORS
  paymentCors() {
    return cors({
      origin: true, // ✅ Allow ALL origins for payment callbacks to be safe
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
    });
  }

  getAllowedOrigins() {
    const baseOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:3001",
      "https://Shreephal-Handicrafts.netlify.app",
      "https://Shreephal-Handicrafts.onrender.com",
      "https://shreephal-handicrafts.onrender.com",

      // Add your frontend URL here if it's different!
    ];

    if (process.env.ALLOWED_ORIGINS) {
      const envOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) =>
        o.trim()
      );
      return [...baseOrigins, ...envOrigins];
    }

    return baseOrigins;
  }

  handleCorsError(err, req, res, next) {
    if (err.message.includes("CORS")) {
      console.error("⛔ CORS ERROR CAUGHT:", err.message);
      return res.status(403).json({
        success: false,
        message: "Not allowed by CORS",
        timestamp: new Date().toISOString(),
      });
    }
    next(err);
  }
}

module.exports = new CorsMiddleware();
