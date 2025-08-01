const axios = require("axios");
const crypto = require("crypto");
const phonepeConfig = require("../config/phonepe");
const logger = require("../utils/logger");

class PhonePeService {
  static generateChecksum(payload) {
    const string = payload + "/pg/v1/pay" + phonepeConfig.SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    return sha256 + "###" + phonepeConfig.SALT_INDEX;
  }

  static generateStatusChecksum(transactionId) {
    const string =
      `/pg/v1/status/${phonepeConfig.MERCHANT_ID}/${transactionId}` +
      phonepeConfig.SALT_KEY;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    return sha256 + "###" + phonepeConfig.SALT_INDEX;
  }

  static async initiatePayment(paymentData, redirectUrl, callbackUrl) {
    try {
      const { orderId, amount, customerEmail, customerPhone, customerName } =
        paymentData;

      // Create payment payload
      const paymentPayload = {
        merchantId: phonepeConfig.MERCHANT_ID,
        merchantTransactionId: orderId,
        merchantUserId: `USER_${Date.now()}`,
        amount: amount, // amount in paise
        redirectUrl: redirectUrl,
        redirectMode: "POST",
        callbackUrl: callbackUrl,
        mobileNumber: customerPhone.replace(/\D/g, "").slice(-10), // Clean phone number
        paymentInstrument: {
          type: "PAY_PAGE",
        },
      };

      // Convert to base64
      const base64Payload = Buffer.from(
        JSON.stringify(paymentPayload)
      ).toString("base64");

      // Generate checksum
      const checksum = this.generateChecksum(base64Payload);

      // Prepare request
      const requestData = {
        request: base64Payload,
      };

      const headers = {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        accept: "application/json",
      };

      logger.info("Initiating PhonePe payment request", {
        orderId,
        amount,
        merchantId: phonepeConfig.MERCHANT_ID,
        url: `${phonepeConfig.BASE_URL}/pay`,
      });

      // Make API call
      const response = await axios.post(
        `${phonepeConfig.BASE_URL}/pay`,
        requestData,
        { headers, timeout: 30000 }
      );

      logger.info("PhonePe payment response received", {
        orderId,
        success: response.data.success,
        code: response.data.code,
      });

      return response.data;
    } catch (error) {
      logger.error("PhonePe payment initiation failed", {
        orderId: paymentData.orderId,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response) {
        return {
          success: false,
          message: error.response.data.message || "Payment gateway error",
          code: error.response.data.code,
          data: error.response.data,
        };
      }

      return {
        success: false,
        message: "Network error while processing payment",
        error: error.message,
      };
    }
  }

  static async checkStatus(transactionId) {
    try {
      const checksum = this.generateStatusChecksum(transactionId);

      const headers = {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
        "X-MERCHANT-ID": phonepeConfig.MERCHANT_ID,
        accept: "application/json",
      };

      const url = `${phonepeConfig.BASE_URL}/status/${phonepeConfig.MERCHANT_ID}/${transactionId}`;

      logger.info("Checking PhonePe payment status", {
        transactionId,
        url,
      });

      const response = await axios.get(url, { headers, timeout: 15000 });

      logger.info("PhonePe status response received", {
        transactionId,
        success: response.data.success,
        state: response.data.data?.state,
      });

      return response.data;
    } catch (error) {
      logger.error("PhonePe status check failed", {
        transactionId,
        error: error.message,
        response: error.response?.data,
      });

      throw new Error(`Status check failed: ${error.message}`);
    }
  }
}

module.exports = PhonePeService;
