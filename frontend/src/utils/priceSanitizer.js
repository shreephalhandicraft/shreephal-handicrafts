/**
 * PRICE SANITIZER UTILITY
 * 
 * Ensures all prices are clean numbers before database insertion.
 * Strips currency symbols, commas, and other formatting.
 * 
 * Use this before inserting any price into the database to prevent
 * "invalid input syntax for type integer" errors.
 */

/**
 * Clean and parse a price value to ensure it's a valid number
 * 
 * @param {any} price - Price value (can be string with ₹ symbol, number, etc.)
 * @param {number} defaultValue - Default value if parsing fails (default: 0)
 * @returns {number} Clean numeric value
 */
export const sanitizePrice = (price, defaultValue = 0) => {
  // If already a valid number
  if (typeof price === 'number' && !isNaN(price)) {
    return Math.round(price * 100) / 100; // Round to 2 decimals
  }
  
  // If string, strip all formatting
  if (typeof price === 'string') {
    // Remove currency symbols (₹, $, etc.), commas, spaces
    const cleaned = price
      .replace(/₹/g, '')
      .replace(/\$/g, '')
      .replace(/,/g, '')
      .replace(/\s/g, '')
      .trim();
    
    const parsed = parseFloat(cleaned);
    
    if (!isNaN(parsed) && isFinite(parsed)) {
      return Math.round(parsed * 100) / 100; // Round to 2 decimals
    }
  }
  
  // If null/undefined/invalid, return default
  console.warn(`⚠️ Invalid price value: ${price}, using default: ${defaultValue}`);
  return defaultValue;
};

/**
 * Sanitize an entire order item object
 * Ensures all price fields are clean numbers
 * 
 * @param {Object} item - Order item object
 * @returns {Object} Sanitized order item
 */
export const sanitizeOrderItem = (item) => {
  return {
    ...item,
    base_price: sanitizePrice(item.base_price),
    gst_amount: sanitizePrice(item.gst_amount),
    item_subtotal: sanitizePrice(item.item_subtotal),
    item_gst_total: sanitizePrice(item.item_gst_total),
    item_total: sanitizePrice(item.item_total),
    unit_price: sanitizePrice(item.unit_price),
    total_price: sanitizePrice(item.total_price),
  };
};

/**
 * Sanitize an entire order object
 * Ensures all price fields are clean numbers
 * 
 * @param {Object} order - Order object
 * @returns {Object} Sanitized order
 */
export const sanitizeOrder = (order) => {
  return {
    ...order,
    subtotal: sanitizePrice(order.subtotal),
    total_gst: sanitizePrice(order.total_gst),
    gst_5_total: sanitizePrice(order.gst_5_total),
    gst_18_total: sanitizePrice(order.gst_18_total),
    shipping_cost: sanitizePrice(order.shipping_cost),
    order_total: sanitizePrice(order.order_total),
    total_price: sanitizePrice(order.total_price),
    amount: sanitizePrice(order.amount),
  };
};

export default {
  sanitizePrice,
  sanitizeOrderItem,
  sanitizeOrder
};
