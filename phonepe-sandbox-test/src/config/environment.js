require("dotenv").config();

const config = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Force HTTPS in production
  FORCE_HTTPS: process.env.NODE_ENV === "production",

  // Domain configuration
  BACKEND_DOMAIN:
    process.env.NODE_ENV === "production"
      ? "shrifal-handicrafts-api.onrender.com"
      : "localhost",

      
  // Frontend URLs
  FRONTEND_URL:
    process.env.NODE_ENV === "production"
      ? "https://shrifalhandicrafts.com"
      : "http://localhost:5173",

  // Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // PhonePe
  PHONEPE_MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID,
  PHONEPE_SALT_KEY: process.env.PHONEPE_SALT_KEY,
  PHONEPE_SALT_INDEX: process.env.PHONEPE_SALT_INDEX || 1,
  PHONEPE_BASE_URL:
    process.env.NODE_ENV === "production"
      ? "https://api.phonepe.com/apis/hermes/pg/v1"
      : "https://api-preprod.phonepe.com/apis/hermes/pg/v1",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Security
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
};

// Validation
const requiredVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "PHONEPE_MERCHANT_ID",
  "PHONEPE_SALT_KEY",
  "CLOUDINARY_CLOUD_NAME",
];

requiredVars.forEach((varName) => {
  if (!config[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

module.exports = config;
