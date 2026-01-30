/**
 * COMPREHENSIVE BILLING UTILITIES
 * 
 * System-wide billing calculation logic with GST handling.
 * Ensures consistency across orders and order_items tables.
 * Handles backward compatibility and edge cases.
 * 
 * CORE FORMULA:
 *   order_total = subtotal + total_gst + shipping_cost
 * 
 * Where:
 *   - subtotal = Sum of base_prices (WITHOUT GST)
 *   - total_gst = gst_5_total + gst_18_total
 *   - shipping_cost = Delivery charges
 *   - total_price = order_total × 100 (in paise)
 */

/**
 * Get GST rate for a product category
 * @param {string} category - Product category
 * @returns {number} GST rate (5 or 18)
 */
export const getGSTRate = (category) => {
  // Handicraft items typically have 5% GST
  const lowGSTCategories = [
    'handicrafts', 
    'handmade', 
    'hand-made',
    'art', 
    'craft',
    'decor',
    'home-decor',
    'traditional'
  ];
  
  if (category) {
    const categoryLower = category.toLowerCase();
    if (lowGSTCategories.some(cat => categoryLower.includes(cat))) {
      return 5;
    }
  }
  
  return 18; // Default GST rate
};

/**
 * Get GST description for display
 * @param {number} gstRate - GST rate
 * @returns {string} Description
 */
export const getGSTDescription = (gstRate) => {
  if (gstRate === 5) return 'GST @5%';
  if (gstRate === 18) return 'GST @18%';
  if (gstRate === 0) return 'No GST';
  return `GST @${gstRate}%`;
};

/**
 * Extract base price from a price that may or may not include GST
 * This handles backward compatibility
 * 
 * @param {number} price - Price value
 * @param {number} gstRate - GST rate (5 or 18)
 * @param {boolean} includesGST - Whether price includes GST
 * @returns {number} Base price without GST
 */
export const extractBasePrice = (price, gstRate, includesGST = false) => {
  const numPrice = parseFloat(price) || 0;
  
  if (includesGST) {
    // Reverse calculate: base_price = price_with_gst / (1 + gst_rate/100)
    return roundTo2Decimals(numPrice / (1 + gstRate / 100));
  }
  
  return roundTo2Decimals(numPrice);
};

/**
 * Calculate item-level billing
 * Handles both prices with and without GST
 * 
 * @param {Object} params - Calculation parameters
 * @param {number} params.price - Price (can be with or without GST)
 * @param {number} params.quantity - Quantity
 * @param {number} params.gstRate - GST rate (5 or 18)
 * @param {boolean} params.priceIncludesGST - Whether price includes GST (default: false)
 * @returns {Object} Item billing details
 */
