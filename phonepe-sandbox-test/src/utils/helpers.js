const crypto = require("crypto");
const moment = require("moment-timezone");
const CONSTANTS = require("./constants");
const logger = require("./logger");

class HelperUtils {
  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted amount
   */
  static formatCurrency(
    amount,
    currency = CONSTANTS.DEFAULT_CURRENCY,
    locale = "en-IN"
  ) {
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      return formatter.format(amount);
    } catch (error) {
      logger.error("Currency formatting failed", {
        amount,
        currency,
        error: error.message,
      });
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Format date
   * @param {Date|string} date - Date to format
   * @param {string} format - Date format
   * @param {string} timezone - Timezone
   * @returns {string} Formatted date
   */
  static formatDate(
    date,
    format = CONSTANTS.DATE_FORMATS.DISPLAY_DATETIME,
    timezone = CONSTANTS.DEFAULT_TIMEZONE
  ) {
    try {
      return moment(date).tz(timezone).format(format);
    } catch (error) {
      logger.error("Date formatting failed", {
        date,
        format,
        error: error.message,
      });
      return new Date(date).toLocaleString();
    }
  }

  /**
   * Generate order ID
   * @param {string} prefix - Prefix for order ID
   * @returns {string} Generated order ID
   */
  static generateOrderId(prefix = "ORDER") {
    try {
      const timestamp = Date.now();
      const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
      return `${prefix}_${timestamp}_${randomSuffix}`;
    } catch (error) {
      logger.error("Order ID generation failed", { error: error.message });
      throw new Error("Failed to generate order ID");
    }
  }

  /**
   * Generate transaction reference
   * @param {string} orderId - Order ID
   * @param {string} type - Transaction type
   * @returns {string} Transaction reference
   */
  static generateTransactionRef(orderId, type = "PAY") {
    try {
      const timestamp = Date.now().toString().slice(-8);
      const random = crypto.randomBytes(2).toString("hex").toUpperCase();
      return `${type}_${orderId}_${timestamp}_${random}`;
    } catch (error) {
      logger.error("Transaction reference generation failed", {
        error: error.message,
      });
      throw new Error("Failed to generate transaction reference");
    }
  }

  /**
   * Sanitize string input
   * @param {string} input - Input string
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized string
   */
  static sanitizeString(input, options = {}) {
    try {
      if (typeof input !== "string") return "";

      const {
        removeHTML = true,
        removeSpecialChars = false,
        trim = true,
        maxLength = null,
      } = options;

      let sanitized = input;

      if (trim) {
        sanitized = sanitized.trim();
      }

      if (removeHTML) {
        sanitized = sanitized.replace(/<[^>]*>/g, "");
      }

      if (removeSpecialChars) {
        sanitized = sanitized.replace(/[^a-zA-Z0-9\s]/g, "");
      }

      if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
      }

      return sanitized;
    } catch (error) {
      logger.error("String sanitization failed", { error: error.message });
      return "";
    }
  }

  /**
   * Mask sensitive data
   * @param {string} data - Data to mask
   * @param {Object} options - Masking options
   * @returns {string} Masked data
   */
  static maskSensitiveData(data, options = {}) {
    try {
      if (!data) return "";

      const {
        type = "default",
        visibleStart = 2,
        visibleEnd = 2,
        maskChar = "*",
      } = options;

      const dataStr = data.toString();

      if (type === "email") {
        const [localPart, domain] = dataStr.split("@");
        if (!domain) return dataStr;

        const maskedLocal =
          localPart.length > 2
            ? localPart[0] +
              maskChar.repeat(localPart.length - 2) +
              localPart[localPart.length - 1]
            : localPart;

        return `${maskedLocal}@${domain}`;
      }

      if (type === "phone") {
        if (dataStr.length < 6) return dataStr;
        return (
          dataStr.substring(0, 2) +
          maskChar.repeat(dataStr.length - 4) +
          dataStr.substring(dataStr.length - 2)
        );
      }

      if (type === "card") {
        if (dataStr.length < 8) return dataStr;
        return (
          dataStr.substring(0, 4) +
          maskChar.repeat(dataStr.length - 8) +
          dataStr.substring(dataStr.length - 4)
        );
      }

      // Default masking
      if (dataStr.length <= visibleStart + visibleEnd) return dataStr;

      const start = dataStr.substring(0, visibleStart);
      const end = dataStr.substring(dataStr.length - visibleEnd);
      const middle = maskChar.repeat(
        dataStr.length - visibleStart - visibleEnd
      );

      return start + middle + end;
    } catch (error) {
      logger.error("Data masking failed", { error: error.message });
      return data.toString();
    }
  }

  /**
   * Calculate pagination
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items
   * @returns {Object} Pagination info
   */
  static calculatePagination(page, limit, total) {
    try {
      const currentPage = Math.max(1, parseInt(page) || 1);
      const itemsPerPage = Math.min(
        parseInt(limit) || CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        CONSTANTS.PAGINATION.MAX_LIMIT
      );
      const totalItems = parseInt(total) || 0;
      const totalPages = Math.ceil(totalItems / itemsPerPage);
      const offset = (currentPage - 1) * itemsPerPage;
      const hasNext = currentPage < totalPages;
      const hasPrev = currentPage > 1;

      return {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        offset,
        hasNext,
        hasPrev,
        nextPage: hasNext ? currentPage + 1 : null,
        prevPage: hasPrev ? currentPage - 1 : null,
      };
    } catch (error) {
      logger.error("Pagination calculation failed", { error: error.message });
      return {
        currentPage: 1,
        itemsPerPage: CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        totalItems: 0,
        totalPages: 0,
        offset: 0,
        hasNext: false,
        hasPrev: false,
        nextPage: null,
        prevPage: null,
      };
    }
  }

