const nodemailer = require("nodemailer");
const config = require("../config/environment");
const logger = require("../utils/logger");
const { supabase } = require("../config/supabaseClient");

class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.initializeEmailTransporter();
  }

  /**
   * Initialize email transporter
   */
  async initializeEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.secure,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.password,
        },
      });

      // Verify connection
      if (config.nodeEnv !== "test") {
        await this.emailTransporter.verify();
        logger.info("Email transporter initialized successfully");
      }
    } catch (error) {
      logger.error("Failed to initialize email transporter", {
        error: error.message,
      });
    }
  }

  /**
   * Send email notification
   * @param {Object} emailData - Email information
   * @returns {Object} Send result
   */
  async sendEmail(emailData) {
    try {
      const {
        to,
        subject,
        html,
        text,
        attachments,
        from = config.email.from,
      } = emailData;

      if (!this.emailTransporter) {
        throw new Error("Email transporter not initialized");
      }

      const mailOptions = {
        from,
        to,
        subject,
        html,
        text,
        attachments,
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        to,
        subject,
        messageId: result.messageId,
      });

      // Save notification record
      await this.saveNotificationRecord({
        type: "email",
        recipient: to,
        subject,
        status: "sent",
        messageId: result.messageId,
        metadata: { emailData },
      });

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      logger.error("Failed to send email", {
        to: emailData.to,
        subject: emailData.subject,
        error: error.message,
      });

      // Save failed notification record
      await this.saveNotificationRecord({
        type: "email",
        recipient: emailData.to,
        subject: emailData.subject,
        status: "failed",
        error: error.message,
        metadata: { emailData },
      });

      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send order confirmation email
   * @param {Object} orderData - Order information
   * @returns {Object} Send result
   */
  async sendOrderConfirmationEmail(orderData) {
    try {
      const {
        customerEmail,
        customerName,
        orderId,
        items,
        amount,
        shippingAddress,
      } = orderData;

      const subject = `Order Confirmation - ${orderId}`;

      const html = this.generateOrderConfirmationHTML({
        customerName,
        orderId,
        items,
        amount,
        shippingAddress,
      });

      const text = this.generateOrderConfirmationText({
        customerName,
        orderId,
        items,
        amount,
      });

      return await this.sendEmail({
        to: customerEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send order confirmation email", {
        orderId: orderData.orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send payment success email
   * @param {Object} paymentData - Payment information
   * @returns {Object} Send result
   */
  async sendPaymentSuccessEmail(paymentData) {
    try {
      const {
        customerEmail,
        customerName,
        orderId,
        amount,
        transactionId,
        paymentMethod,
      } = paymentData;

      const subject = `Payment Successful - ${orderId}`;

      const html = this.generatePaymentSuccessHTML({
        customerName,
        orderId,
        amount,
        transactionId,
        paymentMethod,
      });

      const text = `Dear ${customerName},\n\nYour payment of ₹${amount} for order ${orderId} has been processed successfully.\nTransaction ID: ${transactionId}\n\nThank you for your business!`;

      return await this.sendEmail({
        to: customerEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send payment success email", {
        orderId: paymentData.orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send payment failed email
   * @param {Object} paymentData - Payment information
   * @returns {Object} Send result
   */
  async sendPaymentFailedEmail(paymentData) {
    try {
      const { customerEmail, customerName, orderId, amount, failureReason } =
        paymentData;

      const subject = `Payment Failed - ${orderId}`;

      const html = this.generatePaymentFailedHTML({
        customerName,
        orderId,
        amount,
        failureReason,
      });

      const text = `Dear ${customerName},\n\nYour payment of ₹${amount} for order ${orderId} could not be processed.\nReason: ${failureReason}\n\nPlease try again or contact support.`;

      return await this.sendEmail({
        to: customerEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send payment failed email", {
        orderId: paymentData.orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send order shipped email
   * @param {Object} shippingData - Shipping information
   * @returns {Object} Send result
   */
  async sendOrderShippedEmail(shippingData) {
    try {
      const {
        customerEmail,
        customerName,
        orderId,
        trackingNumber,
        carrier,
        estimatedDelivery,
      } = shippingData;

      const subject = `Your Order has been Shipped - ${orderId}`;

      const html = this.generateOrderShippedHTML({
        customerName,
        orderId,
        trackingNumber,
        carrier,
        estimatedDelivery,
      });

      const text = `Dear ${customerName},\n\nYour order ${orderId} has been shipped!\nTracking Number: ${trackingNumber}\nCarrier: ${carrier}\nEstimated Delivery: ${estimatedDelivery}\n\nTrack your order for updates.`;

      return await this.sendEmail({
        to: customerEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send order shipped email", {
        orderId: shippingData.orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send order cancelled email
   * @param {Object} cancellationData - Cancellation information
   * @returns {Object} Send result
   */
  async sendOrderCancelledEmail(cancellationData) {
    try {
      const {
        customerEmail,
        customerName,
        orderId,
        cancellationReason,
        refundAmount,
        refundMethod,
      } = cancellationData;

      const subject = `Order Cancelled - ${orderId}`;

      const html = this.generateOrderCancelledHTML({
        customerName,
        orderId,
        cancellationReason,
        refundAmount,
        refundMethod,
      });

      const text = `Dear ${customerName},\n\nYour order ${orderId} has been cancelled.\nReason: ${cancellationReason}\n${
        refundAmount
          ? `Refund of ₹${refundAmount} will be processed via ${refundMethod}`
          : ""
      }\n\nWe apologize for any inconvenience.`;

      return await this.sendEmail({
        to: customerEmail,
        subject,
        html,
        text,
      });
    } catch (error) {
      logger.error("Failed to send order cancelled email", {
        orderId: cancellationData.orderId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send admin notification
   * @param {Object} notificationData - Notification information
   * @returns {Object} Send result
   */
  async sendAdminNotification(notificationData) {
    try {
      const {
        subject,
        message,
        priority = "normal",
        data = {},
      } = notificationData;

      const adminEmails = config.admin.emails || ["admin@example.com"];

      const html = `
        <h2>Admin Notification</h2>
        <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
        <p><strong>Message:</strong> ${message}</p>
        ${
          Object.keys(data).length > 0
            ? `<pre>${JSON.stringify(data, null, 2)}</pre>`
            : ""
        }
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `;

      const results = [];
      for (const email of adminEmails) {
        const result = await this.sendEmail({
          to: email,
          subject: `[ADMIN] ${subject}`,
          html,
          text: message,
        });
        results.push(result);
      }

      return { success: true, results };
    } catch (error) {
      logger.error("Failed to send admin notification", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send SMS notification (placeholder for SMS service integration)
   * @param {Object} smsData - SMS information
   * @returns {Object} Send result
   */
  async sendSMS(smsData) {
    try {
      const { to, message, orderId } = smsData;

      // Implement SMS service integration here (Twilio, AWS SNS, etc.)
      logger.info("SMS notification sent", { to, orderId });

      await this.saveNotificationRecord({
        type: "sms",
        recipient: to,
        subject: "SMS Notification",
        status: "sent",
        metadata: { smsData },
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to send SMS", {
        to: smsData.to,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send push notification (placeholder for push service integration)
   * @param {Object} pushData - Push notification information
   * @returns {Object} Send result
   */
  async sendPushNotification(pushData) {
    try {
      const { userId, title, body, data } = pushData;

      // Implement push notification service here (Firebase, OneSignal, etc.)
      logger.info("Push notification sent", { userId, title });

      await this.saveNotificationRecord({
        type: "push",
        recipient: userId,
        subject: title,
        status: "sent",
        metadata: { pushData },
      });

      return { success: true };
    } catch (error) {
      logger.error("Failed to send push notification", {
        userId: pushData.userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Save notification record to database
   * @param {Object} notificationData - Notification data
   */
  async saveNotificationRecord(notificationData) {
    try {
      const { type, recipient, subject, status, messageId, error, metadata } =
        notificationData;

      await supabase.from("notifications").insert([
        {
          type,
          recipient,
          subject,
          status,
          message_id: messageId,
          error,
          metadata,
          sent_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      logger.error("Failed to save notification record", {
        error: error.message,
      });
      // Don't throw error as this is not critical
    }
  }

  /**
   * Generate order confirmation HTML
   * @param {Object} data - Order data
   * @returns {string} HTML content
   */
  generateOrderConfirmationHTML(data) {
    const { customerName, orderId, items, amount, shippingAddress } = data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .order-item { padding: 10px; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for your order! Your order has been confirmed.</p>
              
              <h3>Order Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
              
              <h3>Items Ordered</h3>
              ${items
                .map(
                  (item) => `
                <div class="order-item">
                  <strong>${item.name}</strong> - Quantity: ${item.quantity} - Price: ₹${item.price}
                </div>
              `
                )
                .join("")}
              
              <div class="total">
                <p>Total Amount: ₹${amount}</p>
              </div>
              
              ${
                shippingAddress
                  ? `
                <h3>Shipping Address</h3>
                <p>
                  ${shippingAddress.street}<br>
                  ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.pincode}
                </p>
              `
                  : ""
              }
              
              <p>We will send you another email once your order is shipped.</p>
              <p>Thank you for choosing us!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate order confirmation text
   * @param {Object} data - Order data
   * @returns {string} Text content
   */
  generateOrderConfirmationText(data) {
    const { customerName, orderId, items, amount } = data;

    return `
Dear ${customerName},

Thank you for your order! Your order has been confirmed.

Order ID: ${orderId}
Order Date: ${new Date().toLocaleDateString()}

Items Ordered:
${items
  .map((item) => `- ${item.name} (Qty: ${item.quantity}) - ₹${item.price}`)
  .join("\n")}

Total Amount: ₹${amount}

We will send you another email once your order is shipped.

Thank you for choosing us!
    `;
  }

  /**
   * Generate payment success HTML
   * @param {Object} data - Payment data
   * @returns {string} HTML content
   */
  generatePaymentSuccessHTML(data) {
    const { customerName, orderId, amount, transactionId, paymentMethod } =
      data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .success { color: #4CAF50; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Successful</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p class="success">✅ Your payment has been processed successfully!</p>
              
              <h3>Payment Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Amount Paid:</strong> ₹${amount}</p>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              
              <p>Your order is now being processed and you will receive shipping updates soon.</p>
              <p>Thank you for your business!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate payment failed HTML
   * @param {Object} data - Payment data
   * @returns {string} HTML content
   */
  generatePaymentFailedHTML(data) {
    const { customerName, orderId, amount, failureReason } = data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .failure { color: #f44336; font-weight: bold; }
            .retry-btn { background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p class="failure">❌ Unfortunately, your payment could not be processed.</p>
              
              <h3>Payment Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Amount:</strong> ₹${amount}</p>
              <p><strong>Failure Reason:</strong> ${failureReason}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              
              <p>Please try again or contact our support team if you continue to experience issues.</p>
              <a href="${
                config.frontend.url
              }/order/${orderId}" class="retry-btn">Retry Payment</a>
              
              <p>We apologize for the inconvenience.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate order shipped HTML
   * @param {Object} data - Shipping data
   * @returns {string} HTML content
   */
  generateOrderShippedHTML(data) {
    const {
      customerName,
      orderId,
      trackingNumber,
      carrier,
      estimatedDelivery,
    } = data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .tracking { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Your Order is on its Way!</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Great news! Your order has been shipped and is on its way to you.</p>
              
              <h3>Shipping Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              
              <div class="tracking">
                <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p><strong>Carrier:</strong> ${carrier}</p>
                <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
              </div>
              
              <p>You can track your order using the tracking number provided above.</p>
              <p>Thank you for your patience!</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate order cancelled HTML
   * @param {Object} data - Cancellation data
   * @returns {string} HTML content
   */
  generateOrderCancelledHTML(data) {
    const {
      customerName,
      orderId,
      cancellationReason,
      refundAmount,
      refundMethod,
    } = data;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #ff9800; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; }
            .refund { background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Your order has been cancelled as requested.</p>
              
              <h3>Cancellation Details</h3>
              <p><strong>Order ID:</strong> ${orderId}</p>
              <p><strong>Cancellation Reason:</strong> ${cancellationReason}</p>
              <p><strong>Cancelled Date:</strong> ${new Date().toLocaleString()}</p>
              
              ${
                refundAmount
                  ? `
                <div class="refund">
                  <h4>Refund Information</h4>
                  <p><strong>Refund Amount:</strong> ₹${refundAmount}</p>
                  <p><strong>Refund Method:</strong> ${refundMethod}</p>
                  <p>Your refund will be processed within 5-7 business days.</p>
                </div>
              `
                  : ""
              }
              
              <p>We apologize for any inconvenience caused.</p>
              <p>If you have any questions, please don't hesitate to contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get notification history
   * @param {Object} params - Query parameters
   * @returns {Object} Notification history
   */
  async getNotificationHistory({ type, recipient, page = 1, limit = 20 }) {
    try {
      const offset = (page - 1) * limit;

      let query = supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .order("sent_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq("type", type);
      }

      if (recipient) {
        query = query.eq("recipient", recipient);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        notifications: data,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error("Failed to get notification history", {
        error: error.message,
      });
      throw new Error(
        `Failed to retrieve notification history: ${error.message}`
      );
    }
  }
}

module.exports = new NotificationService();
