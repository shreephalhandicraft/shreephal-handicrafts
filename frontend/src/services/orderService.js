import { supabase } from '@/lib/supabaseClient';

/**
 * ✅ FIX ARCH #3: Business Logic Extraction
 * 
 * Pure business logic functions for order management.
 * No React dependencies, fully testable in isolation.
 */

/**
 * Calculate order totals
 * @param {Array} cartItems - Cart items with price and quantity
 * @returns {Object} { subtotal, tax, total }
 */
export const calculateOrderTotals = (cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.priceWithGst || item.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);

  const tax = 0; // GST already included in priceWithGst
  const total = subtotal + tax;

  return { subtotal, tax, total };
};

/**
 * Validate cart items before checkout
 * @param {Array} cartItems - Cart items to validate
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateCartItems = (cartItems) => {
  const errors = [];

  if (!cartItems || cartItems.length === 0) {
    errors.push({ code: 'CART_EMPTY', message: 'Cart is empty' });
    return { valid: false, errors };
  }

  cartItems.forEach((item, index) => {
    if (!item.variantId) {
      errors.push({
        code: 'MISSING_VARIANT',
        message: `Item ${index + 1}: Missing variant ID`,
        item,
      });
    }
    if (!item.price || item.price <= 0) {
      errors.push({
        code: 'INVALID_PRICE',
        message: `Item ${index + 1}: Invalid price`,
        item,
      });
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push({
        code: 'INVALID_QUANTITY',
        message: `Item ${index + 1}: Invalid quantity`,
        item,
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
        message: `Product variant not found: ${item.name}`,
        item,
      });
      continue;
    }

    if (!variant.is_active) {
      issues.push({
        code: 'VARIANT_INACTIVE',
        message: `Product is no longer available: ${item.name}`,
        item,
      });
      continue;
    }

    if (variant.stock_quantity < item.quantity) {
      issues.push({
        code: 'INSUFFICIENT_STOCK',
        message: `Only ${variant.stock_quantity} available for: ${item.name}`,
        item,
        available: variant.stock_quantity,
        requested: item.quantity,
      });
    }
  }

  return { available: issues.length === 0, issues };
};

/**
 * Create order record
 * @param {Object} orderData - Order information
 * @param {string} userId - User ID
 * @param {number} totalAmount - Total order amount
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData, userId, totalAmount) => {
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total_amount: totalAmount,
      payment_method: orderData.paymentMethod,
      payment_status: orderData.paymentMethod === 'cod' ? 'pending' : 'pending',
      order_status: 'pending',
      shipping_address: orderData.shippingAddress,
      billing_address: orderData.billingAddress,
      contact_phone: orderData.phone,
      contact_email: orderData.email,
      notes: orderData.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return order;
};

/**
 * Create order items
 * @param {string} orderId - Order ID
 * @param {Array} cartItems - Cart items to add to order
 * @returns {Promise<Array>} Created order items
 */
export const createOrderItems = async (orderId, cartItems) => {
  const orderItems = cartItems.map(item => ({
    order_id: orderId,
    product_variant_id: item.variantId,
    quantity: item.quantity,
    price_at_purchase: item.priceWithGst || item.price,
    customization_details: item.customization || null,
  }));

  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Decrement stock for order items with rollback on failure
 * @param {Array} cartItems - Items to decrement stock for
 * @returns {Promise<void>}
 */
export const decrementStock = async (cartItems) => {
  const updatedVariants = [];

  try {
    for (const item of cartItems) {
      // Get current stock
      const { data: variant, error: fetchError } = await supabase
        .from('product_variants')
        .select('stock_quantity')
        .eq('id', item.variantId)
        .single();

      if (fetchError) throw fetchError;

      const newStock = variant.stock_quantity - item.quantity;

      if (newStock < 0) {
        throw new Error(`Insufficient stock for variant ${item.variantId}`);
      }

      // Update stock
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ stock_quantity: newStock })
        .eq('id', item.variantId);

      if (updateError) throw updateError;

      // Track for rollback
      updatedVariants.push({
        variantId: item.variantId,
        previousStock: variant.stock_quantity,
        newStock,
      });
    }
  } catch (error) {
    // Rollback stock changes
    console.error('❌ Stock decrement failed, rolling back...', error);
    await rollbackStockChanges(updatedVariants);
    throw error;
  }
};

/**
 * Rollback stock changes on error
 * @param {Array} updatedVariants - Variants to rollback
 * @returns {Promise<void>}
 */
const rollbackStockChanges = async (updatedVariants) => {
  for (const variant of updatedVariants) {
    await supabase
      .from('product_variants')
      .update({ stock_quantity: variant.previousStock })
      .eq('id', variant.variantId);
  }
  console.log('✅ Stock rollback completed');
};

/**
 * Complete order creation flow (orchestrator function)
 * @param {Object} orderData - Order information
 * @param {Array} cartItems - Cart items
 * @param {string} userId - User ID
 * @returns {Promise<Object>} { order, orderItems }
 */
export const processOrder = async (orderData, cartItems, userId) => {
  // 1. Validate cart
  const validation = validateCartItems(cartItems);
  if (!validation.valid) {
    throw new Error(validation.errors[0].message);
  }

  // 2. Check stock availability
  const stockCheck = await checkStockAvailability(cartItems);
  if (!stockCheck.available) {
    const issue = stockCheck.issues[0];
    const error = new Error(issue.message);
    error.code = issue.code;
    throw error;
  }

  // 3. Calculate totals
  const { total } = calculateOrderTotals(cartItems);

  // 4. Create order
  const order = await createOrder(orderData, userId, total);

  // 5. Create order items
  const orderItems = await createOrderItems(order.id, cartItems);

  // 6. Decrement stock
  await decrementStock(cartItems);

  return { order, orderItems };
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
    .select('product_variant_id, quantity')
    .eq('order_id', orderId);

  if (fetchError) throw fetchError;

  // Restore stock
  for (const item of orderItems) {
    const { data: variant } = await supabase
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', item.product_variant_id)
      .single();

    if (variant) {
      await supabase
        .from('product_variants')
        .update({ stock_quantity: variant.stock_quantity + item.quantity })
        .eq('id', item.product_variant_id);
    }
  }

  // Update order status
  await supabase
    .from('orders')
    .update({ order_status: 'cancelled' })
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
