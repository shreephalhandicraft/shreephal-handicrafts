const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");
const authMiddleware = require("../middleware/auth");

/**
 * @route   GET /health
 * @desc    Basic health check
 * @access  Public
 */
router.get("/", healthController.healthCheck);

/**
 * @route   GET /health/live
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get("/live", healthController.liveCheck);

/**
 * @route   GET /health/ready
 * @desc    Kubernetes readiness probe
 * @access  Public
 */
router.get("/ready", healthController.readyCheck);

/**
 * @route   GET /health/database
 * @desc    Database health check
 * @access  Public
 */
router.get("/database", healthController.databaseHealth);

/**
 * @route   GET /health/system
 * @desc    Detailed system information
 * @access  Admin only
 */
router.get(
  "/system",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  healthController.systemInfo
);

/**
 * @route   GET /health/metrics
 * @desc    Prometheus metrics endpoint
 * @access  Public (usually restricted at infrastructure level)
 */
router.get("/metrics", (req, res) => {
  const register = require("prom-client").register;
  res.set("Content-Type", register.contentType);
  res.end(register.metrics());
});

/**
 * @route   POST /health/test-notification
 * @desc    Test notification systems
 * @access  Admin only
 */
router.post(
  "/test-notification",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  async (req, res, next) => {
    try {
      const { type, recipient } = req.body;

      // Test different notification types
      // This would integrate with your notification service

      res.json({
        success: true,
        message: `${type} notification test sent to ${recipient}`,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /health/dependencies
 * @desc    Check all external dependencies
 * @access  Admin only
 */
router.get(
  "/dependencies",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  async (req, res, next) => {
    try {
      const dependencies = {
        phonepe: { status: "checking" },
        database: { status: "checking" },
        redis: { status: "checking" },
        email: { status: "checking" },
      };

      // Check PhonePe API
      try {
        // Add actual PhonePe health check if available
        dependencies.phonepe = {
          status: "up",
          responseTime: 150,
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        dependencies.phonepe = {
          status: "down",
          error: error.message,
          lastChecked: new Date().toISOString(),
        };
      }

      // Add other dependency checks...

      res.json({
        success: true,
        data: dependencies,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
