// cypress/e2e/shop.cy.js

const categoriesFixture = [
  {
    id: 1,
    name: "Calendars",
    slug: "calendars",
    featured: true,
    price: 400,
    rating: 4.5,
  },
  {
    id: 2,
    name: "Corporate Awards",
    slug: "awards",
    featured: false,
    price: 48000,
    rating: 4.5,
  },
  {
    id: 3,
    name: "Key Holders",
    slug: "key-holders",
    featured: false,
    price: 350,
    rating: 4.2,
  },
  {
    id: 4,
    name: "Personalized Gifts",
    slug: "personalized-gifts",
    featured: true,
    price: 32000,
    rating: 4.4,
  },
];

describe("Shop Categories Page", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/rest/v1/categories*", {
      body: categoriesFixture,
    }).as("getCategories");
    cy.visit("/shop");
    cy.wait("@getCategories");
  });

  // Test: Featured badge should reflect 'featured' in dummy data (both views)
  ["grid", "list"].forEach((viewMode) => {
    it(`shows featured badge only for featured categories in ${viewMode} view`, () => {
      if (viewMode === "grid") {
        cy.get("[data-cy=grid-view-btn]").click();
      } else {
        cy.get("[data-cy=list-view-btn]").click();
      }

      cy.get("[data-cy=category-card]").each(($card, idx) => {
        if (categoriesFixture[idx].featured) {
          cy.wrap($card)
            .find("[data-cy=featured-badge]")
            .should("exist")
            .and("contain.text", "Featured");
        } else {
          cy.wrap($card).find("[data-cy=featured-badge]").should("not.exist");
        }
      });
    });
  });

  it("shows loader and then categories", () => {
    cy.get("[data-cy=loader]").should("exist");
    cy.get("[data-cy=loader]", { timeout: 10000 }).should("not.exist");
    cy.get("[data-cy=categories-container]").should("exist");
  });

  it("displays correct number of category cards", () => {
    cy.get("[data-cy=category-card]").should(
      "have.length",
      categoriesFixture.length
    );
    cy.get("[data-cy=results-count]")
      .invoke("text")
      .then((text) => {
        const match = text.match(/(\d+) of (\d+)/);
        expect(parseInt(match[1])).to.eq(categoriesFixture.length);
      });
  });

  it("shows card details: name, price, rating", () => {
    cy.get("[data-cy=category-card]")
      .first()
      .within(() => {
        cy.get("h3").should("be.visible");
        cy.get("[data-cy=category-price]").should("be.visible");
        cy.get("[data-cy=category-rating]").should("exist");
      });
  });

  it("shows image or fallback for each category", () => {
    cy.get("[data-cy=category-card]").each(($el) => {
      cy.wrap($el)
        .find("[data-cy=category-image], [data-cy=fallback-icon]")
        .should("exist");
    });
  });

  it("filters categories using the search bar", () => {
    cy.get("[data-cy=search-input]").type("Gift");
    cy.get("[data-cy=category-card]").should("contain", "Gift");
  });

  it("clears search and restores all categories", () => {
    cy.get("[data-cy=search-input]").type("zzzzzz");
    cy.get("[data-cy=category-card]").should("not.exist");
    cy.get("[data-cy=clear-search]").click();
    cy.get("[data-cy=category-card]").should("exist");
  });

  it("sorts categories by dropdown", () => {
    cy.get("[data-cy=sort-select]").select("Highest Rated");
    cy.get("[data-cy=category-rating]").first().should("contain", "4.5");
  });

  it("switches view modes", () => {
    cy.get("[data-cy=list-view-btn]").click();
    cy.get("[data-cy=category-card]").first().should("have.class", "bg-white");
    cy.get("[data-cy=grid-view-btn]").click();
    cy.get("[data-cy=category-card]").first().should("have.class", "bg-white");
  });

  it("shows empty state if no categories match", () => {
    cy.get("[data-cy=search-input]").type("nomatch");
    cy.contains("No Categories Found").should("exist");
  });

  it('navigates when "Browse Category" is clicked', () => {
    cy.get("[data-cy=category-card]")
      .first()
      .within(() => {
        cy.get("a").contains("Browse Category").click();
      });
    cy.url().should("include", "/category/");
    cy.url().should("include", "/products");
  });
});
