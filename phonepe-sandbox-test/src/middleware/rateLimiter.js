const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const router = express.Router();
// const { createClient } = require("redis");
const logger = require("../utils/logger");
const config = require("../config/environment");

class RateLimiterMiddleware {
  constructor() {
    // Initialize Redis client for rate limiting
    this.redisClient = null;
    this.initRedis();
  }

  async initRedis() {
    try {
      router.use(rateLimiter.uploadLimiter());
    } catch (error) {
      console.log("Rate limiter error:", error);
      console.log("Rate limiter not available, skipping...");
    }
  }

  // Create store based on Redis availability
  createStore() {
    if (this.redisClient) {
      return new RedisStore({
        client: this.redisClient,
        prefix: "rl:",
      });
    }
    return null; // Use default memory store
  }

  // General API rate limiter
  generalLimiter() {
    return rateLimit({
      store: this.createStore(),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
        retryAfter: "15 minutes",
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        logger.warn("Rate limit exceeded", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          endpoint: req.path,
        });

        res.status(429).json({
          success: false,
          message: "Too many requests, please slow down",
          retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        });
      },
    });
  }

  // Payment specific rate limiter (more restrictive)
  paymentLimiter() {
    return rateLimit({
      store: this.createStore(),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 payment attempts per window per IP
      message: {
        success: false,
        message: "Too many payment attempts. Please wait before trying again.",
        retryAfter: "15 minutes",
      },
      skip: (req) => {
        // Skip rate limiting for admin users
        return req.user && req.user.isAdmin;
      },
      keyGenerator: (req) => {
        // Use IP + user ID if authenticated, otherwise just IP
        if (req.user) {
          return `${req.ip}-${req.user.id}`;
        }
        return req.ip;
      },
      handler: (req, res) => {
        logger.warn("Payment rate limit exceeded", {
          ip: req.ip,
          userId: req.user?.id,
          userAgent: req.get("User-Agent"),
        });

        res.status(429).json({
          success: false,
          message:
            "Too many payment attempts detected. Please wait 15 minutes before trying again.",
          retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        });
      },
    });
  }

  // Authentication rate limiter
  authLimiter() {
    return rateLimit({
      store: this.createStore(),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 login attempts per window
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        return `auth:${req.ip}:${req.body.email || "unknown"}`;
      },
      handler: (req, res) => {
        logger.warn("Auth rate limit exceeded", {
          ip: req.ip,
          email: req.body.email,
          userAgent: req.get("User-Agent"),
        });

        res.status(429).json({
          success: false,
          message: "Too many login attempts. Please wait 15 minutes.",
          retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        });
      },
    });
  }

  // Registration rate limiter
  registrationLimiter() {
    return rateLimit({
      store: this.createStore(),
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3, // 3 registrations per hour per IP
      message: {
        success: false,
        message: "Too many registration attempts. Please try again in an hour.",
        retryAfter: "1 hour",
      },
      handler: (req, res) => {
        logger.warn("Registration rate limit exceeded", {
          ip: req.ip,
          email: req.body.email,
          userAgent: req.get("User-Agent"),
        });

        res.status(429).json({
          success: false,
          message: "Registration limit exceeded. Please try again later.",
          retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        });
      },
    });
  }

  // File upload rate limiter
  uploadLimiter() {
    return rateLimit({
      store: this.createStore(),
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 uploads per minute
      message: {
        success: false,
        message: "Upload limit exceeded. Please wait a minute.",
        retryAfter: "1 minute",
      },
      handler: (req, res) => {
        logger.warn("Upload rate limit exceeded", {
          ip: req.ip,
          userId: req.user?.id,
          userAgent: req.get("User-Agent"),
        });

        res.status(429).json({
          success: false,
          message: "Too many uploads. Please slow down.",
          retryAfter: Math.round(req.rateLimit.resetTime / 1000),
        });
      },
    });
  }

  // API endpoint specific limiter
  apiLimiter(windowMs = 15 * 60 * 1000, max = 100) {
    return rateLimit({
      store: this.createStore(),
      windowMs,
      max,
      message: {
        success: false,
        message: "API rate limit exceeded",
        retryAfter: Math.ceil(windowMs / 1000),
      },
    });
  }

  // Webhook rate limiter (for callbacks)
  webhookLimiter() {
    return rateLimit({
      store: this.createStore(),
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 webhook calls per minute
      skip: (req) => {
        // Skip if valid API key is present
        return req.headers["x-api-key"] === config.apiKey;
      },
      handler: (req, res) => {
        logger.warn("Webhook rate limit exceeded", {
          ip: req.ip,
          userAgent: req.get("User-Agent"),
          endpoint: req.path,
        });

        res.status(429).json({
          success: false,
          message: "Webhook rate limit exceeded",
        });
      },
    });
  }

  // Dynamic rate limiter based on user tier
  dynamicLimiter() {
    return rateLimit({
      store: this.createStore(),
      windowMs: 15 * 60 * 1000,
      max: (req) => {
        if (req.user) {
          if (req.user.isAdmin) return 1000;
          if (req.user.tier === "premium") return 500;
          if (req.user.tier === "basic") return 200;
        }
        return 100; // Anonymous users
      },
      keyGenerator: (req) => {
        return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
      },
    });
  }

  // Sliding window rate limiter
  slidingWindowLimiter() {
    const windows = new Map();
    const windowSize = 60 * 1000; // 1 minute
    const maxRequests = 30;

    return (req, res, next) => {
      const key = req.ip;
      const now = Date.now();

      if (!windows.has(key)) {
        windows.set(key, []);
      }

      const requests = windows.get(key);

      // Remove requests older than window size
      while (requests.length && requests[0] <= now - windowSize) {
        requests.shift();
      }

      if (requests.length >= maxRequests) {
        logger.warn("Sliding window rate limit exceeded", {
          ip: req.ip,
          requests: requests.length,
        });

        return res.status(429).json({
          success: false,
          message: "Rate limit exceeded",
          retryAfter: Math.ceil((requests[0] + windowSize - now) / 1000),
        });
      }

      requests.push(now);
      next();
    };
  }

  // Clean up method
  cleanup() {
    if (this.redisClient) {
      this.redisClient.quit();
    }
  }
}

module.exports = new RateLimiterMiddleware();
