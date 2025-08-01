// src/utils/logger.js
const logger = {
  info: (...args) => {
    console.log(`[INFO] ${new Date().toISOString()}:`, ...args);
  },

  error: (...args) => {
    console.error(`[ERROR] ${new Date().toISOString()}:`, ...args);
  },

  warn: (...args) => {
    console.warn(`[WARN] ${new Date().toISOString()}:`, ...args);
  },

  debug: (...args) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[DEBUG] ${new Date().toISOString()}:`, ...args);
    }
  },

  // Payment-specific methods (simplified)
  payment: (message, meta = {}) => {
    console.log(`[PAYMENT] ${new Date().toISOString()}: ${message}`, meta);
  },

  security: (message, meta = {}) => {
    console.warn(`[SECURITY] ${new Date().toISOString()}: ${message}`, meta);
  },
};

module.exports = logger;
