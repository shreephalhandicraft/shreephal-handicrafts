import { supabase } from "@/lib/supabaseClient";

/**
 * Custom hook for managing stock reservations
 * 
 * Purpose: Prevent overselling by reserving stock when adding to cart
 * Reservations expire in 15 minutes if not confirmed
 * 
 * @returns {Object} Reservation management functions
 */
export function useStockReservation() {
  /**
   * Reserve stock when adding item to cart
   * 
   * @param {string} variantId - UUID of product variant
   * @param {number} quantity - Quantity to reserve
   * @param {string} userId - UUID of user making reservation
   * @param {string|null} orderId - Optional order ID
   * @returns {Promise<string>} reservationId
   * @throws {Error} If reservation fails
   */
  const reserveStock = async (variantId, quantity, userId, orderId = null) => {
    try {
      console.log(`📦 Reserving stock: variant=${variantId}, quantity=${quantity}`);

      if (!variantId || !userId) {
        throw new Error('variantId and userId are required');
      }

      if (!quantity || quantity <= 0) {
        throw new Error('Quantity must be positive');
      }

      const { data: reservationId, error } = await supabase.rpc(
        'reserve_variant_stock',
        {
          p_variant_id: variantId,
          p_user_id: userId,
          p_quantity: quantity,
          p_order_id: orderId,
        }
      );

      if (error) {
        console.error('❌ Reserve stock failed:', error);
        
        // Parse user-friendly error messages
        if (error.message.includes('Insufficient stock')) {
          const match = error.message.match(/Available: (\d+), Requested: (\d+)/);
          if (match) {
            throw new Error(
              `Only ${match[1]} items available. You requested ${match[2]}.`
            );
          }
          throw new Error('Insufficient stock available');
        } else if (error.message.includes('Reserved stock')) {
          throw new Error(
            'Item currently in other users\' carts. Please try again in a few minutes.'
          );
        } else if (error.message.includes('Variant not found')) {
          throw new Error('Product variant not found');
        }
        
        throw new Error(error.message || 'Failed to reserve stock');
      }

      if (!reservationId) {
        throw new Error('No reservation ID returned');
      }

      console.log(`✅ Stock reserved: reservationId=${reservationId}`);
      return reservationId;
      
    } catch (error) {
      console.error('❌ reserveStock error:', error);
      throw error;
    }
  };

  /**
   * Confirm a single stock reservation (decrements stock)
   * 
   * @param {string} reservationId - UUID of reservation to confirm
   * @returns {Promise<boolean>} true if confirmed successfully
   * @throws {Error} If confirmation fails
   */
  const confirmReservation = async (reservationId) => {
    try {
      console.log(`✅ Confirming reservation: ${reservationId}`);

      if (!reservationId) {
        throw new Error('reservationId is required');
      }

      const { data, error } = await supabase.rpc(
        'confirm_stock_reservation',
        {
          p_reservation_id: reservationId,
        }
      );

      if (error) {
        console.error('❌ Confirm reservation failed:', error);
        
        if (error.message.includes('Reservation expired')) {
          throw new Error(
            'Reservation has expired. Please refresh your cart and try again.'
          );
        } else if (error.message.includes('not found')) {
          throw new Error('Reservation not found');
        } else if (error.message.includes('already confirmed')) {
          console.warn('⚠️ Reservation already confirmed (idempotent)');
          return true; // Already confirmed is success
        }
        
        throw new Error(error.message || 'Failed to confirm reservation');
      }

      if (data !== true) {
        throw new Error('Reservation confirmation returned false');
      }

      console.log(`✅ Reservation confirmed: ${reservationId}`);
      return true;
      
    } catch (error) {
      console.error('❌ confirmReservation error:', error);
      throw error;
    }
  };

  /**
   * Confirm multiple reservations atomically (all-or-nothing)
   * 
   * @param {string[]} reservationIds - Array of reservation UUIDs
   * @returns {Promise<{success: boolean, confirmedCount: number}>}
   * @throws {Error} If any confirmation fails (all rolled back)
   */
  const confirmMultipleReservations = async (reservationIds) => {
    try {
      console.log(`🎯 Batch confirming ${reservationIds.length} reservations`);

      if (!reservationIds || reservationIds.length === 0) {
        throw new Error('reservationIds array cannot be empty');
      }

      // Filter out null/undefined
      const validIds = reservationIds.filter(id => id);
      
      if (validIds.length === 0) {
        throw new Error('No valid reservation IDs provided');
      }

      if (validIds.length !== reservationIds.length) {
        console.warn(`⚠️ Filtered out ${reservationIds.length - validIds.length} invalid IDs`);
      }

      const { data, error } = await supabase.rpc(
        'confirm_multiple_reservations',
        {
          p_reservation_ids: validIds,
        }
      );

      if (error) {
        console.error('❌ Batch confirm failed:', error);
        
        // Parse error details if available
        if (error.message.includes('Batch confirmation failed')) {
          try {
            const errorMatch = error.message.match(/Errors: (\[.*\])/);
            if (errorMatch) {
              const errors = JSON.parse(errorMatch[1]);
              const errorMessages = errors.map(
                e => `${e.reservation_id}: ${e.error}`
              ).join('; ');
              
              throw new Error(
                `Some items could not be confirmed: ${errorMessages}`
              );
            }
          } catch (parseError) {
            // Fallback if JSON parsing fails
          }
        }
        
        throw new Error(
          error.message || 'Failed to confirm reservations. Please try again.'
        );
      }

      if (!data || !data.success) {
        throw new Error('Batch confirmation returned failure');
      }

      console.log(`✅ Batch confirmed: ${data.confirmed_count} reservations`);
      return {
        success: true,
        confirmedCount: data.confirmed_count,
      };
      
    } catch (error) {
      console.error('❌ confirmMultipleReservations error:', error);
      throw error;
    }
  };

  /**
   * Cancel a reservation (releases stock immediately)
   * 
   * @param {string} reservationId - UUID of reservation to cancel
   * @returns {Promise<boolean>} true if cancelled, false if not found
   */
  const cancelReservation = async (reservationId) => {
    try {
      console.log(`❌ Cancelling reservation: ${reservationId}`);

      if (!reservationId) {
        console.warn('⚠️ No reservationId provided for cancellation');
        return false;
      }

      const { data, error } = await supabase.rpc(
        'cancel_reservation',
        {
          p_reservation_id: reservationId,
        }
      );

      if (error) {
        console.error('❌ Cancel reservation failed:', error);
        // Don't throw - cancellation failure is not critical
        return false;
      }

      if (data === true) {
        console.log(`✅ Reservation cancelled: ${reservationId}`);
      } else {
        console.log(`ℹ️ Reservation not found or already confirmed: ${reservationId}`);
      }

      return data === true;
      
    } catch (error) {
      console.error('❌ cancelReservation error:', error);
      // Don't throw - let operation continue
      return false;
    }
  };

  /**
   * Check reservation status and get time remaining
   * 
   * @param {string} reservationId - UUID of reservation
   * @returns {Promise<Object>} Reservation status with timer info
   */
  const checkReservationStatus = async (reservationId) => {
    try {
      if (!reservationId) {
        return {
          exists: false,
          error: 'No reservation ID provided',
        };
      }

      const { data, error } = await supabase.rpc(
        'check_reservation_status',
        {
          p_reservation_id: reservationId,
        }
      );

      if (error) {
        console.error('❌ Check reservation status failed:', error);
        return {
          exists: false,
          error: error.message,
        };
      }

      return data;
      
    } catch (error) {
      console.error('❌ checkReservationStatus error:', error);
      return {
        exists: false,
        error: error.message,
      };
    }
  };

  /**
   * Extend reservation expiry time
   * 
   * @param {string} reservationId - UUID of reservation
   * @param {number} extensionMinutes - Minutes to add (default: 15, max: 60)
   * @returns {Promise<Date>} New expiry timestamp
   * @throws {Error} If extension fails
   */
  const extendReservation = async (reservationId, extensionMinutes = 15) => {
    try {
      console.log(`⏰ Extending reservation: ${reservationId} by ${extensionMinutes} min`);

      if (!reservationId) {
        throw new Error('reservationId is required');
      }

      if (extensionMinutes <= 0 || extensionMinutes > 60) {
        throw new Error('Extension must be between 1-60 minutes');
      }

      const { data: newExpiry, error } = await supabase.rpc(
        'extend_reservation',
        {
          p_reservation_id: reservationId,
          p_extension_minutes: extensionMinutes,
        }
      );

      if (error) {
        console.error('❌ Extend reservation failed:', error);
        
        if (error.message.includes('expired')) {
          throw new Error('Cannot extend expired reservation');
        } else if (error.message.includes('confirmed')) {
          throw new Error('Cannot extend confirmed reservation');
        }
        
        throw new Error(error.message || 'Failed to extend reservation');
      }

      const expiryDate = new Date(newExpiry);
      console.log(`✅ Reservation extended until: ${expiryDate.toLocaleTimeString()}`);
      
      return expiryDate;
      
    } catch (error) {
      console.error('❌ extendReservation error:', error);
      throw error;
    }
  };

  /**
   * Get available stock (total - active reservations)
   * 
   * @param {string} variantId - UUID of product variant
   * @returns {Promise<number>} Available stock count
   */
  const getAvailableStock = async (variantId) => {
    try {
      if (!variantId) {
        throw new Error('variantId is required');
      }

      const { data: availableStock, error } = await supabase.rpc(
        'get_available_stock',
        {
          p_variant_id: variantId,
        }
      );

      if (error) {
        console.error('❌ Get available stock failed:', error);
        throw new Error(error.message || 'Failed to get available stock');
      }

      return availableStock || 0;
      
    } catch (error) {
      console.error('❌ getAvailableStock error:', error);
      // Return 0 on error (safe default)
      return 0;
    }
  };

  return {
    reserveStock,
    confirmReservation,
    confirmMultipleReservations,
    cancelReservation,
    checkReservationStatus,
    extendReservation,
    getAvailableStock,
  };
}
