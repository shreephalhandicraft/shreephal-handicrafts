describe("Shop Page Tests", () => {
  const BASE_URL = "http://localhost:5173"; // adjust if needed

  beforeEach(() => {
    // Intercept API calls to Supabase for GET requests
    cy.intercept('GET', '**/rest/v1/categories*', { fixture: 'categories.json' }).as('getCategories');
    cy.visit(`${BASE_URL}/shop`);
  });

  describe("Page Loading and Initial State", () => {
    it("renders shop page elements correctly", () => {
      cy.contains("Our Categories").should("exist");
      cy.contains("Explore our diverse collection of categories").should("exist");
      cy.get('input[placeholder*="Search categories"]').should("exist");
      cy.get('[data-cy="search-input"]').should("exist");
    });

    it("shows loading state initially", () => {
      cy.intercept('GET', '**/rest/v1/categories*', (req) => {
        req.reply((res) => {
          // Delay response to test loading state
          setTimeout(() => res.send({ fixture: 'categories.json' }), 1000);
        });
      }).as('getCategories');
      
      cy.visit(`${BASE_URL}/shop`);
      cy.contains("Loading our categories...").should("exist");
      cy.get('[data-cy="loader"]').should("exist");
      cy.wait('@getCategories');
      cy.contains("Loading our categories...").should("not.exist");
    });

    it("displays error state when API fails", () => {
      cy.intercept('GET', '**/rest/v1/categories*', {
        statusCode: 500,
        body: { error: 'Internal Server Error' }
      }).as('getCategoriesError');
      
      cy.visit(`${BASE_URL}/shop`);
      cy.wait('@getCategoriesError');
      cy.contains("Oops! Something went wrong").should("exist");
      cy.contains("Failed to load categories").should("exist");
      cy.get('button').contains("Try Again").should("exist");
    });
  });

  describe("Search Functionality", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("searches categories by name", () => {
      cy.get('input[placeholder*="Search categories"]').type("Trophy");
      cy.get('[data-cy="category-card"]').should("contain.text", "Trophy");
      
      // Clear search
      cy.get('button').contains('×').click();
      cy.get('input[placeholder*="Search categories"]').should("have.value", "");
    });

    it("shows no results message for invalid search", () => {
      cy.get('input[placeholder*="Search categories"]').type("NonExistentCategory123");
      cy.contains("No Categories Found").should("exist");
      cy.contains('No categories match "NonExistentCategory123"').should("exist");
      cy.get('button').contains("Clear Search").should("exist");
    });

    it("updates search results count", () => {
      cy.get('[data-cy="results-count"]').should("contain", "categories found");
      cy.get('input[placeholder*="Search categories"]').type("Frame");
      cy.get('[data-cy="results-count"]').should("contain", "of");
    });

    it("clears search using clear button", () => {
      cy.get('input[placeholder*="Search categories"]').type("Test Search");
      cy.get('button[data-cy="clear-search"]').click();
      cy.get('input[placeholder*="Search categories"]').should("have.value", "");
    });
  });

  describe("Sorting Functionality", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("sorts categories by name ascending", () => {
      cy.get('select[data-cy="sort-select"]').select("name-asc");
      cy.get('[data-cy="category-card"]').first().should("contain", "A"); // Assuming first starts with A
    });

    it("sorts categories by name descending", () => {
      cy.get('select[data-cy="sort-select"]').select("name-desc");
      // Additional assertions as needed
    });

    it("sorts categories by price low to high", () => {
      cy.get('select[data-cy="sort-select"]').select("price-low");
      // Additional assertions as needed
    });

    it("sorts categories by price high to low", () => {
      cy.get('select[data-cy="sort-select"]').select("price-high");
      // Additional assertions as needed
    });

    it("shows featured categories first", () => {
      cy.get('select[data-cy="sort-select"]').select("featured");
      cy.get('[data-cy="category-card"]').first().should("contain", "Featured");
    });

    it("sorts by highest rating", () => {
      cy.get('select[data-cy="sort-select"]').select("rating-high");
      // Additional assertions as needed
    });
  });

  describe("View Mode Toggle", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("switches between grid and list view", () => {
      cy.get('[data-cy="grid-view-btn"]').should("have.class", "bg-primary");
      cy.get('[data-cy="list-view-btn"]').click();
      cy.get('[data-cy="list-view-btn"]').should("have.class", "bg-primary");
      cy.get('[data-cy="categories-container"]').should("have.class", "space-y-6");
      cy.get('[data-cy="grid-view-btn"]').click();
      cy.get('[data-cy="grid-view-btn"]').should("have.class", "bg-primary");
      cy.get('[data-cy="categories-container"]').should("contain.class", "grid");
    });

    it("displays categories correctly in list view", () => {
      cy.get('[data-cy="list-view-btn"]').click();
      cy.get('[data-cy="category-card"]').first().within(() => {
        cy.get('img, [data-cy="category-image"]').should("exist");
        cy.get('h3').should("exist");
        cy.get('button').contains("Browse Category").should("exist");
      });
    });

    it("displays categories correctly in grid view", () => {
      cy.get('[data-cy="grid-view-btn"]').click();
      cy.get('[data-cy="category-card"]').first().within(() => {
        cy.get('img, [data-cy="category-image"]').should("exist");
        cy.get('h3').should("exist");
        cy.get('a').contains("Browse Category").should("exist");
      });
    });
  });

  describe("Category Cards", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("displays category information correctly", () => {
      cy.get('[data-cy="category-card"]').first().within(() => {
        cy.get('h3').should("exist");
        cy.get('[data-cy="category-price"]').should("exist");
        cy.get('button, a').contains("Browse Category").should("exist");
      });
    });

    it("shows featured badge for featured categories", () => {
      cy.get('[data-cy="category-card"]').each(($card) => {
        cy.wrap($card).then(($el) => {
          if ($el.find('[data-cy="featured-badge"]').length > 0) {
            cy.wrap($card).find('[data-cy="featured-badge"]').should("contain", "Featured");
          }
        });
      });
    });

    it("displays rating when available", () => {
      cy.get('[data-cy="category-card"]').each(($card) => {
        cy.wrap($card).then(($el) => {
          if ($el.find('[data-cy="category-rating"]').length > 0) {
            cy.wrap($card).find('[data-cy="category-rating"]').should("be.visible");
          }
        });
      });
    });

    it("handles image loading states", () => {
      cy.get('[data-cy="category-card"]').first().within(() => {
        cy.get('img, [data-cy="fallback-icon"]').should("exist");
      });
    });

    it("navigates to category products page when clicked", () => {
      cy.get('[data-cy="category-card"]').first().within(() => {
        cy.get('a[href*="/category/"]').should("have.attr", "href").and("include", "/products");
      });
    });
  });

  describe("Image Optimization", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("loads optimized Cloudinary images", () => {
      cy.get('[data-cy="category-card"] img').each(($img) => {
        cy.wrap($img).should("have.attr", "src").then((src) => {
          if (src && src.includes("cloudinary.com")) {
            expect(src).to.include("f_auto");
            expect(src).to.include("q_auto");
          }
        });
      });
    });

    it("shows fallback UI when image fails to load", () => {
      cy.get('[data-cy="category-card"]').first().within(() => {
        cy.get('img').then(($img) => {
          if ($img.length > 0) {
            cy.wrap($img[0]).trigger('error');
            cy.get('[data-cy="fallback-icon"]').should("exist");
          }
        });
      });
    });
  });

  describe("Responsive Design", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("displays correctly on mobile devices", () => {
      cy.viewport('iphone-x');
      cy.get('h1').should("be.visible");
      cy.get('input[placeholder*="Search categories"]').should("be.visible");
      cy.get('[data-cy="category-card"]').should("be.visible");
    });

    it("displays correctly on tablet devices", () => {
      cy.viewport('ipad-2');
      cy.get('[data-cy="categories-container"]').should("be.visible");
      cy.get('[data-cy="view-mode-controls"]').should("be.visible");
    });

    it("displays correctly on desktop", () => {
      cy.viewport(1920, 1080);
      cy.get('[data-cy="categories-container"]').should("be.visible");
      cy.get('[data-cy="category-card"]').should("have.length.at.least", 1);
    });
  });

  describe("Performance and Accessibility", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("has proper heading hierarchy", () => {
      cy.get('h1').should("exist").and("contain", "Our Categories");
      cy.get('h3').should("exist");
    });

    it("has accessible form elements", () => {
      cy.get('input[placeholder*="Search categories"]')
        .should("have.attr", "type", "text")
        .and("be.visible");
      cy.get('select[data-cy="sort-select"]').should("be.visible");
    });

    it("has proper loading indicators", () => {
      cy.intercept('GET', '**/rest/v1/categories*', (req) => {
        req.reply((res) => {
          setTimeout(() => res.send({ fixture: 'categories.json' }), 500);
        });
      }).as('getCategories');

      cy.visit(`${BASE_URL}/shop`);
      cy.get('[data-cy="loader"]').should("exist");
      cy.wait('@getCategories');
      cy.get('[data-cy="loader"]').should("not.exist");
    });
  });

  describe("Error Handling", () => {
    it("handles network errors gracefully", () => {
      cy.intercept('GET', '**/rest/v1/categories*', { forceNetworkError: true }).as('networkError');
      cy.visit(`${BASE_URL}/shop`);
      cy.wait('@networkError');
      cy.contains("Failed to load categories").should("exist");
      cy.get('button').contains("Try Again").should("exist");
    });

    it("retries loading when Try Again is clicked", () => {
      cy.intercept('GET', '**/rest/v1/categories*', { forceNetworkError: true }).as('networkError');
      cy.visit(`${BASE_URL}/shop`);
      cy.wait('@networkError');

      cy.intercept('GET', '**/rest/v1/categories*', { fixture: 'categories.json' }).as('getCategories');
      cy.get('button').contains("Try Again").click();
      cy.contains("Our Categories").should("exist");
    });
  });

  describe("Integration Tests", () => {
    beforeEach(() => {
      cy.wait('@getCategories', { timeout: 10000 });
    });

    it("completes full user journey - search, sort, and navigate", () => {
      cy.get('input[placeholder*="Search categories"]').type("Trophy");
      cy.get('select[data-cy="sort-select"]').select("price-low");
      cy.get('[data-cy="list-view-btn"]').click();

      cy.get('[data-cy="category-card"]').first().within(() => {
        cy.get('a, button').contains("Browse Category").click();
      });

      cy.url().should("include", "/category/");
    });

    it("maintains state during interactions", () => {
      cy.get('input[placeholder*="Search categories"]').type("Frame");
      cy.get('select[data-cy="sort-select"]').select("price-high");
      cy.get('[data-cy="list-view-btn"]').click();

      cy.get('input[placeholder*="Search categories"]').should("have.value", "Frame");
      cy.get('select[data-cy="sort-select"]').should("have.value", "price-high");
      cy.get('[data-cy="list-view-btn"]').should("have.class", "bg-primary");
    });
  });
});
