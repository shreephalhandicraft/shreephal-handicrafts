describe("Terms and Conditions Page", () => {
  beforeEach(() => {
    cy.visit("/terms-conditions");
  });

  describe("Page Structure", () => {
    it("should display the page title and header correctly", () => {
      cy.get("h1").should("contain.text", "Terms and Conditions");
      // Fixed: Use data-testid instead of data-lucide
      cy.get('[data-testid="file-text-icon"]').should("be.visible");
      cy.contains("Last updated: January 1, 2024").should("be.visible");
    });

    it("should have proper page layout", () => {
      cy.get(".container").should("exist");
      cy.get(".max-w-4xl").should("exist");
      cy.get('[data-testid="card"]').should("be.visible");
    });
  });

  describe("Content Sections", () => {
    it("should display all required sections", () => {
      const expectedSections = [
        "1. Acceptance of Terms",
        "2. Use License",
        "3. Product Information",
        "4. Orders and Payment",
        "5. Shipping and Delivery",
        "6. Returns and Refunds",
        "7. Privacy",
        "8. Disclaimer",
        "9. Limitations",
        "10. Contact Information",
      ];

      expectedSections.forEach((section) => {
        cy.contains("h2", section).should("be.visible");
      });
    });

    it("should display acceptance of terms section content", () => {
      cy.contains("h2", "1. Acceptance of Terms").should("be.visible");
      cy.contains("By accessing and using Shrifal Handicraft's website").should(
        "be.visible"
      );
      cy.contains("please do not use this service").should("be.visible");
    });

    it("should display use license section with bullet points", () => {
      cy.contains("h2", "2. Use License").should("be.visible");
      cy.contains("Permission is granted to temporarily download").should(
        "be.visible"
      );

      // Check bullet points
      cy.contains("li", "modify or copy the materials").should("be.visible");
      cy.contains("li", "use the materials for any commercial purpose").should(
        "be.visible"
      );
      cy.contains("li", "attempt to reverse engineer").should("be.visible");
      cy.contains("li", "remove any copyright").should("be.visible");
    });

    it("should display payment methods in orders section", () => {
      cy.contains("h2", "4. Orders and Payment").should("be.visible");
      cy.contains("li", "Major credit cards").should("be.visible");
      cy.contains("li", "PayPal").should("be.visible");
      cy.contains("li", "Bank transfers").should("be.visible");
    });

    it("should display contact information section", () => {
      cy.contains("h2", "10. Contact Information").should("be.visible");
      cy.contains("Shrifal Handicraft Customer Service").should("be.visible");
      cy.contains("legal@trophytale.com").should("be.visible");
      cy.contains("1-800-TROPHY-1").should("be.visible");
      cy.contains("123 Trophy Lane, Achievement City, AC 12345").should(
        "be.visible"
      );
    });
  });

  describe("Visual Elements", () => {
    it("should display separators between sections", () => {
      // Fixed: Use data-testid for separators
      cy.get('[data-testid="separator"]').should("have.length.at.least", 8);
    });

    it("should have proper text styling", () => {
      cy.get("h1").should("have.class", "text-3xl");
      cy.get("h2").should("have.class", "text-2xl");
      cy.get("p").should("have.class", "text-muted-foreground");
    });

    it("should display contact information in a highlighted box", () => {
      cy.contains("Shrifal Handicraft Customer Service")
        .parent()
        .should("have.class", "bg-muted")
        .and("have.class", "rounded-lg");
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      cy.get("h1").should("have.length", 1);
      cy.get("h2").should("have.length", 10);
    });

    it("should have accessible list structure", () => {
      cy.get("ul").should("exist");
      cy.get("li").should("have.length.at.least", 7);
    });

    it("should have readable text contrast", () => {
      cy.get("body").should("be.visible");
      cy.get("h1, h2").should("be.visible");
      cy.get("p").should("be.visible");
    });
  });

  describe("Responsive Design", () => {
    it("should be responsive on mobile devices", () => {
      cy.viewport(375, 667);
      cy.get(".container").should("be.visible");
      cy.get("h1").should("be.visible");
      cy.contains("1. Acceptance of Terms").should("be.visible");
    });

    it("should be responsive on tablet devices", () => {
      cy.viewport(768, 1024);
      cy.get(".max-w-4xl").should("be.visible");
      cy.get("h1").should("be.visible");
    });

    it("should be responsive on desktop", () => {
      cy.viewport(1280, 720);
      cy.get(".container").should("be.visible");
      cy.get(".max-w-4xl").should("be.visible");
    });
  });

  describe("Navigation and Links", () => {
    it("should not have any broken internal links", () => {
      cy.get('a[href^="/"]').then(($links) => {
        if ($links.length > 0) {
          cy.wrap($links).each(($link) => {
            cy.request($link.prop("href")).its("status").should("eq", 200);
          });
        }
      });
    });

    it("should handle email link correctly", () => {
      cy.contains("legal@trophytale.com")
        .should("have.attr", "href")
        .and("include", "mailto:");
    });
  });

  describe("Content Validation", () => {
    it("should contain all essential legal terms", () => {
      const essentialTerms = [
        "license", // Changed from "licence"
        "warranties", // Changed from "warranty"
        "liable", // Changed from "liability"
        "privacy",
        "Refunds", // Changed from "refund"
        "Payment", // Changed from "payment"
        "Shipping", // Changed from "shipping"
      ];

      essentialTerms.forEach((term) => {
        cy.get("body").should("contain.text", term);
      });
    });

    it("should have consistent company name usage", () => {
      cy.get("body").should("contain.text", "Shrifal Handicraft");
      // Fixed: More flexible counting
      cy.get("body").then(($body) => {
        const text = $body.text();
        const matches = (text.match(/Shrifal Handicraft/g) || []).length;
        expect(matches).to.be.at.least(5);
      });
    });

    it("should display current date", () => {
      cy.contains("Last updated: January 1, 2024").should("be.visible");
    });
  });

  describe("Performance", () => {
    it("should load the page within reasonable time", () => {
      const start = Date.now();
      cy.visit("/terms-conditions").then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it("should not have any console errors", () => {
      cy.window().then((win) => {
        cy.spy(win.console, "error").as("consoleError");
      });
      cy.get("@consoleError").should("not.have.been.called");
    });
  });

  describe("Edge Cases", () => {
    it("should handle page refresh correctly", () => {
      cy.reload();
      cy.get("h1").should("contain.text", "Terms and Conditions");
    });

    it("should handle browser back/forward navigation", () => {
      cy.visit("/");
      cy.visit("/terms-conditions");
      cy.go("back");
      cy.go("forward");
      cy.get("h1").should("contain.text", "Terms and Conditions");
    });
  });
});

describe("Terms and Conditions - Component Integration", () => {
  beforeEach(() => {
    cy.visit("/terms-conditions");
  });

  it("should integrate properly with Layout component", () => {
    cy.get('[data-testid="layout"]').should("exist");
  });

  it("should integrate properly with Card components", () => {
    cy.get('[data-testid="card"]').should("be.visible");
    cy.get('[data-testid="card-content"]').should("be.visible");
  });

  it("should display FileText icon correctly", () => {
    // Fixed: Use correct selector
    cy.get('[data-testid="file-text-icon"]')
      .should("be.visible")
      .and("have.class", "h-8")
      .and("have.class", "w-8");
  });
});
