// middleware/httpsRedirect.js
const httpsRedirect = (req, res, next) => {
  // Skip in development
  if (process.env.NODE_ENV !== "production") {
    return next();
  }
  
  // Skip HTTPS redirect for API routes - they should work over HTTPS anyway
  if (req.path.startsWith("/api/")) {
    return next();
  }
  // Check if request is secure
  const isSecure =
    req.secure ||
    req.headers["x-forwarded-proto"] === "https" ||
    req.headers["x-forwarded-ssl"] === "on";

  if (!isSecure) {
    const httpsUrl = `https://${req.headers.host}${req.url}`;
    return res.redirect(301, httpsUrl);
  }

  next();
};

module.exports = httpsRedirect;
