import { supabase } from '@/lib/supabaseClient';

/**
 * ✅ FIX ARCH #3: Business Logic Extraction
 * ✅ FIX CRITICAL BUG #2: Stock Race Condition (Using DB RPC)
 * 
 * Pure business logic functions for order management.
 * No React dependencies, fully testable in isolation.
 */

/**
 * Calculate order totals
 * @param {Array} cartItems - Cart items with price and quantity
 * @returns {Object} { subtotal, shipping, tax, total }
 */
export const calculateOrderTotals = (cartItems) => {
  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = item.priceWithGst || item.price || 0;
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Free shipping over ₹500
  const shipping = subtotal >= 500 ? 0 : 50;
  const tax = 0; // GST already included in priceWithGst
  const total = subtotal + shipping + tax;

  return { subtotal, shipping, tax, total };
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
 * Create order record
 * @param {Object} orderData - Order information
 * @param {string} userId - User ID
 * @param {Object} totals - Order totals { subtotal, shipping, total }
 * @returns {Promise<Object>} Created order
 */
export const createOrder = async (orderData, userId, totals) => {
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      total_amount: totals.total,
      shipping_amount: totals.shipping,
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
 * @returns {Promise<Object>} { order, orderItems }
 */
export const processOrder = async (orderData, cartItems, userId) => {
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

  // 3. Calculate totals
  const totals = calculateOrderTotals(cartItems);

  // 4. Create order
  const order = await createOrder(orderData, userId, totals);

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
