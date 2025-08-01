class ErrorHandler {
  // Main error handling middleware
  handleErrors(err, req, res, next) {
    // Console log error details instead of logger
    console.error("Unhandled error occurred", {
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      },
      user: req.user ? { id: req.user.id, email: req.user.email } : null,
      timestamp: new Date().toISOString(),
    });

    // Handle different types of errors
    if (err.name === "ValidationError") {
      return this.handleValidationError(err, res);
    }

    if (err.name === "JsonWebTokenError") {
      return this.handleJWTError(err, res);
    }

    if (err.name === "TokenExpiredError") {
      return this.handleTokenExpiredError(err, res);
    }

    if (err.name === "CastError") {
      return this.handleCastError(err, res);
    }

    if (err.code === 11000) {
      return this.handleDuplicateError(err, res);
    }

    if (err.name === "UnauthorizedError") {
      return this.handleUnauthorizedError(err, res);
    }

    if (err.name === "ForbiddenError") {
      return this.handleForbiddenError(err, res);
    }

    if (err.status === 404 || err.name === "NotFoundError") {
      return this.handleNotFoundError(err, res);
    }

    if (err.name === "PaymentError") {
      return this.handlePaymentError(err, res);
    }

    if (err.name === "RateLimitError") {
      return this.handleRateLimitError(err, res);
    }

    // Handle Axios/HTTP errors
    if (err.response && err.response.status) {
      return this.handleHttpError(err, res);
    }

    // Handle database errors
    if (err.code && typeof err.code === "string") {
      return this.handleDatabaseError(err, res);
    }

    // Default error handler
    return this.handleGenericError(err, res);
  }

  handleValidationError(err, res) {
    const errors = Object.values(err.errors || {}).map((error) => ({
      field: error.path,
      message: error.message,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: errors,
      timestamp: new Date().toISOString(),
    });
  }

  handleJWTError(err, res) {
    return res.status(401).json({
      success: false,
      message: "Invalid token. Please login again.",
      timestamp: new Date().toISOString(),
    });
  }

  handleTokenExpiredError(err, res) {
    return res.status(401).json({
      success: false,
      message: "Token expired. Please login again.",
      timestamp: new Date().toISOString(),
    });
  }

  handleCastError(err, res) {
    const message = `Invalid ${err.path}: ${err.value}`;
    return res.status(400).json({
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }

  handleDuplicateError(err, res) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;

    return res.status(400).json({
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }

  handleUnauthorizedError(err, res) {
    return res.status(401).json({
      success: false,
      message: err.message || "Unauthorized access",
      timestamp: new Date().toISOString(),
    });
  }

  handleForbiddenError(err, res) {
    return res.status(403).json({
      success: false,
      message: err.message || "Forbidden access",
      timestamp: new Date().toISOString(),
    });
  }

  handleNotFoundError(err, res) {
    return res.status(404).json({
      success: false,
      message: err.message || "Resource not found",
      timestamp: new Date().toISOString(),
    });
  }

  handlePaymentError(err, res) {
    return res.status(402).json({
      success: false,
      message: err.message || "Payment processing failed",
      details: err.details || null,
      timestamp: new Date().toISOString(),
    });
  }

  handleRateLimitError(err, res) {
    return res.status(429).json({
      success: false,
      message: "Too many requests. Please try again later.",
      retryAfter: err.retryAfter || 60,
      timestamp: new Date().toISOString(),
    });
  }

  handleHttpError(err, res) {
    const status = err.response.status;
    const message =
      err.response.data?.message || err.message || "External service error";

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      success: false,
      message: message,
      service: err.config?.baseURL || "External service",
      timestamp: new Date().toISOString(),
    });
  }

  handleDatabaseError(err, res) {
    let message = "Database operation failed";
    let status = 500;

    switch (err.code) {
      case "23505": // PostgreSQL unique violation
        message = "Duplicate entry found";
        status = 400;
        break;
      case "23503": // PostgreSQL foreign key violation
        message = "Referenced record not found";
        status = 400;
        break;
      case "23514": // PostgreSQL check violation
        message = "Data constraint violation";
        status = 400;
        break;
      case "ECONNREFUSED":
        message = "Database connection failed";
        status = 503;
        break;
      default:
        message = "Database error occurred";
    }

    return res.status(status).json({
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && {
        details: err.detail || err.message,
      }),
    });
  }

  handleGenericError(err, res) {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal server error";

    return res.status(status).json({
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
      }),
    });
  }

  // Async error wrapper
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Custom error classes
  createError(message, statusCode = 500, name = "Error") {
    const error = new Error(message);
    error.status = statusCode;
    error.name = name;
    return error;
  }

  // Handle uncaught exceptions
  handleUncaughtException() {
    process.on("uncaughtException", (err) => {
      console.error("Uncaught Exception:", {
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        timestamp: new Date().toISOString(),
      });

      // Graceful shutdown
      process.exit(1);
    });
  }

  // Handle unhandled promise rejections
  handleUnhandledRejection() {
    process.on("unhandledRejection", (err, promise) => {
      console.error("Unhandled Promise Rejection:", {
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        promise: promise,
        timestamp: new Date().toISOString(),
      });

      // Graceful shutdown
      process.exit(1);
    });
  }
}

module.exports = new ErrorHandler();
