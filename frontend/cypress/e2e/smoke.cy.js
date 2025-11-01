describe("Smoke test", () => {
  it("loads the homepage", () => {
    cy.visit("/");
    cy.contains("Shop"); // adjust for something on your home page
  });
});
