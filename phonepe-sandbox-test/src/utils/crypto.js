const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/environment");
const logger = require("./logger");

class CryptoUtils {
  /**
   * Generate PhonePe signature
   * @param {string} payload - Base64 encoded payload
   * @param {string} endpoint - API endpoint
   * @param {string} saltKey - Salt key
   * @returns {string} Generated signature
   */
  static generatePhonePeSignature(payload, endpoint, saltKey) {
    try {
      const stringToHash = payload + endpoint + saltKey;
      const hash = crypto
        .createHash("sha256")
        .update(stringToHash)
        .digest("hex");
      return hash;
    } catch (error) {
      logger.error("PhonePe signature generation failed", {
        error: error.message,
      });
      throw new Error("Failed to generate signature");
    }
  }

  /**
   * Verify PhonePe signature
   * @param {string} receivedSignature - Received signature
   * @param {string} payload - Request payload
   * @param {string} saltKey - Salt key
   * @param {string} saltIndex - Salt index
   * @returns {boolean} Verification result
   */
  static verifyPhonePeSignature(
    receivedSignature,
    payload,
    saltKey,
    saltIndex
  ) {
    try {
      const [hash, receivedIndex] = receivedSignature.split("###");

      if (receivedIndex !== saltIndex.toString()) {
        return false;
      }

      const expectedHash = crypto
        .createHash("sha256")
        .update(payload + saltKey)
        .digest("hex");

      return hash === expectedHash;
    } catch (error) {
      logger.error("PhonePe signature verification failed", {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Generate secure random string
   * @param {number} length - Length of string
   * @param {string} charset - Character set to use
   * @returns {string} Random string
   */
  static generateRandomString(
    length = 32,
    charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  ) {
    try {
      let result = "";
      const bytes = crypto.randomBytes(length);

      for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
      }

      return result;
    } catch (error) {
      logger.error("Random string generation failed", { error: error.message });
      throw new Error("Failed to generate random string");
    }
  }

  /**
   * Generate UUID v4
   * @returns {string} UUID
   */
  static generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @param {number} saltRounds - Salt rounds (default: 12)
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password, saltRounds = 12) {
    try {
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error("Password hashing failed", { error: error.message });
      throw new Error("Failed to hash password");
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Verification result
   */
  static async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error("Password verification failed", { error: error.message });
      throw new Error("Failed to verify password");
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} text - Text to encrypt
   * @param {string} secretKey - Secret key
   * @returns {Object} Encrypted data with IV and auth tag
   */
  static encryptData(text, secretKey = config.encryption?.key) {
    try {
      if (!secretKey) {
        throw new Error("Encryption key not provided");
      }

      const algorithm = "aes-256-gcm";
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(secretKey, "salt", 32);

      const cipher = crypto.createCipher(algorithm, key);
      cipher.setAAD(Buffer.from("additional-data"));

      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex"),
      };
    } catch (error) {
      logger.error("Data encryption failed", { error: error.message });
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {Object} encryptedData - Encrypted data object
   * @param {string} secretKey - Secret key
   * @returns {string} Decrypted text
   */
  static decryptData(encryptedData, secretKey = config.encryption?.key) {
    try {
      if (!secretKey) {
        throw new Error("Encryption key not provided");
      }

      const { encrypted, iv, authTag } = encryptedData;
      const algorithm = "aes-256-gcm";
      const key = crypto.scryptSync(secretKey, "salt", 32);

      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAAD(Buffer.from("additional-data"));
      decipher.setAuthTag(Buffer.from(authTag, "hex"));

      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      logger.error("Data decryption failed", { error: error.message });
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {Object} options - JWT options
   * @returns {string} JWT token
   */
  static generateJWT(payload, secret = config.jwt?.secret, options = {}) {
    try {
      if (!secret) {
        throw new Error("JWT secret not provided");
      }

      const defaultOptions = {
        expiresIn: config.jwt?.expiresIn || "24h",
        issuer: config.jwt?.issuer || "phonepe-payment-service",
        audience: config.jwt?.audience || "phonepe-users",
      };

      return jwt.sign(payload, secret, { ...defaultOptions, ...options });
    } catch (error) {
      logger.error("JWT generation failed", { error: error.message });
      throw new Error("Failed to generate JWT token");
    }
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} secret - JWT secret
   * @returns {Object} Decoded payload
   */
  static verifyJWT(token, secret = config.jwt?.secret) {
    try {
      if (!secret) {
        throw new Error("JWT secret not provided");
      }

      return jwt.verify(token, secret);
    } catch (error) {
      logger.error("JWT verification failed", { error: error.message });
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Generate HMAC signature
   * @param {string} data - Data to sign
   * @param {string} secret - Secret key
   * @param {string} algorithm - HMAC algorithm (default: sha256)
   * @returns {string} HMAC signature
   */
  static generateHMAC(data, secret, algorithm = "sha256") {
    try {
      return crypto.createHmac(algorithm, secret).update(data).digest("hex");
    } catch (error) {
      logger.error("HMAC generation failed", { error: error.message });
      throw new Error("Failed to generate HMAC");
    }
  }

  /**
   * Verify HMAC signature
   * @param {string} data - Original data
   * @param {string} signature - Received signature
   * @param {string} secret - Secret key
   * @param {string} algorithm - HMAC algorithm
   * @returns {boolean} Verification result
   */
  static verifyHMAC(data, signature, secret, algorithm = "sha256") {
    try {
      const expectedSignature = this.generateHMAC(data, secret, algorithm);
      return crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );
    } catch (error) {
      logger.error("HMAC verification failed", { error: error.message });
      return false;
    }
  }

  /**
   * Generate API key
   * @param {number} length - Key length
   * @returns {string} API key
   */
  static generateAPIKey(length = 32) {
    try {
      const prefix = "pk_";
      const randomPart = this.generateRandomString(length - prefix.length);
      return prefix + randomPart;
    } catch (error) {
      logger.error("API key generation failed", { error: error.message });
      throw new Error("Failed to generate API key");
    }
  }

  /**
   * Hash data using SHA-256
   * @param {string} data - Data to hash
   * @returns {string} SHA-256 hash
   */
  static sha256(data) {
    try {
      return crypto.createHash("sha256").update(data).digest("hex");
    } catch (error) {
      logger.error("SHA-256 hashing failed", { error: error.message });
      throw new Error("Failed to hash data");
    }
  }

  /**
   * Generate checksum for data integrity
   * @param {Object} data - Data object
   * @returns {string} Checksum
   */
  static generateChecksum(data) {
    try {
      const serializedData = JSON.stringify(data, Object.keys(data).sort());
      return this.sha256(serializedData);
    } catch (error) {
      logger.error("Checksum generation failed", { error: error.message });
      throw new Error("Failed to generate checksum");
    }
  }

  /**
   * Verify data integrity using checksum
   * @param {Object} data - Data object
   * @param {string} expectedChecksum - Expected checksum
   * @returns {boolean} Verification result
   */
  static verifyChecksum(data, expectedChecksum) {
    try {
      const actualChecksum = this.generateChecksum(data);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      logger.error("Checksum verification failed", { error: error.message });
      return false;
    }
  }

  /**
   * Generate OTP (One-Time Password)
   * @param {number} length - OTP length
   * @param {boolean} numeric - Use only numeric characters
   * @returns {string} OTP
   */
  static generateOTP(length = 6, numeric = true) {
    try {
      const charset = numeric
        ? "0123456789"
        : "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      return this.generateRandomString(length, charset);
    } catch (error) {
      logger.error("OTP generation failed", { error: error.message });
      throw new Error("Failed to generate OTP");
    }
  }

  /**
   * Generate secure session token
   * @returns {string} Session token
   */
  static generateSessionToken() {
    try {
      const timestamp = Date.now().toString();
      const randomBytes = crypto.randomBytes(16).toString("hex");
      return Buffer.from(`${timestamp}.${randomBytes}`).toString("base64url");
    } catch (error) {
      logger.error("Session token generation failed", { error: error.message });
      throw new Error("Failed to generate session token");
    }
  }
}

module.exports = CryptoUtils;
