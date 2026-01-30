/**
 * Centralized Billing Helpers
 * 
 * Purpose: Ensure consistent billing calculations across the entire application
 * All order displays (user-facing and admin) must use these helpers
 * 
 * Created: 2026-01-30
 */

/**
 * Get order total amount consistently from order object
 * 
 * Priority:
 * 1. order_total (billing snapshot) - PREFERRED ✅
 * 2. amount (legacy numeric field)
 * 3. total_price (legacy paise field) - convert to rupees
 * 
 * @param {Object} order - Order object from database
 * @returns {number} - Order total in rupees (e.g., 220.50)
 */
export const getOrderTotal = (order) => {
  if (!order) return 0;

  // Priority 1: order_total (billing snapshot) - CORRECT ✅
  if (order.order_total != null && order.order_total !== undefined) {
    return Number(order.order_total);
  }

  // Priority 2: amount (legacy numeric field)
  if (order.amount != null && order.amount !== undefined) {
    return Number(order.amount);
  }

  // Priority 3: total_price (legacy paise field) - convert to rupees
  if (order.total_price != null && order.total_price !== undefined) {
    return Number(order.total_price) / 100;
  }

  return 0;
};

/**
 * Get subtotal (before GST) from order object
 * 
 * @param {Object} order - Order object from database
 * @returns {number} - Subtotal in rupees
 */
export const getOrderSubtotal = (order) => {
  if (!order) return 0;

  // Use subtotal snapshot if available
  if (order.subtotal != null && order.subtotal !== undefined) {
    return Number(order.subtotal);
  }

  // Fallback: estimate from order_total (assume ~5% GST)
  const total = getOrderTotal(order);
  return total > 0 ? Math.round((total / 1.05) * 100) / 100 : 0;
};

/**
 * Get total GST amount from order object
 * 
 * @param {Object} order - Order object from database
 * @returns {number} - Total GST in rupees
 */
export const getOrderGST = (order) => {
  if (!order) return 0;

  // Use GST snapshot if available
  if (order.total_gst != null && order.total_gst !== undefined) {
    return Number(order.total_gst);
  }

  // Fallback: calculate from subtotal
  const subtotal = getOrderSubtotal(order);
  const total = getOrderTotal(order);
  return Math.round((total - subtotal) * 100) / 100;
};

/**
 * Get shipping cost from order object
 * 
 * @param {Object} order - Order object from database
 * @returns {number} - Shipping cost in rupees
 */
export const getOrderShipping = (order) => {
  if (!order) return 0;

  if (order.shipping_cost != null && order.shipping_cost !== undefined) {
    return Number(order.shipping_cost);
  }

  return 0;
};

/**
 * Format price for display (Indian Rupee format)
 * 
 * @param {number} amount - Amount in rupees
 * @param {boolean} showDecimals - Show decimal places (default: true)
 * @returns {string} - Formatted price (e.g., "₹220.50")
 */
export const formatPrice = (amount, showDecimals = true) => {
  if (amount == null || isNaN(amount)) return '₹0.00';

  const numAmount = Number(amount);
  
  if (showDecimals) {
    return `₹${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }
  
  return `₹${Math.round(numAmount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
};

/**
 * Convert rupees to paise (for payment gateway)
 * 
 * @param {number} rupees - Amount in rupees
 * @returns {number} - Amount in paise
 */
export const rupeesToPaise = (rupees) => {
  return Math.round(Number(rupees) * 100);
};

/**
 * Convert paise to rupees
 * 
 * @param {number} paise - Amount in paise
 * @returns {number} - Amount in rupees
 */
export const paiseToRupees = (paise) => {
  return Number(paise) / 100;
};

/**
 * Get billing breakdown for order
 * 
 * @param {Object} order - Order object from database
 * @returns {Object} - Billing breakdown
 */
export const getOrderBillingBreakdown = (order) => {
  return {
    subtotal: getOrderSubtotal(order),
    gst: getOrderGST(order),
    gst_5: order.gst_5_total ? Number(order.gst_5_total) : 0,
    gst_18: order.gst_18_total ? Number(order.gst_18_total) : 0,
    shipping: getOrderShipping(order),
    total: getOrderTotal(order),
  };
};

/**
 * Validate billing consistency
 * Logs warning if order_total doesn't match expected calculation
 * 
 * @param {Object} order - Order object from database
 * @returns {boolean} - True if consistent
 */
export const validateBillingConsistency = (order) => {
  if (!order) return false;

  const breakdown = getOrderBillingBreakdown(order);
  const calculated = breakdown.subtotal + breakdown.gst + breakdown.shipping;
  const diff = Math.abs(breakdown.total - calculated);

  // Allow 0.01 difference for rounding
  if (diff > 0.01) {
    console.warn('⚠️ BILLING INCONSISTENCY DETECTED:', {
      order_id: order.id || order.order_id,
      recorded_total: breakdown.total,
      calculated_total: calculated,
      difference: diff,
      breakdown,
    });
    return false;
  }

  return true;
};

export default {
  getOrderTotal,
  getOrderSubtotal,
  getOrderGST,
  getOrderShipping,
  formatPrice,
  rupeesToPaise,
  paiseToRupees,
  getOrderBillingBreakdown,
  validateBillingConsistency,
};
