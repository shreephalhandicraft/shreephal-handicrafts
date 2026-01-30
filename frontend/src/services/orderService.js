import { supabase } from '@/lib/supabaseClient';
import { 
  calculateItemBilling, 
  calculateOrderBilling, 
  getGSTRate,
  roundTo2Decimals 
} from '@/utils/billingUtils';

/**
 * ✅ BILLING FIX: Consistent GST-separated calculations
 * ✅ FIX ARCH #3: Business Logic Extraction
 * ✅ FIX CRITICAL BUG #2: Stock Race Condition (Using DB RPC)
 * 
 * Pure business logic functions for order management.
 * No React dependencies, fully testable in isolation.
 */

/**
 * Calculate order totals with proper GST separation
 * @param {Array} cartItems - Cart items with price and quantity
 * @param {number} shippingCost - Shipping cost (optional)
 * @returns {Object} { subtotal, gst_5_total, gst_18_total, total_gst, shipping_cost, order_total }
 */
export const calculateOrderTotals = (cartItems, shippingCost = null) => {
  // Prepare items with billing details
  const itemsWithBilling = cartItems.map(item => {
    // Determine GST rate (from item or category)
    const gstRate = item.gstRate || getGSTRate(item.category);
    
    return {
      ...item,
      gstRate,
      billing: calculateItemBilling({
        price: item.price || item.basePrice,
        quantity: item.quantity,
        gstRate
      })
    };
  });
  
  // Calculate shipping if not provided
  let shipping = shippingCost;
  if (shipping === null) {
    // Get subtotal for shipping calculation
    const tempSubtotal = itemsWithBilling.reduce((sum, item) => 
      sum + item.billing.item_subtotal, 0
    );
    // Free shipping over ₹500
    shipping = tempSubtotal >= 500 ? 0 : 50;
  }
  
  // Calculate order billing
  return calculateOrderBilling(itemsWithBilling, shipping);
};

/**
 * Validate cart items before checkout
 * @param {Array} cartItems - Cart items to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateCartItems = (cartItems) => {
  const errors = [];

  if (!cartItems || cartItems.length === 0) {
    errors.push({ 
      code: 'CART_EMPTY', 
      message: 'Your cart is empty. Add items to continue.' 
    });
    return { valid: false, errors };
  }

  cartItems.forEach((item, index) => {
    if (!item.variantId) {
      errors.push({
        code: 'MISSING_VARIANT',
        message: `"${item.name || 'Item ' + (index + 1)}" is missing size/variant selection. Please select a variant.`,
        item: item.name || `Item ${index + 1}`,
      });
    }
    if (!item.price || item.price <= 0) {
      errors.push({
        code: 'INVALID_PRICE',
        message: `"${item.name || 'Item ' + (index + 1)}" has invalid price. Please contact support.`,
        item: item.name || `Item ${index + 1}`,
      });
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push({
        code: 'INVALID_QUANTITY',
        message: `"${item.name || 'Item ' + (index + 1)}" has invalid quantity. Please update quantity.`,
        item: item.name || `Item ${index + 1}`,
      });
    }
  });

  return { valid: errors.length === 0, errors };
};

/**
 * Check stock availability for cart items
 * @param {Array} cartItems - Cart items to check
 * @returns {Promise<Object>} { available: boolean, issues: Array }
 */
export const checkStockAvailability = async (cartItems) => {
  const issues = [];

  for (const item of cartItems) {
    const { data: variant, error } = await supabase
      .from('product_variants')
      .select('stock_quantity, is_active')
      .eq('id', item.variantId)
      .single();

    if (error || !variant) {
      issues.push({
        code: 'VARIANT_NOT_FOUND',
        message: `"${item.name}" is no longer available. Please remove it from cart.`,
        item: item.name,
      });
      continue;
    }

    if (!variant.is_active) {
      issues.push({
        code: 'VARIANT_INACTIVE',
        message: `"${item.name}" is currently unavailable. Please remove it from cart.`,
        item: item.name,
      });
      continue;
    }

    if (variant.stock_quantity < item.quantity) {
      issues.push({
        code: 'INSUFFICIENT_STOCK',
        message: `Only ${variant.stock_quantity} unit${variant.stock_quantity !== 1 ? 's' : ''} of "${item.name}" available. You requested ${item.quantity}.`,
        item: item.name,
        available: variant.stock_quantity,
        requested: item.quantity,
      });
    }
  }

  return { available: issues.length === 0, issues };
};

/**
 * Create order record with proper billing fields
 * @param {Object} orderData - Order information
 * @param {string} userId - User ID
 * @param {string} customerId - Customer ID
 * @param {Object} totals - Order totals from calculateOrderTotals()
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData, userId, customerId, totals) => {
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      customer_id: customerId,
      
      // Billing fields (properly separated)
      subtotal: totals.subtotal,
      gst_5_total: totals.gst_5_total,
      gst_18_total: totals.gst_18_total,
      total_gst: totals.total_gst,
      shipping_cost: totals.shipping_cost,
      order_total: totals.order_total,
      grand_total: totals.grand_total,
      amount: totals.amount,
      total_price: totals.total_price, // In paise
      
      // Order details
      status: 'pending',
      payment_method: orderData.paymentMethod,
      payment_status: orderData.paymentMethod === 'cod' ? 'pending' : 'pending',
      
      // Shipping info
      shipping_info: orderData.shippingAddress,
      
      // Other fields
      order_notes: orderData.notes || null,
      items: [], // Will be populated via order_items table
    })
    .select()
    .single();

  if (error) throw error;
  return order;
};

/**
 * Create order items with proper billing fields
 * @param {string} orderId - Order ID
 * @param {Array} cartItems - Cart items to add to order
 * @returns {Promise<Array>} Created order items
 */
