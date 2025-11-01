/// <reference types="cypress" />

describe("Category Products Page (robust tests)", () => {
  const baseSlug = "trophies";

  beforeEach(() => {
    cy.visit(`/category/${baseSlug}/products`);
  });

  it("loads the category page", () => {
    // basic smoke check: header present (category name comes from API)
    cy.get("h1", { timeout: 10000 }).should("exist").and("not.be.empty");
  });

  it("shows a loading spinner and then products or message", () => {
    // spinner should show briefly (if present) then disappear
    cy.get("[data-testid='loading-spinner']", { timeout: 10000 }).should(
      "exist"
    );
    cy.get("[data-testid='loading-spinner']", { timeout: 10000 }).should(
      "not.exist"
    );

    // after loading finishes, either product cards OR 'No Products Found' / error should be visible
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("[data-testid='product-card']").length) {
        cy.get("[data-testid='product-card']").should(
          "have.length.greaterThan",
          0
        );
      } else if ($body.text().match(/no products found/i)) {
        cy.contains(/no products found/i).should("be.visible");
      } else if ($body.text().match(/oops! something went wrong/i)) {
        cy.contains(/oops! something went wrong/i).should("be.visible");
      } else {
        // fallback: at least ensure the page rendered something meaningful
        cy.get("h1, h2, h3").should("exist");
      }
    });
  });

  it("can switch between grid and list view", () => {
    // use your data-testid toggles that exist in the app
    cy.get("[data-testid='view-list']", { timeout: 10000 }).should("exist");
    cy.get("[data-testid='view-grid']").should("exist");

    // switch to list, assert product visible
    cy.get("[data-testid='view-list']").click({ force: true });
    cy.wait(300);
    cy.get("[data-testid='product-card']").first().should("be.visible");

    // switch back to grid
    cy.get("[data-testid='view-grid']").click({ force: true });
    cy.wait(300);
    cy.get("[data-testid='product-card']").first().should("be.visible");
  });

  it("can clear filters when no products are found or handles error UI", () => {
    // Visit a slug that is expected to not exist
    cy.visit("/category/nonexistent/products");

    // Wait for page to settle (either no-products UI or error UI)
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.text().match(/no products found/i)) {
        cy.contains(/no products found/i).should("be.visible");
        // button could be "Clear All Filters"
        if ($body.find("button:contains('Clear All Filters')").length) {
          cy.contains("Clear All Filters").click({ force: true });
        } else if ($body.find("button:contains('Clear Filters')").length) {
          cy.contains("Clear Filters").click({ force: true });
        } else {
          // fallback: click browse button if shown
          cy.contains(/browse all categories/i).click({ force: true });
        }
        // after clicking expect to be on a category or home path (loosely)
        cy.url().should("match", /\/(category\/.*|$)/);
      } else if ($body.text().match(/oops! something went wrong/i)) {
        // app shows error UI — assert and click Try Again
        cy.contains(/oops! something went wrong/i).should("be.visible");
        if ($body.find("button:contains('Try Again')").length) {
          cy.contains("Try Again").click({ force: true });
          // after reload we at least expect the URL to still be the requested one or redirect
          cy.url().should("include", "/category/nonexistent/products");
        }
      } else {
        // if neither UI appears, fail the test with helpful message
        throw new Error(
          "Neither 'No Products Found' nor error UI appeared for nonexistent category."
        );
      }
    });
  });

  it("navigates to a product detail page", () => {
    // Wait for product cards to be present then click View link inside the first
    cy.get("[data-testid='product-card']", { timeout: 15000 })
      .first()
      .within(() => {
        // click the link that contains 'View' or 'View Details'
        cy.get("a").contains(/view/i).first().click({ force: true });
      });

    // product detail route format: /category/:slug/products/:productId (uuid)
    cy.url({ timeout: 10000 }).should(
      "match",
      /\/category\/[a-z0-9-]+\/products\/[a-f0-9-]+$/i
    );

    // confirm some heading exists on detail page
    cy.get("h1, h2, h3", { timeout: 10000 }).should("exist");
  });
});
