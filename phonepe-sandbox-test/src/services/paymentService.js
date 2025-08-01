const { supabase } = require("../config/supabaseClient");
const logger = require("../utils/logger");
const phonepeService = require("./phonepeService");

class PaymentService {
  /**
   * Create payment record
   * @param {Object} paymentData - Payment information
   * @returns {Object} Created payment record
   */
  async createPayment(paymentData) {
    try {
      const {
        orderId,
        userId,
        amount,
        customerInfo,
        status = "initiated",
        paymentMethod = "phonepe",
        metadata = {},
      } = paymentData;

      const payment = {
        order_id: orderId,
        user_id: userId,
        amount,
        status,
        payment_method: paymentMethod,
        customer_info: customerInfo,
        metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("payments")
        .insert([payment])
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info("Payment record created", {
        paymentId: data.id,
        orderId,
        amount,
        status,
      });

      return data;
    } catch (error) {
      logger.error("Payment creation failed", {
        orderId: paymentData.orderId,
        error: error.message,
      });
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Get payment by order ID
   * @param {string} orderId - Order ID
   * @returns {Object|null} Payment data
   */
  async getPaymentByOrderId(orderId) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
          *,
          orders!payments_order_id_fkey (
            id,
            status,
            customer_info,
            amount as order_amount
          )
        `
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      return data;
    } catch (error) {
      logger.error("Failed to get payment by order ID", {
        orderId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Update payment status
   * @param {string} paymentId - Payment ID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional data to update
   * @returns {Object} Updated payment
   */
  async updatePaymentStatus(paymentId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      const { data, error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", paymentId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info("Payment status updated", {
        paymentId,
        status,
        previousData: additionalData,
      });

      return data;
    } catch (error) {
      logger.error("Failed to update payment status", {
        paymentId,
        status,
        error: error.message,
      });
      throw new Error(`Failed to update payment status: ${error.message}`);
    }
  }

  /**
   * Update payment by order ID
   * @param {string} orderId - Order ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated payment
   */
  async updatePaymentByOrderId(orderId, updateData) {
    try {
      const {
        status,
        phonepeTransactionId,
        phonepeResponse,
        callbackData,
        processedAt,
      } = updateData;

      const updates = {
        updated_at: new Date().toISOString(),
      };

      if (status) updates.status = status;
      if (phonepeTransactionId) updates.phonepe_txn_id = phonepeTransactionId;
      if (phonepeResponse) updates.phonepe_response = phonepeResponse;
      if (callbackData) updates.callback_data = callbackData;
      if (processedAt) updates.processed_at = processedAt;

      const { data, error } = await supabase
        .from("payments")
        .update(updates)
        .eq("order_id", orderId)
        .select()
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        throw error;
      }

      logger.info("Payment updated by order ID", {
        orderId,
        paymentId: data.id,
        status,
      });

      return data;
    } catch (error) {
      logger.error("Failed to update payment by order ID", {
        orderId,
        error: error.message,
      });
      throw new Error(`Failed to update payment: ${error.message}`);
    }
  }

  /**
   * Get payment history for user
   * @param {Object} params - Query parameters
   * @returns {Object} Payment history with pagination
   */
  async getPaymentHistory({ userId, orderId, page = 1, limit = 10, status }) {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from("payments")
        .select(
          `
          *,
          orders!payments_order_id_fkey (
            id,
            status,
            customer_info,
            items,
            created_at
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      if (orderId) {
        query = query.eq("order_id", orderId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        payments: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get payment history", {
        userId,
        orderId,
        error: error.message,
      });
      throw new Error(`Failed to retrieve payment history: ${error.message}`);
    }
  }

  /**
   * Process refund
   * @param {Object} refundData - Refund information
   * @returns {Object} Refund record
   */
  async processRefund(refundData) {
    try {
      const { paymentId, refundAmount, reason, processedBy } = refundData;

      // Get original payment
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (paymentError || !payment) {
        throw new Error("Payment not found");
      }

      if (payment.status !== "completed") {
        throw new Error("Only completed payments can be refunded");
      }

      // Initiate refund with PhonePe
      const phonepeRefund = await phonepeService.processRefund({
        originalTransactionId: payment.phonepe_txn_id,
        refundAmount,
        merchantRefundId: `REFUND_${paymentId}_${Date.now()}`,
      });

      // Create refund record
      const refundRecord = {
        payment_id: paymentId,
        order_id: payment.order_id,
        amount: refundAmount,
        reason,
        status: phonepeRefund.success ? "initiated" : "failed",
        phonepe_refund_id: phonepeRefund.data?.merchantRefundId,
        phonepe_response: phonepeRefund,
        processed_by: processedBy,
        created_at: new Date().toISOString(),
      };

      const { data: refund, error: refundError } = await supabase
        .from("refunds")
        .insert([refundRecord])
        .select()
        .single();

      if (refundError) {
        throw refundError;
      }

      // Update payment status
      await this.updatePaymentStatus(paymentId, "refund_initiated", {
        refund_amount: refundAmount,
        refund_id: refund.id,
      });

      logger.info("Refund processed", {
        paymentId,
        refundId: refund.id,
        refundAmount,
        reason,
      });

      return refund;
    } catch (error) {
      logger.error("Refund processing failed", {
        paymentId: refundData.paymentId,
        error: error.message,
      });
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Get failed payments
   * @param {Object} params - Query parameters
   * @returns {Object} Failed payments list
   */
  async getFailedPayments({ userId, page = 1, limit = 10 }) {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from("payments")
        .select(
          `
          *,
          orders!payments_order_id_fkey (
            id,
            status,
            customer_info,
            amount as order_amount
          )
        `,
          { count: "exact" }
        )
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        payments: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get failed payments", {
        userId,
        error: error.message,
      });
      throw new Error(`Failed to retrieve failed payments: ${error.message}`);
    }
  }

  /**
   * Retry failed payment
   * @param {string} orderId - Order ID
   * @returns {Object} New payment initiation response
   */
  async retryPayment(orderId) {
    try {
      // Get original payment and order details
      const payment = await this.getPaymentByOrderId(orderId);
      if (!payment) {
        throw new Error("Payment record not found");
      }

      if (payment.status !== "failed") {
        throw new Error("Only failed payments can be retried");
      }

      const order = payment.orders;
      if (!order) {
        throw new Error("Order not found");
      }

      // Create new payment record for retry
      const retryPayment = await this.createPayment({
        orderId: order.id,
        userId: payment.user_id,
        amount: payment.amount,
        customerInfo: payment.customer_info,
        status: "retry_initiated",
        metadata: {
          ...payment.metadata,
          originalPaymentId: payment.id,
          retryCount: (payment.metadata?.retryCount || 0) + 1,
        },
      });

      logger.info("Payment retry initiated", {
        originalPaymentId: payment.id,
        retryPaymentId: retryPayment.id,
        orderId,
      });

      return retryPayment;
    } catch (error) {
      logger.error("Payment retry failed", {
        orderId,
        error: error.message,
      });
      throw new Error(`Failed to retry payment: ${error.message}`);
    }
  }

  /**
   * Get payment analytics
   * @param {Object} params - Query parameters
   * @returns {Object} Payment analytics
   */
  async getPaymentAnalytics({ startDate, endDate }) {
    try {
      let query = supabase.from("payments").select("*");

      if (startDate) {
        query = query.gte("created_at", startDate);
      }

      if (endDate) {
        query = query.lte("created_at", endDate);
      }

      const { data: payments, error } = await query;

      if (error) {
        throw error;
      }

      const analytics = {
        totalPayments: payments.length,
        totalRevenue: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        averageTransactionValue: 0,
        successRate: 0,
        statusBreakdown: {},
        dailyStats: {},
        paymentMethodBreakdown: {},
      };

      payments.forEach((payment) => {
        // Revenue calculation
        if (payment.status === "completed") {
          analytics.totalRevenue += payment.amount || 0;
          analytics.successfulPayments += 1;
        }

        // Status counting
        if (payment.status === "failed") {
          analytics.failedPayments += 1;
        } else if (payment.status === "pending") {
          analytics.pendingPayments += 1;
        }

        // Status breakdown
        analytics.statusBreakdown[payment.status] =
          (analytics.statusBreakdown[payment.status] || 0) + 1;

        // Payment method breakdown
        analytics.paymentMethodBreakdown[payment.payment_method] =
          (analytics.paymentMethodBreakdown[payment.payment_method] || 0) + 1;

        // Daily stats
        const date = new Date(payment.created_at).toISOString().split("T")[0];
        if (!analytics.dailyStats[date]) {
          analytics.dailyStats[date] = {
            count: 0,
            revenue: 0,
            successful: 0,
            failed: 0,
          };
        }
        analytics.dailyStats[date].count += 1;
        if (payment.status === "completed") {
          analytics.dailyStats[date].revenue += payment.amount || 0;
          analytics.dailyStats[date].successful += 1;
        } else if (payment.status === "failed") {
          analytics.dailyStats[date].failed += 1;
        }
      });

      // Calculate derived metrics
      if (payments.length > 0) {
        analytics.successRate =
          (analytics.successfulPayments / payments.length) * 100;
        analytics.averageTransactionValue =
          analytics.totalRevenue / analytics.successfulPayments || 0;
      }

      return analytics;
    } catch (error) {
      logger.error("Failed to get payment analytics", {
        error: error.message,
      });
      throw new Error(`Failed to retrieve payment analytics: ${error.message}`);
    }
  }

  /**
   * Verify payment manually (admin function)
   * @param {string} orderId - Order ID
   * @returns {Object} Verification result
   */
  async verifyPaymentManually(orderId) {
    try {
      const payment = await this.getPaymentByOrderId(orderId);
      if (!payment) {
        throw new Error("Payment not found");
      }

      // Check status with PhonePe
      const phonepeStatus = await phonepeService.checkPaymentStatus(
        payment.phonepe_txn_id
      );

      const isSuccess =
        phonepeStatus.success && phonepeStatus.data?.state === "COMPLETED";

      // Update local status based on PhonePe response
      const newStatus = isSuccess ? "completed" : "failed";

      if (payment.status !== newStatus) {
        await this.updatePaymentStatus(payment.id, newStatus, {
          phonepe_response: phonepeStatus,
          manually_verified: true,
          verified_at: new Date().toISOString(),
        });
      }

      logger.info("Payment manually verified", {
        orderId,
        paymentId: payment.id,
        previousStatus: payment.status,
        newStatus,
        phonepeStatus: phonepeStatus.data?.state,
      });

      return {
        orderId,
        paymentId: payment.id,
        previousStatus: payment.status,
        currentStatus: newStatus,
        phonepeStatus: phonepeStatus.data?.state,
        isUpdated: payment.status !== newStatus,
      };
    } catch (error) {
      logger.error("Manual payment verification failed", {
        orderId,
        error: error.message,
      });
      throw new Error(`Failed to verify payment: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