export const createOrderItems = async (orderId, cartItems) => {
  const orderItems = cartItems.map(item => {
    // Determine GST rate
    const gstRate = item.gstRate || getGSTRate(item.category);
    
    // Calculate item billing
    const billing = calculateItemBilling({
      price: item.price || item.basePrice,
      quantity: item.quantity,
      gstRate
    });
    
    return {
      order_id: orderId,
      product_id: item.productId,
      variant_id: item.variantId,
      catalog_number: item.catalogNumber,
      quantity: item.quantity,
      
      // Billing fields
      base_price: billing.base_price,
      gst_rate: billing.gst_rate,
      gst_amount: billing.gst_amount,
      unit_price_with_gst: billing.unit_price_with_gst,
      item_subtotal: billing.item_subtotal,
      item_gst_total: billing.item_gst_total,
      item_total: billing.item_total,
      
      // Legacy fields for compatibility
      unit_price: Math.round(billing.unit_price_with_gst * 100), // In paise
      total_price: Math.round(billing.item_total * 100), // In paise
      price_at_order: billing.unit_price_with_gst,
      
      // Product info snapshot
      product_name: item.name,
      product_image_url: item.image,
      variant_sku: item.sku,
      
      // Customization
      customization_data: item.customization || null,
      customization_snapshot: item.customization || null,
    };
  });

  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (error) throw error;
  return data;
};

/**
 * ✅ FIX CRITICAL BUG #2: Stock Race Condition
 * 
 * OLD APPROACH (Race Condition):
 * 1. Read stock
 * 2. Calculate new stock
 * 3. Update stock
 * Problem: 2 users can read same stock simultaneously
 * 
 * NEW APPROACH (Atomic):
 * Use database RPC function that handles locking internally
 * 
 * Decrement stock for order items (Race-condition safe)
 * @param {Array} cartItems - Items to decrement stock for
 * @returns {Promise<void>}
 */
export const decrementStock = async (cartItems) => {
  const failures = [];

  for (const item of cartItems) {
    try {
      // ✅ Use database RPC function (atomic operation)
      const { data, error } = await supabase.rpc('decrement_variant_stock', {
        p_variant_id: item.variantId,
        p_quantity: item.quantity
      });

      // Check if function returned false (insufficient stock)
      if (error || data === false) {
        failures.push({
          variantId: item.variantId,
          name: item.name,
          error: error?.message || 'Insufficient stock'
        });
      }
    } catch (error) {
      failures.push({
        variantId: item.variantId,
        name: item.name,
        error: error.message
      });
    }
  }

  // If any failures, throw error
  if (failures.length > 0) {
    const errorMsg = failures
      .map(f => `${f.name}: ${f.error}`)
      .join(', ');
    throw new Error(`Stock update failed: ${errorMsg}`);
  }
};

/**
 * Complete order creation flow (orchestrator function)
 * @param {Object} orderData - Order information
 * @param {Array} cartItems - Cart items
 * @param {string} userId - User ID
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} { order, orderItems }
 */
export const processOrder = async (orderData, cartItems, userId, customerId) => {
  // 1. Validate cart
  const validation = validateCartItems(cartItems);
  if (!validation.valid) {
    const error = new Error(validation.errors[0].message);
    error.code = validation.errors[0].code;
    error.item = validation.errors[0].item;
    throw error;
  }

  // 2. Check stock availability
  const stockCheck = await checkStockAvailability(cartItems);
  if (!stockCheck.available) {
    const issue = stockCheck.issues[0];
    const error = new Error(issue.message);
    error.code = issue.code;
    error.item = issue.item;
    throw error;
  }

  // 3. Calculate totals (with proper GST separation)
  const totals = calculateOrderTotals(cartItems);

  // 4. Create order
  const order = await createOrder(orderData, userId, customerId, totals);

  try {
    // 5. Create order items
    const orderItems = await createOrderItems(order.id, cartItems);

    // 6. Decrement stock (atomic, race-condition safe)
    await decrementStock(cartItems);

    return { order, orderItems };
  } catch (error) {
    // Rollback: Delete order if items/stock failed
    console.error('❌ Order processing failed, rolling back order...', error);
    await supabase.from('orders').delete().eq('id', order.id);
    throw error;
  }
};

/**
 * Cancel order and restore stock
 * @param {string} orderId - Order ID to cancel
 * @returns {Promise<void>}
 */
export const cancelOrder = async (orderId) => {
  // Get order items
  const { data: orderItems, error: fetchError } = await supabase
    .from('order_items')
    .select('variant_id, quantity')
    .eq('order_id', orderId);

  if (fetchError) throw fetchError;

  // Restore stock
  for (const item of orderItems) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', item.variant_id)
      .single();

    if (variant) {
      await supabase
        .from('product_variants')
        .update({ stock_quantity: variant.stock_quantity + item.quantity })
        .eq('id', item.variant_id);
    }
  }

  // Update order status
  await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);
};

export default {
  calculateOrderTotals,
  validateCartItems,
  checkStockAvailability,
  createOrder,
  createOrderItems,
  decrementStock,
  processOrder,
  cancelOrder,
};
