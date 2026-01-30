/**
 * Billing Utilities
 * 
 * Centralized billing calculation logic with proper GST handling.
 * Ensures consistency across orders and order_items tables.
 * 
 * FORMULA:
 * - Item Subtotal (base_price) = Price without GST
 * - GST Amount = base_price × (gst_rate / 100)
 * - Item Total = base_price + GST Amount
 * - Order Subtotal = Sum of all item base_prices
 * - Order Total GST = Sum of all GST amounts
 * - Order Total = Order Subtotal + Order Total GST + Shipping
 */

/**
 * Get GST rate for a product category
 * @param {string} category - Product category
 * @returns {number} GST rate (5 or 18)
 */
export const getGSTRate = (category) => {
  // Handicraft items typically have 5% GST
  // Other items might have 18% GST
  const lowGSTCategories = ['handicrafts', 'handmade', 'art', 'decor'];
  
  if (category && lowGSTCategories.some(cat => 
    category.toLowerCase().includes(cat)
  )) {
    return 5;
  }
  
  return 18; // Default GST rate
};

/**
 * Calculate item-level billing
 * @param {Object} item - Order item
 * @param {number} item.price - Base price (without GST)
 * @param {number} item.quantity - Quantity
 * @param {number} item.gstRate - GST rate (5 or 18)
 * @returns {Object} Item billing details
 */
export const calculateItemBilling = (item) => {
  const { price, quantity, gstRate = 18 } = item;
  
  // Base price (without GST)
  const basePrice = parseFloat(price) || 0;
  
  // Calculate GST amount per unit
  const gstAmount = basePrice * (gstRate / 100);
  
  // Unit price with GST
  const unitPriceWithGst = basePrice + gstAmount;
  
  // Item totals
  const itemSubtotal = basePrice * quantity;
  const itemGstTotal = gstAmount * quantity;
  const itemTotal = itemSubtotal + itemGstTotal;
  
  return {
    base_price: roundTo2Decimals(basePrice),
    gst_rate: gstRate,
    gst_amount: roundTo2Decimals(gstAmount),
    unit_price_with_gst: roundTo2Decimals(unitPriceWithGst),
    item_subtotal: roundTo2Decimals(itemSubtotal),
    item_gst_total: roundTo2Decimals(itemGstTotal),
    item_total: roundTo2Decimals(itemTotal)
  };
};

/**
 * Calculate order-level billing from order items
 * @param {Array} orderItems - Array of order items with billing details
 * @param {number} shippingCost - Shipping cost (default: 0)
 * @returns {Object} Order billing details
 */
export const calculateOrderBilling = (orderItems, shippingCost = 0) => {
  let subtotal = 0;
  let gst5Total = 0;
  let gst18Total = 0;
  
  orderItems.forEach(item => {
    const itemBilling = item.billing || calculateItemBilling(item);
    
    subtotal += itemBilling.item_subtotal;
    
    // Separate GST by rate
    if (item.gstRate === 5 || itemBilling.gst_rate === 5) {
      gst5Total += itemBilling.item_gst_total;
    } else if (item.gstRate === 18 || itemBilling.gst_rate === 18) {
      gst18Total += itemBilling.item_gst_total;
    }
  });
  
  const totalGst = gst5Total + gst18Total;
  const orderTotal = subtotal + totalGst + shippingCost;
  
  return {
    subtotal: roundTo2Decimals(subtotal),
    gst_5_total: roundTo2Decimals(gst5Total),
    gst_18_total: roundTo2Decimals(gst18Total),
    total_gst: roundTo2Decimals(totalGst),
    shipping_cost: roundTo2Decimals(shippingCost),
    order_total: roundTo2Decimals(orderTotal),
    grand_total: roundTo2Decimals(orderTotal), // Same as order_total
    amount: roundTo2Decimals(orderTotal), // Same as order_total
    total_price: Math.round(orderTotal * 100) // In paise for legacy compatibility
  };
};

/**
 * Convert price from paise to rupees
 * @param {number} paise - Price in paise
 * @returns {number} Price in rupees
 */
export const paiseToRupees = (paise) => {
  return roundTo2Decimals((paise || 0) / 100);
};

/**
 * Convert price from rupees to paise
 * @param {number} rupees - Price in rupees
 * @returns {number} Price in paise
 */
export const rupeesToPaise = (rupees) => {
  return Math.round((rupees || 0) * 100);
};

/**
 * Round to 2 decimal places
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
export const roundTo2Decimals = (value) => {
  return Math.round((value || 0) * 100) / 100;
};

/**
 * Format currency for display
 * @param {number} amount - Amount in rupees
 * @param {boolean} showSymbol - Whether to show ₹ symbol
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, showSymbol = true) => {
  const formatted = roundTo2Decimals(amount).toFixed(2);
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Validate billing calculations
 * @param {Object} orderBilling - Order billing object
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateBilling = (orderBilling) => {
  const errors = [];
  
  const { subtotal, gst_5_total, gst_18_total, total_gst, shipping_cost, order_total } = orderBilling;
  
  // Check if total_gst matches sum of GST components
  const calculatedTotalGst = roundTo2Decimals(gst_5_total + gst_18_total);
  if (calculatedTotalGst !== total_gst) {
    errors.push({
      field: 'total_gst',
      message: `Total GST mismatch. Expected ${calculatedTotalGst}, got ${total_gst}`
    });
  }
  
  // Check if order_total matches formula
  const calculatedOrderTotal = roundTo2Decimals(subtotal + total_gst + shipping_cost);
  if (calculatedOrderTotal !== order_total) {
    errors.push({
      field: 'order_total',
      message: `Order total mismatch. Expected ${calculatedOrderTotal}, got ${order_total}`
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  getGSTRate,
  calculateItemBilling,
  calculateOrderBilling,
  paiseToRupees,
  rupeesToPaise,
  roundTo2Decimals,
  formatCurrency,
  validateBilling
};