  /**
   * Deep clone object
   * @param {Object} obj - Object to clone
   * @returns {Object} Cloned object
   */
  static deepClone(obj) {
    try {
      if (obj === null || typeof obj !== "object") return obj;
      if (obj instanceof Date) return new Date(obj.getTime());
      if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
      if (typeof obj === "object") {
        const cloned = {};
        Object.keys(obj).forEach((key) => {
          cloned[key] = this.deepClone(obj[key]);
        });
        return cloned;
      }
    } catch (error) {
      logger.error("Deep clone failed", { error: error.message });
      return obj;
    }
  }

  /**
   * Convert amount to paise (for PhonePe)
   * @param {number} amount - Amount in rupees
   * @returns {number} Amount in paise
   */
  static convertToPaise(amount) {
    try {
      return Math.round(parseFloat(amount) * 100);
    } catch (error) {
      logger.error("Paise conversion failed", { amount, error: error.message });
      return 0;
    }
  }

  /**
   * Convert amount from paise to rupees
   * @param {number} paise - Amount in paise
   * @returns {number} Amount in rupees
   */
  static convertFromPaise(paise) {
    try {
      return parseFloat((parseInt(paise) / 100).toFixed(2));
    } catch (error) {
      logger.error("Rupee conversion failed", { paise, error: error.message });
      return 0;
    }
  }

  /**
   * Format phone number
   * @param {string} phone - Phone number
   * @param {boolean} addCountryCode - Add country code
   * @returns {string} Formatted phone number
   */
  static formatPhoneNumber(phone, addCountryCode = false) {
    try {
      if (!phone) return "";

      // Remove all non-digits
      const cleaned = phone.replace(/\D/g, "");

      // Handle Indian mobile numbers
      if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
        return addCountryCode ? `+91${cleaned}` : cleaned;
      }

      // Handle numbers with country code
      if (cleaned.length === 12 && cleaned.startsWith("91")) {
        const number = cleaned.substring(2);
        return addCountryCode ? `+91${number}` : number;
      }

      return phone;
    } catch (error) {
      logger.error("Phone formatting failed", { phone, error: error.message });
      return phone;
    }
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Validation result
   */
  static isValidEmail(email) {
    try {
      return CONSTANTS.PATTERNS.EMAIL.test(email);
    } catch (error) {
      logger.error("Email validation failed", { email, error: error.message });
      return false;
    }
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} Validation result
   */
  static isValidPhoneNumber(phone) {
    try {
      const cleaned = phone.replace(/\D/g, "");
      return CONSTANTS.PATTERNS.PHONE.test(cleaned);
    } catch (error) {
      logger.error("Phone validation failed", { phone, error: error.message });
      return false;
    }
  }

  /**
   * Generate response object
   * @param {boolean} success - Success status
   * @param {string} message - Response message
   * @param {*} data - Response data
   * @param {Object} meta - Additional metadata
   * @returns {Object} Response object
   */
  static generateResponse(success, message, data = null, meta = {}) {
    try {
      const response = {
        success,
        message,
        timestamp: new Date().toISOString(),
      };

      if (data !== null) {
        response.data = data;
      }

      if (Object.keys(meta).length > 0) {
        response.meta = meta;
      }

      return response;
    } catch (error) {
      logger.error("Response generation failed", { error: error.message });
      return {
        success: false,
        message: "Response generation failed",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Sleep for specified duration
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise} Promise that resolves after delay
   */
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry async operation
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delay - Delay between retries
   * @returns {Promise} Operation result
   */
  static async retry(operation, maxRetries = 3, delay = 1000) {
    try {
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation();
        } catch (error) {
          lastError = error;
          logger.warn(`Operation failed, attempt ${attempt}/${maxRetries}`, {
            error: error.message,
            attempt,
          });

          if (attempt < maxRetries) {
            await this.sleep(delay * attempt);
          }
        }
      }

      throw lastError;
    } catch (error) {
      logger.error("Retry operation failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} Throttled function
   */
  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Parse query string to object
   * @param {string} queryString - Query string
   * @returns {Object} Parsed query object
   */
  static parseQueryString(queryString) {
    try {
      const params = new URLSearchParams(queryString);
      const result = {};

      for (const [key, value] of params.entries()) {
        if (result[key]) {
          if (Array.isArray(result[key])) {
            result[key].push(value);
          } else {
            result[key] = [result[key], value];
          }
        } else {
          result[key] = value;
        }
      }

      return result;
    } catch (error) {
      logger.error("Query string parsing failed", {
        queryString,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * Convert object to query string
   * @param {Object} obj - Object to convert
   * @returns {string} Query string
   */
  static objectToQueryString(obj) {
    try {
      const params = new URLSearchParams();

      Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(key, item));
        } else if (value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      return params.toString();
    } catch (error) {
      logger.error("Object to query string conversion failed", {
        error: error.message,
      });
      return "";
    }
  }

  /**
   * Get file extension from filename
   * @param {string} filename - Filename
   * @returns {string} File extension
   */
  static getFileExtension(filename) {
    try {
      return filename.split(".").pop().toLowerCase();
    } catch (error) {
      logger.error("File extension extraction failed", {
        filename,
        error: error.message,
      });
      return "";
    }
  }

  /**
   * Format file size
   * @param {number} bytes - File size in bytes
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted file size
   */
  static formatFileSize(bytes, decimals = 2) {
    try {
      if (bytes === 0) return "0 Bytes";

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    } catch (error) {
      logger.error("File size formatting failed", {
        bytes,
        error: error.message,
      });
      return `${bytes} Bytes`;
    }
  }
}

module.exports = HelperUtils;
