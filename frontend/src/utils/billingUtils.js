/**
 * ✅ CENTRALIZED BILLING SYSTEM
 * All billing calculations across the project use this single source of truth.
 * 
 * GST RULES:
 * - If product.gst_5pct = true → Apply 5% GST
 * - If product.gst_18pct = true → Apply 18% GST  
 * - If both false/null → No GST (0%)
 * 
 * PRICE STRUCTURE:
 * - Base Price: Product's base price (without GST)
 * - GST Amount: Base Price × GST Rate
 * - Price with GST: Base Price + GST Amount
 * - Item Total: Price with GST × Quantity
 */

/**
 * Calculate GST rate from product flags
 * @param {Object} product - Product object with gst_5pct and gst_18pct fields
 * @returns {number} GST rate (0.05, 0.18, or 0)
 */
export const getGSTRate = (product) => {
  if (!product) return 0;
  
  // Priority: 5% > 18% > None
  if (product.gst_5pct === true) {
    return 0.05;
  } else if (product.gst_18pct === true) {
    return 0.18;
  }
  
  return 0;
};

/**
 * Get GST percentage display (5, 18, or 0)
 * @param {Object} product
 * @returns {number} GST percentage
 */
export const getGSTPercentage = (product) => {
  return Math.round(getGSTRate(product) * 100);
};

/**
 * Calculate GST amount for a product
 * @param {number} basePrice - Product's base price
 * @param {Object} product - Product object
 * @returns {number} GST amount
 */
export const calculateGSTAmount = (basePrice, product) => {
  const rate = getGSTRate(product);
  return Number((basePrice * rate).toFixed(2));
};

/**
 * Calculate price including GST
 * @param {number} basePrice - Product's base price
 * @param {Object} product - Product object
 * @returns {number} Price with GST
 */
export const calculatePriceWithGST = (basePrice, product) => {
  const gstAmount = calculateGSTAmount(basePrice, product);
  return Number((basePrice + gstAmount).toFixed(2));
};

/**
 * Calculate complete pricing breakdown for a single item
 * @param {Object} item - Cart item or order item
 * @param {Object} product - Product data (optional, can be part of item)
 * @returns {Object} Complete pricing breakdown
 */
export const calculateItemPricing = (item, product = null) => {
  const productData = product || item.product || item;
  const basePrice = Number(item.price || productData.price || 0);
  const quantity = Number(item.quantity || 1);
  
  const gstRate = getGSTRate(productData);
  const gstPercentage = Math.round(gstRate * 100);
  const gstAmount = Number((basePrice * gstRate).toFixed(2));
  const priceWithGST = Number((basePrice + gstAmount).toFixed(2));
  const itemTotal = Number((priceWithGST * quantity).toFixed(2));
  const itemGSTTotal = Number((gstAmount * quantity).toFixed(2));
  
  return {
    basePrice,
    gstRate,
    gstPercentage,
    gstAmount,
    priceWithGST,
    quantity,
    subtotal: Number((basePrice * quantity).toFixed(2)),
    itemGSTTotal,
    itemTotal,
  };
};

/**
 * Calculate order totals from array of items
 * @param {Array} items - Array of cart/order items
 * @returns {Object} Order totals breakdown
 */
export const calculateOrderTotals = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      subtotal: 0,
      totalGST: 0,
      gst5Total: 0,
      gst18Total: 0,
      noGSTTotal: 0,
      grandTotal: 0,
      itemCount: 0,
      totalQuantity: 0,
    };
  }
  
  let subtotal = 0;
  let totalGST = 0;
  let gst5Total = 0;
  let gst18Total = 0;
  let noGSTTotal = 0;
  let totalQuantity = 0;
  
  items.forEach(item => {
    const pricing = calculateItemPricing(item);
    
    subtotal += pricing.subtotal;
    totalGST += pricing.itemGSTTotal;
    totalQuantity += pricing.quantity;
    
    // Categorize by GST rate
    if (pricing.gstRate === 0.05) {
      gst5Total += pricing.itemGSTTotal;
    } else if (pricing.gstRate === 0.18) {
      gst18Total += pricing.itemGSTTotal;
    } else {
      noGSTTotal += pricing.subtotal;
    }
  });
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalGST: Number(totalGST.toFixed(2)),
    gst5Total: Number(gst5Total.toFixed(2)),
    gst18Total: Number(gst18Total.toFixed(2)),
    noGSTTotal: Number(noGSTTotal.toFixed(2)),
    grandTotal: Number((subtotal + totalGST).toFixed(2)),
    itemCount: items.length,
    totalQuantity,
  };
};

/**
 * Format currency for display
 * @param {number} amount
 * @param {string} currency - Default INR
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const symbol = currency === 'INR' ? '₹' : currency;
  return `${symbol}${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Get GST breakdown text for display
 * @param {Object} product
 * @returns {string} GST description
 */
export const getGSTDescription = (product) => {
  const rate = getGSTPercentage(product);
  
  if (rate === 5) {
    return 'GST @5%';
  } else if (rate === 18) {
    return 'GST @18%';
  }
  
  return 'No GST';
};

/**
 * Validate billing data
 * @param {Object} data - Billing data to validate
 * @returns {Object} Validation result
 */
export const validateBillingData = (data) => {
  const errors = [];
  
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push('No items in order');
  }
  
  if (data.items) {
    data.items.forEach((item, index) => {
      if (!item.price || Number(item.price) <= 0) {
        errors.push(`Item ${index + 1}: Invalid price`);
      }
      if (!item.quantity || Number(item.quantity) <= 0) {
        errors.push(`Item ${index + 1}: Invalid quantity`);
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Calculate item snapshot for order storage
 * This creates the snapshot data to store in order_items table
 * @param {Object} item - Cart item
 * @param {Object} product - Full product data from database
 * @returns {Object} Item snapshot for database
 */
export const createItemSnapshot = (item, product) => {
  const pricing = calculateItemPricing(item, product);
  
  return {
    product_id: item.productId || item.id || product.id,
    variant_id: item.variantId || null,
    quantity: pricing.quantity,
    
    // Snapshot data (frozen at order time)
    unit_price: pricing.priceWithGST, // Price customer pays per unit (with GST)
    base_price: pricing.basePrice,     // Base price without GST
    gst_rate: pricing.gstRate,         // 0.05, 0.18, or 0
    gst_amount: pricing.gstAmount,     // GST per unit
    item_total: pricing.itemTotal,      // Total for this line item
    
    // Product snapshot
    product_name: item.name || product.title,
    product_image: item.image || product.image_url,
    product_description: product.description || null,
    catalog_number: product.catalog_number || null,
    
    // Variant snapshot
    sku: item.variant?.sku || item.sku || null,
    size_display: item.variant?.sizeDisplay || item.size_display || null,
    
    // Customization
    customization_data: item.customization || null,
    production_notes: item.production_notes || null,
  };
};

export default {
  getGSTRate,
  getGSTPercentage,
  calculateGSTAmount,
  calculatePriceWithGST,
  calculateItemPricing,
  calculateOrderTotals,
  formatCurrency,
  getGSTDescription,
  validateBillingData,
  createItemSnapshot,
};
