/// <reference types="cypress" />

describe("Product Detail Page", () => {
  const productUrl =
    "/category/trophies/products/444a3ca0-c05a-4a15-8864-6f596e177199";

  beforeEach(() => {
    // Intercept product fetch call before visiting
    cy.intercept("GET", "**/products*").as("getProduct");
    cy.visit(productUrl);
    cy.wait("@getProduct");
  });

  it("displays product header correctly", () => {
    // Category badge visible
    cy.contains("Trophies").should("be.visible");

    // Product title visible
    cy.get("h1").should("be.visible");

    // Price visible and formatted (₹ + number)
    cy.get("span.text-primary")
      .should("be.visible")
      .invoke("text")
      .should("match", /₹\s*\d+/);

    // Stock status visible
    cy.contains(/In Stock|Out of Stock/i).should("be.visible");

    // Optional: includes quantity
    cy.get("body").then(($body) => {
      if ($body.text().match(/In Stock\s*\(\d+\)/)) {
        cy.log("Stock quantity displayed");
      }
    });
  });

  it("has functional layout elements", () => {
    // Category badge visible
    cy.contains("Trophies").should("be.visible");

    // Dynamically check for a catalog badge (like #ABC123)
    cy.get("body").then(($body) => {
      const text = $body.text();
      const catalogMatch = text.match(/#\w+/); // matches like #CAT123, #TROPH001
      if (catalogMatch) {
        cy.contains(catalogMatch[0]).should("be.visible");
        cy.log(`Catalog badge found: ${catalogMatch[0]}`);
      } else {
        cy.log("No catalog number badge found for this product");
      }
    });

    // Featured badge (if applicable)
    cy.get("body").then(($body) => {
      if ($body.text().includes("Featured")) {
        cy.contains("Featured").should("be.visible");
      } else {
        cy.log("Not a featured product");
      }
    });
  });

  it("shows correct page title and metadata", () => {
    // Allow localized or brand titles
    cy.title().should("match", /श्रीफल|Shreephal|Handicraft/i);
  });

  it("handles network errors gracefully", () => {
    // Simulate network error for product API
    cy.intercept("GET", "**/products*", { forceNetworkError: true }).as(
      "productError"
    );

    cy.visit(productUrl);
    cy.wait("@productError");

    // Expect fallback UI or error message
    cy.contains(/Product Not Found|Error loading|Something went wrong/i).should(
      "be.visible"
    );
  });
});