export const calculateItemBilling = ({ 
  price, 
  quantity, 
  gstRate = 18, 
  priceIncludesGST = false 
}) => {
  // Extract base price (without GST)
  const basePrice = extractBasePrice(price, gstRate, priceIncludesGST);
  
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
 * BACKWARD COMPATIBILITY: Calculate item pricing (old function name)
 * Used by InvoiceGenerator and other legacy components
 * 
 * @param {Object} item - Order item object
 * @returns {Object} Pricing details
 */
export const calculateItemPricing = (item) => {
  // Determine quantity
  const quantity = item.quantity || 1;
  
  // Determine GST rate
  const gstRate = item.gst_rate || item.gstRate || getGSTRate(item.category);
  
  // Determine price (try various field names for backward compatibility)
  let price = item.price || item.base_price || item.unit_price_with_gst || 0;
  let priceIncludesGST = false;
  
  // If price_at_order exists, use it (this is the price WITH GST)
  if (item.price_at_order) {
    price = item.price_at_order;
    priceIncludesGST = true;
  }
  // If priceWithGst exists, use it
  else if (item.priceWithGst) {
    price = item.priceWithGst;
    priceIncludesGST = true;
  }
  // If unit_price exists (in paise), convert it
  else if (item.unit_price) {
    price = item.unit_price / 100;
    priceIncludesGST = true;
  }
  
  // Calculate billing
  const billing = calculateItemBilling({
    price,
    quantity,
    gstRate,
    priceIncludesGST
  });
  
  // Return in format expected by legacy code
  return {
    quantity: quantity,
    basePrice: billing.base_price,
    gstPercentage: billing.gst_rate,
    gstAmount: billing.gst_amount,
    itemSubtotal: billing.item_subtotal,
    itemGSTTotal: billing.item_gst_total,
    itemTotal: billing.item_total,
    unitPriceWithGST: billing.unit_price_with_gst
  };
};

/**
 * Calculate order-level billing from order items
 * 
 * @param {Array} orderItems - Array of items with billing details
 * @param {number} shippingCost - Shipping cost (default: 0)
 * @returns {Object} Order billing details
 */
export const calculateOrderBilling = (orderItems, shippingCost = 0) => {
  let subtotal = 0;
  let gst5Total = 0;
  let gst18Total = 0;
  
  orderItems.forEach(item => {
    const itemBilling = item.billing || calculateItemBilling({
      price: item.price || item.basePrice || item.unit_price_with_gst,
      quantity: item.quantity,
      gstRate: item.gstRate || item.gst_rate || 18,
      priceIncludesGST: item.priceIncludesGST || false
    });
    
    subtotal += itemBilling.item_subtotal;
    
    // Separate GST by rate
    if ((item.gstRate || item.gst_rate || itemBilling.gst_rate) === 5) {
      gst5Total += itemBilling.item_gst_total;
    } else {
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
    grand_total: roundTo2Decimals(orderTotal),
    amount: roundTo2Decimals(orderTotal),
    total_price: Math.round(orderTotal * 100)
  };
};

/**
 * BACKWARD COMPATIBILITY: Calculate order totals (old function name)
 * Used by InvoiceGenerator and other legacy components
 * 
 * @param {Array} items - Order items
 * @param {number} shippingCost - Shipping cost
 * @returns {Object} Totals in legacy format
 */
export const calculateOrderTotals = (items, shippingCost = 0) => {
  const billing = calculateOrderBilling(items, shippingCost);
  
  // Return in format expected by legacy code
  return {
    subtotal: billing.subtotal,
    gst5Total: billing.gst_5_total,
    gst18Total: billing.gst_18_total,
    totalGST: billing.total_gst,
    shippingCost: billing.shipping_cost,
    grandTotal: billing.order_total,
    total: billing.order_total,
    orderTotal: billing.order_total
  };
};

/**
 * Recalculate order billing from database values
 * Useful for fixing existing orders
 * 
 * @param {Object} order - Order object from database
 * @returns {Object} Corrected billing
 */
export const recalculateOrderBilling = (order) => {
  const subtotal = parseFloat(order.subtotal) || 0;
  const totalGst = parseFloat(order.total_gst) || 0;
  const shippingCost = parseFloat(order.shipping_cost) || 0;
  
  // If total_gst is missing but gst_5 and gst_18 exist
  let calculatedTotalGst = totalGst;
  if (!totalGst && (order.gst_5_total || order.gst_18_total)) {
    calculatedTotalGst = (parseFloat(order.gst_5_total) || 0) + 
                         (parseFloat(order.gst_18_total) || 0);
  }
  
  const orderTotal = subtotal + calculatedTotalGst + shippingCost;
  
  return {
    subtotal: roundTo2Decimals(subtotal),
    gst_5_total: roundTo2Decimals(parseFloat(order.gst_5_total) || 0),
    gst_18_total: roundTo2Decimals(parseFloat(order.gst_18_total) || 0),
    total_gst: roundTo2Decimals(calculatedTotalGst),
    shipping_cost: roundTo2Decimals(shippingCost),
    order_total: roundTo2Decimals(orderTotal),
    grand_total: roundTo2Decimals(orderTotal),
    amount: roundTo2Decimals(orderTotal),
    total_price: Math.round(orderTotal * 100)
  };
};

/**
 * Convert price from paise to rupees
 */
export const paiseToRupees = (paise) => {
  return roundTo2Decimals((paise || 0) / 100);
};

/**
 * Convert price from rupees to paise
 */
export const rupeesToPaise = (rupees) => {
  return Math.round((rupees || 0) * 100);
};

/**
 * Round to 2 decimal places
 */
export const roundTo2Decimals = (value) => {
  return Math.round((value || 0) * 100) / 100;
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount, showSymbol = true) => {
  const formatted = roundTo2Decimals(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Validate billing calculations
 */
export const validateBilling = (orderBilling) => {
  const errors = [];
  
  const { 
    subtotal, 
    gst_5_total, 
    gst_18_total, 
    total_gst, 
    shipping_cost, 
    order_total 
  } = orderBilling;
  
  // Check if total_gst matches sum of GST components
  const calculatedTotalGst = roundTo2Decimals(
    (gst_5_total || 0) + (gst_18_total || 0)
  );
  
  if (Math.abs(calculatedTotalGst - (total_gst || 0)) > 0.01) {
    errors.push({
      field: 'total_gst',
      message: `Total GST mismatch. Expected ${calculatedTotalGst}, got ${total_gst}`
    });
  }
  
  // Check if order_total matches formula
  const calculatedOrderTotal = roundTo2Decimals(
    (subtotal || 0) + (total_gst || 0) + (shipping_cost || 0)
  );
  
  if (Math.abs(calculatedOrderTotal - (order_total || 0)) > 0.01) {
    errors.push({
      field: 'order_total',
      message: `Order total mismatch. Expected ${calculatedOrderTotal}, got ${order_total}`,
      expected: calculatedOrderTotal,
      actual: order_total
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    correctedValues: {
      total_gst: calculatedTotalGst,
      order_total: calculatedOrderTotal,
      total_price: Math.round(calculatedOrderTotal * 100)
    }
  };
};

/**
 * Auto-fix billing object
 * Returns corrected billing values
 */
export const autoFixBilling = (orderBilling) => {
  const validation = validateBilling(orderBilling);
  
  if (validation.valid) {
    return orderBilling;
  }
  
  // Return corrected values
  return {
    ...orderBilling,
    ...validation.correctedValues
  };
};

export default {
  getGSTRate,
  getGSTDescription,
  extractBasePrice,
  calculateItemBilling,
  calculateItemPricing,  // Backward compatibility
  calculateOrderBilling,
  calculateOrderTotals,  // Backward compatibility
  recalculateOrderBilling,
  paiseToRupees,
  rupeesToPaise,
  roundTo2Decimals,
  formatCurrency,
  validateBilling,
  autoFixBilling
};
