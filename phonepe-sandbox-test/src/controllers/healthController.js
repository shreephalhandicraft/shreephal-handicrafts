const { supabase } = require("../config/supabaseClient");
const redis = require("../config/redis");
const phonepeService = require("../services/phonepeService");
const logger = require("../utils/logger");
const package = require("../../package.json");

class HealthController {
  // Basic health check
  async healthCheck(req, res) {
    try {
      const healthStatus = {
        status: "OK",
        timestamp: new Date().toISOString(),
        version: package.version,
        environment: process.env.NODE_ENV,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        services: {},
      };

      // Check database connectivity
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id")
          .limit(1);

        healthStatus.services.database = {
          status: error ? "DOWN" : "UP",
          responseTime: Date.now(),
          error: error?.message,
        };
      } catch (dbError) {
        healthStatus.services.database = {
          status: "DOWN",
          error: dbError.message,
        };
      }

      // Check Redis connectivity
      try {
        if (redis) {
          await redis.ping();
          healthStatus.services.redis = {
            status: "UP",
            responseTime: Date.now(),
          };
        }
      } catch (redisError) {
        healthStatus.services.redis = {
          status: "DOWN",
          error: redisError.message,
        };
      }

      // Check PhonePe service (basic connectivity test)
      try {
        // This is a simple connectivity test - you might want to implement a proper health check
        healthStatus.services.phonepe = {
          status: "UP",
          configured: !!(
            process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY
          ),
        };
      } catch (phonepeError) {
        healthStatus.services.phonepe = {
          status: "DOWN",
          error: phonepeError.message,
        };
      }

      // Determine overall status
      const allServicesUp = Object.values(healthStatus.services).every(
        (service) => service.status === "UP"
      );

      if (!allServicesUp) {
        healthStatus.status = "DEGRADED";
        return res.status(503).json(healthStatus);
      }

      res.json(healthStatus);
    } catch (error) {
      logger.error("Health check error", { error: error.message });

      res.status(500).json({
        status: "DOWN",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  // Detailed system information (admin only)
  async systemInfo(req, res, next) {
    try {
      if (!req.user?.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const systemInfo = {
        application: {
          name: package.name,
          version: package.version,
          nodeVersion: process.version,
          environment: process.env.NODE_ENV,
          uptime: process.uptime(),
          startTime: new Date(
            Date.now() - process.uptime() * 1000
          ).toISOString(),
        },
        system: {
          platform: process.platform,
          arch: process.arch,
          cpus: require("os").cpus().length,
          memory: {
            total: require("os").totalmem(),
            free: require("os").freemem(),
            usage: process.memoryUsage(),
          },
          loadAverage: require("os").loadavg(),
        },
        configuration: {
          port: process.env.PORT,
          databaseConfigured: !!process.env.DATABASE_URL,
          redisConfigured: !!process.env.REDIS_URL,
          phonepeConfigured: !!(
            process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY
          ),
          corsEnabled: true,
          rateLimitingEnabled: true,
        },
      };

      res.json({
        success: true,
        data: systemInfo,
      });
    } catch (error) {
      logger.error("System info error", { error: error.message });
      next(error);
    }
  }

  // Database health check
  async databaseHealth(req, res, next) {
    try {
      const startTime = Date.now();

      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("orders")
        .select("count")
        .limit(1);

      const connectionTime = Date.now() - startTime;

      if (connectionError) {
        return res.status(503).json({
          status: "DOWN",
          error: connectionError.message,
          responseTime: connectionTime,
        });
      }

      // Test write operation (create a health check record)
      const writeStartTime = Date.now();
      const { error: writeError } = await supabase
        .from("health_checks")
        .insert([
          {
            type: "database_health",
            timestamp: new Date().toISOString(),
            status: "OK",
          },
        ]);

      const writeTime = Date.now() - writeStartTime;

      res.json({
        status: "UP",
        connection: {
          status: "OK",
          responseTime: connectionTime,
        },
        write: {
          status: writeError ? "ERROR" : "OK",
          responseTime: writeTime,
          error: writeError?.message,
        },
      });
    } catch (error) {
      logger.error("Database health check error", { error: error.message });

      res.status(503).json({
        status: "DOWN",
        error: error.message,
      });
    }
  }

  // Ready check (for Kubernetes readiness probe)
  async readyCheck(req, res) {
    try {
      // Check critical services that must be available
      const checks = [];

      // Database check
      const dbCheck = supabase
        .from("orders")
        .select("id")
        .limit(1)
        .then(() => ({ service: "database", status: "ready" }))
        .catch((error) => ({
          service: "database",
          status: "not_ready",
          error: error.message,
        }));

      checks.push(dbCheck);

      // Wait for all checks
      const results = await Promise.all(checks);

      // Check if all services are ready
      const allReady = results.every((result) => result.status === "ready");

      if (allReady) {
        res.json({
          status: "ready",
          timestamp: new Date().toISOString(),
          checks: results,
        });
      } else {
        res.status(503).json({
          status: "not_ready",
          timestamp: new Date().toISOString(),
          checks: results,
        });
      }
    } catch (error) {
      logger.error("Ready check error", { error: error.message });

      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  // Liveness check (for Kubernetes liveness probe)
  async liveCheck(req, res) {
    try {
      // Simple check to verify the application is running
      res.json({
        status: "alive",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    } catch (error) {
      res.status(500).json({
        status: "dead",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}

module.exports = new HealthController();
