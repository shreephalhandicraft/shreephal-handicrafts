// src/utils/validators.js
function validatePaymentRequest(body) {
  const { orderId, amount, customerEmail, customerPhone, customerName } = body;

  const missing = [];
  if (!orderId) missing.push("orderId");
  if (!amount) missing.push("amount");
  if (!customerEmail) missing.push("customerEmail");
  if (!customerPhone) missing.push("customerPhone");
  if (!customerName) missing.push("customerName");

  return {
    isValid: missing.length === 0,
    missing,
    data: { orderId, amount, customerEmail, customerPhone, customerName },
  };
}

module.exports = { validatePaymentRequest };
