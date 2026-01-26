/**
 * ✅ FIX UX #2: Specific error messages instead of generic "Something went wrong"
 * 
 * Maps error codes and types to user-friendly, actionable messages
 */

// Error type categories
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  BUSINESS: 'BUSINESS',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

// Error message mappings
const errorMessages = {
  // Network errors
  NETWORK_ERROR: {
    title: 'Connection Lost',
    description: 'Please check your internet connection and try again.',
    action: 'Retry',
  },
  TIMEOUT_ERROR: {
    title: 'Request Timed Out',
    description: 'The server is taking too long to respond. Please try again.',
    action: 'Retry',
  },
  
  // Auth errors
  INVALID_CREDENTIALS: {
    title: 'Login Failed',
    description: 'The email or password you entered is incorrect. Please try again.',
    action: 'Reset Password',
  },
  EMAIL_NOT_CONFIRMED: {
    title: 'Email Not Verified',
    description: 'Please check your email and click the verification link.',
    action: 'Resend Email',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    description: 'Your session has expired. Please log in again.',
    action: 'Log In',
  },
  UNAUTHORIZED: {
    title: 'Access Denied',
    description: 'You do not have permission to perform this action.',
    action: null,
  },
  
  // Validation errors
  MISSING_REQUIRED_FIELD: {
    title: 'Missing Information',
    description: 'Please fill in all required fields before continuing.',
    action: null,
  },
  INVALID_EMAIL: {
    title: 'Invalid Email',
    description: 'Please enter a valid email address.',
    action: null,
  },
  WEAK_PASSWORD: {
    title: 'Weak Password',
    description: 'Password must be at least 6 characters long.',
    action: null,
  },
  INVALID_PHONE: {
    title: 'Invalid Phone Number',
    description: 'Please enter a valid 10-digit phone number.',
    action: null,
  },
  
  // Business logic errors
  INSUFFICIENT_STOCK: {
    title: 'Out of Stock',
    description: 'This item has limited stock. Please reduce quantity or try another variant.',
    action: 'View Alternatives',
  },
  OUT_OF_STOCK: {
    title: 'Product Unavailable',
    description: 'This product is currently out of stock. We\'ll notify you when it\'s back.',
    action: 'Notify Me',
  },
  INVALID_AMOUNT: {
    title: 'Invalid Order Amount',
    description: 'The order total is invalid. Please refresh and try again.',
    action: 'Refresh Cart',
  },
  ORDER_ALREADY_PROCESSED: {
    title: 'Order Already Processed',
    description: 'This order has already been completed.',
    action: 'View Orders',
  },
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    description: 'Your payment could not be processed. Please check your payment details and try again.',
    action: 'Retry Payment',
  },
  CART_EMPTY: {
    title: 'Cart is Empty',
    description: 'Add some items to your cart before checking out.',
    action: 'Continue Shopping',
  },
  
  // Server errors
  SERVER_ERROR: {
    title: 'Server Error',
    description: 'Something went wrong on our end. Our team has been notified.',
    action: 'Try Again Later',
  },
  DATABASE_ERROR: {
    title: 'Database Error',
    description: 'We\'re having trouble accessing data. Please try again shortly.',
    action: 'Retry',
  },
  RATE_LIMIT_EXCEEDED: {
    title: 'Too Many Requests',
    description: 'You\'re doing that too often. Please wait a moment and try again.',
    action: null,
  },
  
  // Default
  UNKNOWN: {
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
    action: 'Retry',
  },
};

/**
 * Get user-friendly error message from error object
 * 
 * @param {Error|Object|string} error - Error object, code string, or error response
 * @returns {Object} { title, description, action, type }
 */
export const getErrorMessage = (error) => {
  // Handle null/undefined
  if (!error) {
    return errorMessages.UNKNOWN;
  }
  
  // Handle string error codes directly
  if (typeof error === 'string') {
    return errorMessages[error] || errorMessages.UNKNOWN;
  }
  
  // Handle Error objects
  let errorCode = 'UNKNOWN';
  let errorType = ErrorTypes.UNKNOWN;
  
  // Check for network errors
  if (error.message === 'Network Error' || error.message === 'Failed to fetch') {
    errorCode = 'NETWORK_ERROR';
    errorType = ErrorTypes.NETWORK;
  }
  // Check for timeout
  else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    errorCode = 'TIMEOUT_ERROR';
    errorType = ErrorTypes.NETWORK;
  }
  // Check for Supabase auth errors
  else if (error.message?.includes('Invalid login credentials')) {
    errorCode = 'INVALID_CREDENTIALS';
    errorType = ErrorTypes.AUTH;
  }
  else if (error.message?.includes('Email not confirmed')) {
    errorCode = 'EMAIL_NOT_CONFIRMED';
    errorType = ErrorTypes.AUTH;
  }
  else if (error.code === 'PGRST301' || error.message?.includes('JWT expired')) {
    errorCode = 'SESSION_EXPIRED';
    errorType = ErrorTypes.AUTH;
  }
  // Check for business logic errors (custom error codes)
  else if (error.code === 'INSUFFICIENT_STOCK') {
    errorCode = 'INSUFFICIENT_STOCK';
    errorType = ErrorTypes.BUSINESS;
  }
  else if (error.code === 'OUT_OF_STOCK') {
    errorCode = 'OUT_OF_STOCK';
    errorType = ErrorTypes.BUSINESS;
  }
  else if (error.code === 'INVALID_AMOUNT') {
    errorCode = 'INVALID_AMOUNT';
    errorType = ErrorTypes.BUSINESS;
  }
  // Check for server errors
  else if (error.code === 'PGRST000' || error.status >= 500) {
    errorCode = 'SERVER_ERROR';
    errorType = ErrorTypes.SERVER;
  }
  // Check for validation errors
  else if (error.status === 400 || error.code?.includes('VALIDATION')) {
    errorCode = 'MISSING_REQUIRED_FIELD';
    errorType = ErrorTypes.VALIDATION;
  }
  // Check for auth errors
  else if (error.status === 401) {
    errorCode = 'UNAUTHORIZED';
    errorType = ErrorTypes.AUTH;
  }
  
  const message = errorMessages[errorCode] || errorMessages.UNKNOWN;
  
  return {
    ...message,
    type: errorType,
    originalError: error,
  };
};

/**
 * Check if user is offline
 */
export const isOffline = () => {
  return typeof navigator !== 'undefined' && !navigator.onLine;
};

/**
 * Get offline error message
 */
export const getOfflineMessage = () => ({
  title: 'You\'re Offline',
  description: 'Please check your internet connection and try again.',
  action: 'Retry',
  type: ErrorTypes.NETWORK,
});

/**
 * Format error for toast notification
 * 
 * @param {Error|Object|string} error 
 * @param {Object} options - Toast customization options
 * @returns {Object} Toast-compatible object
 */
export const formatErrorForToast = (error, options = {}) => {
  // Check offline first
  if (isOffline()) {
    const offlineMsg = getOfflineMessage();
    return {
      title: offlineMsg.title,
      description: offlineMsg.description,
      variant: 'destructive',
      ...options,
    };
  }
  
  const errorMsg = getErrorMessage(error);
  
  return {
    title: errorMsg.title,
    description: errorMsg.description,
    variant: 'destructive',
    ...options,
  };
};

export default {
  getErrorMessage,
  formatErrorForToast,
  isOffline,
  getOfflineMessage,
  ErrorTypes,
};
