const orderService = require("../services/orderService");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");

class OrderController {
  // Create new order
  async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const orderData = {
        userId: req.user?.id, // from auth middleware
        customerInfo: req.body.customerInfo,
        items: req.body.items,
        shippingAddress: req.body.shippingAddress,
        amount: req.body.amount,
        status: "pending",
      };

      const order = await orderService.createOrder(orderData);

      logger.info("Order created successfully", {
        orderId: order.id,
        userId: orderData.userId,
        amount: orderData.amount,
      });

      res.status(201).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    } catch (error) {
      logger.error("Order creation error", { error: error.message });
      next(error);
    }
  }

  // Get order by ID
  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params;

      const order = await orderService.getOrderById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check if user has permission to view this order
      if (req.user && order.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      logger.error("Get order error", {
        orderId: req.params.orderId,
        error: error.message,
      });
      next(error);
    }
  }

  // Get orders for user
  async getUserOrders(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      // Check permission
      if (req.user.id !== userId && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const orders = await orderService.getUserOrders({
        userId,
        page: parseInt(page),
        limit: parseInt(limit),
        status,
      });

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      logger.error("Get user orders error", {
        userId: req.params.userId,
        error: error.message,
      });
      next(error);
    }
  }

  // Update order status
  async updateOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { status, notes } = req.body;

      // Only admin can update order status
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const updatedOrder = await orderService.updateOrderStatus(
        orderId,
        status,
        {
          notes,
          updatedBy: req.user.id,
        }
      );

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      logger.info("Order status updated", {
        orderId,
        oldStatus: updatedOrder.previousStatus,
        newStatus: status,
        updatedBy: req.user.id,
      });

      res.json({
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      });
    } catch (error) {
      logger.error("Update order status error", {
        orderId: req.params.orderId,
        error: error.message,
      });
      next(error);
    }
  }

  // Cancel order
  async cancelOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await orderService.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }

      // Check permission
      if (order.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if order can be cancelled
      if (!["pending", "confirmed", "processing"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Order cannot be cancelled",
        });
      }

      const cancelledOrder = await orderService.cancelOrder(orderId, {
        reason,
        cancelledBy: req.user.id,
      });

      logger.info("Order cancelled", {
        orderId,
        reason,
        cancelledBy: req.user.id,
      });

      res.json({
        success: true,
        message: "Order cancelled successfully",
        data: cancelledOrder,
      });
    } catch (error) {
      logger.error("Cancel order error", {
        orderId: req.params.orderId,
        error: error.message,
      });
      next(error);
    }
  }

  // Get all orders (admin only)
  async getAllOrders(req, res, next) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const { page = 1, limit = 20, status, search } = req.query;

      const orders = await orderService.getAllOrders({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        search,
      });

      res.json({
        success: true,
        data: orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
        },
      });
    } catch (error) {
      logger.error("Get all orders error", { error: error.message });
      next(error);
    }
  }

  // Get order analytics (admin only)
  async getOrderAnalytics(req, res, next) {
    try {
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      const { startDate, endDate } = req.query;

      const analytics = await orderService.getOrderAnalytics({
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error("Order analytics error", { error: error.message });
      next(error);
    }
  }
}

module.exports = new OrderController();
