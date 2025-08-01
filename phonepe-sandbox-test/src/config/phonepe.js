const config = require("./environment");

const phonepeConfig = {
  MERCHANT_ID: config.PHONEPE_MERCHANT_ID,
  SALT_KEY: config.PHONEPE_SALT_KEY,
  SALT_INDEX: config.PHONEPE_SALT_INDEX,
  BASE_URL: config.PHONEPE_BASE_URL,

  getRedirectUrl: (port = config.PORT) => {
    return config.NODE_ENV === "production"
      ? "https://shrifal-handicrafts-api.onrender.com/redirect"
      : `http://localhost:${port}/redirect`;
  },

  getCallbackUrl: (port = config.PORT) => {
    return config.NODE_ENV === "production"
      ? "https://shrifal-handicrafts-api.onrender.com/callback"
      : `http://localhost:${port}/callback`;
  },
};

module.exports = phonepeConfig;
