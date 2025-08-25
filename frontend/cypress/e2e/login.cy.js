describe("Login Page Tests", () => {
  const BASE_URL = "http://localhost:5173"; // adjust if needed

  beforeEach(() => {
    cy.visit(`${BASE_URL}/login`);
  });

  it("renders login page elements correctly", () => {
    cy.contains("Welcome Back");
    cy.get('input[name="email"]').should("exist");
    cy.get('input[name="password"]').should("exist");
    cy.contains("Sign In");
    cy.contains("Forgot Password?").should(
      "have.attr",
      "href",
      "/forgot-password"
    );
    cy.contains("Sign up here").should("have.attr", "href", "/register");
  });

  it("allows user to toggle password visibility", () => {
    cy.get('input[name="password"]').should("have.attr", "type", "password");
    cy.get('button[type="button"]').click(); // toggle eye icon
    cy.get('input[name="password"]').should("have.attr", "type", "text");
    cy.get('button[type="button"]').click(); // toggle back
    cy.get('input[name="password"]').should("have.attr", "type", "password");
  });

  it("logs in successfully with valid credentials", () => {
    cy.get('input[name="email"]').type("jainarchi023@gmail.com");
    cy.get('input[name="password"]').type("123456789");
    cy.contains("Sign In").click();

    // after login, user should be redirected
    cy.url().should("eq", `${BASE_URL}/`);
    cy.contains("Welcome back!", { timeout: 5000 }).should("exist"); // toast check
  });

  it("shows error message with invalid credentials", () => {
    cy.get('input[name="email"]').type("wrong@email.com");
    cy.get('input[name="password"]').type("wrongpass");
    cy.contains("Sign In").click();

    // verify error toast appears
    cy.contains("Login Failed", { timeout: 5000 }).should("exist");

    // Supabase may return its own message OR your fallback
    cy.get("body").then(($body) => {
      if ($body.text().includes("Invalid login credentials")) {
        cy.contains("Invalid login credentials").should("exist");
      } else {
        cy.contains("Please check your credentials and try again.").should(
          "exist"
        );
      }
    });
  });
});
