const { supabase } = require("../config/supabaseClient");
const logger = require("../utils/logger");

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "No authorization header provided",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "No token provided",
      });
    }

    // Verify JWT with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn("Invalid token attempt", { error: error?.message });
      return res.status(401).json({
        error: "Invalid or expired token",
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(500).json({
      error: "Authentication failed",
    });
  }
};

// Optional authentication (for public endpoints that benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace("Bearer ", "");

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
};
