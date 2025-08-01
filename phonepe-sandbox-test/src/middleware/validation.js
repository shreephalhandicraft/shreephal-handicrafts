const { body, param, query, validationResult } = require('express-validator');
const logger = require('../utils/logger');

class ValidationMiddleware {
  // Handle validation errors
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Validation errors', { 
        errors: errors.array(),
        url: req.url,
        method: req.method
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg,
          value: error.value
        }))
      });
    }
    next();
  }

  // Payment validation rules
  validatePaymentInitiation() {
    return [
      body('orderId')
        .notEmpty()
        .withMessage('Order ID is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('Order ID must be 1-50 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Order ID contains invalid characters'),

      body('amount')
        .notEmpty()
        .withMessage('Amount is required')
        .isNumeric()
        .withMessage('Amount must be numeric')
        .custom(value => {
          if (parseInt(value) <= 0) {
            throw new Error('Amount must be greater than 0');
          }
          if (parseInt(value) > 100000000) { // 1 crore limit
            throw new Error('Amount exceeds maximum limit');
          }
          return true;
        }),

      body('customerEmail')
        .notEmpty()
        .withMessage('Customer email is required')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

      body('customerPhone')
        .notEmpty()
        .withMessage('Customer phone is required')
        .isMobilePhone('en-IN')
        .withMessage('Valid Indian mobile number is required'),

      body('customerName')
        .notEmpty()
        .withMessage('Customer name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be 2-100 characters')
        .matches(/^[a-zA-Z\s.'-]+$/)
        .withMessage('Name contains invalid characters'),

      this.handleValidationErrors
    ];
  }

  // Order validation rules
  validateOrderCreation() {
    return [
      body('customerInfo.email')
        .notEmpty()
        .withMessage('Customer email is required')
        .isEmail()
        .withMessage('Valid email is required'),

      body('customerInfo.phone')
        .notEmpty()
        .withMessage('Customer phone is required')
        .isMobilePhone('en-IN')
        .withMessage('Valid Indian mobile number is required'),

      body('customerInfo.name')
        .notEmpty()
        .withMessage('Customer name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be 2-100 characters'),

      body('items')
        .isArray({ min: 1 })
        .withMessage('At least one item is required'),

      body('items.*.productId')
        .notEmpty()
        .withMessage('Product ID is required'),

      body('items.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be a positive integer'),

      body('items.*.price')
        .isNumeric()
        .withMessage('Price must be numeric')
        .custom(value => {
          if (parseFloat(value) <= 0) {
            throw new Error('Price must be greater than 0');
          }
          return true;
        }),

      body('amount')
        .isNumeric()
        .withMessage('Total amount must be numeric'),

      body('shippingAddress.street')
        .notEmpty()
        .withMessage('Street address is required'),

      body('shippingAddress.city')
        .notEmpty()
        .withMessage('City is required'),

      body('shippingAddress.state')
        .notEmpty()
        .withMessage('State is required'),

      body('shippingAddress.pincode')
        .notEmpty()
        .withMessage('Pincode is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('Pincode must be 6 digits')
        .isNumeric()
        .withMessage('Pincode must be numeric'),

      this.handleValidationErrors
    ];
  }

  // Order status update validation
  validateOrderStatusUpdate() {
    return [
      body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'])
        .withMessage('Invalid status value'),

      body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters'),

      this.handleValidationErrors
    ];
  }

  // Parameter validations
  validateObjectId(paramName = 'id') {
    return [
      param(paramName)
        .notEmpty()
        .withMessage(`${paramName} is required`)
        .isLength({ min: 1, max: 50 })
        .withMessage(`${paramName} must be valid`),

      this.handleValidationErrors
    ];
  }

  // Query parameter validations
  validatePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

      this.handleValidationErrors
    ];
  }

  // User registration validation
  validateUserRegistration() {
    return [
      body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character'),

      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be 2-100 characters'),

      body('phone')
        .optional()
        .isMobilePhone('en-IN')
        .withMessage('Valid Indian mobile number is required'),

      this.handleValidationErrors
    ];
  }

  // Login validation
  validateLogin() {
    return [
      body('email')
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Valid email is required')
        .normalizeEmail(),

      body('password')
        .notEmpty()
        .withMessage('Password is required'),

      this.handleValidationErrors
    ];
  }

  // Refund validation
  validateRefund() {
    return [
      body('refundAmount')
        .notEmpty()
        .withMessage('Refund amount is required')
        .isNumeric()
        .withMessage('Refund amount must be numeric')
        .custom(value => {
          if (parseFloat(value) <= 0) {
            throw new Error('Refund amount must be greater than 0');
          }
          return true;
        }),

      body('reason')
        .notEmpty()
        .withMessage('Refund reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Reason must be 10-500 characters'),

      this.handleValidationErrors
    ];
  }

  // File upload validation
  validateFileUpload() {
    return [
      body('fileType')
        .optional()
        .isIn(['image', 'document'])
        .withMessage('Invalid file type'),

      this.handleValidationErrors
    ];
  }

  // Date range validation
  validateDateRange() {
    return [
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be valid ISO 8601 date'),

      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be valid ISO 8601 date')
        .custom((value, { req }) => {
          if (req.query.startDate && value) {
            if (new Date(value) <= new Date(req.query.startDate)) {
              throw new Error('End date must be after start date');
            }
          }
          return true;
        }),

      this.handleValidationErrors
    ];
  }

  // Custom validation for business rules
  validateBusinessRules() {
    return [
      // Add custom business validation rules here
      body('*').custom((value, { req, path }) => {
        // Example: Custom validation logic
        return true;
      }),

      this.handleValidationErrors
    ];
  }
}

module.exports = new ValidationMiddleware();
