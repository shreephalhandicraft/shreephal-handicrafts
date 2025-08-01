// cypress/support/e2e.js

// Import commands.js using ES2015 syntax:
import "./commands";

// Alternatively you can use CommonJS syntax:
// require('./commands')

// You can also add global configurations here
// For example, to ignore uncaught exceptions:
Cypress.on("uncaught:exception", (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  // You might want to be more specific about which errors to ignore
  return false;
});
