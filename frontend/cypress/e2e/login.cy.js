describe("Login Component", () => {
  beforeEach(() => {
    // Visit the login page before each test
    cy.visit("/login");
  });

  it("should render login form correctly", () => {
    // Check if all form elements are present
    cy.get("h1").should("contain", "Welcome Back");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
    cy.get('button[type="submit"]').should("contain", "Sign In");
    cy.get('a[href="/register"]').should("contain", "Sign up here");
    cy.get('a[href="/forgot-password"]').should("contain", "Forgot Password?");
  });

  it("should show validation errors for empty fields", () => {
    // Try to submit empty form
    cy.get('button[type="submit"]').click();

    // Check if HTML5 validation kicks in
    cy.get('input[name="email"]:invalid').should("exist");
    cy.get('input[name="password"]:invalid').should("exist");
  });

  it("should toggle password visibility", () => {
    // Initially password should be hidden
    cy.get('input[name="password"]').should("have.attr", "type", "password");

    // Click the eye icon button (more specific selector)
    cy.get('input[name="password"]')
      .parent()
      .find('button[type="button"]')
      .click();

    cy.get('input[name="password"]').should("have.attr", "type", "text");

    // Click again to hide password
    cy.get('input[name="password"]')
      .parent()
      .find('button[type="button"]')
      .click();

    cy.get('input[name="password"]').should("have.attr", "type", "password");
  });

  it("should update form data when typing", () => {
    const email = "ayushtiwari102003@gmail.com";
    const password = "Qwer123";

    cy.get('input[name="email"]').type(email);
    cy.get('input[name="email"]').should("have.value", email);

    cy.get('input[name="password"]').type(password);
    cy.get('input[name="password"]').should("have.value", password);
  });

  it("should handle successful login", () => {
    // Mock the login endpoint
    cy.intercept("POST", "**/auth/v1/token**", {
      statusCode: 200,
      body: {
        access_token: "mock-token",
        refresh_token: "mock-refresh-token",
        user: {
          id: "a36a0ac7-69b6-4d3d-8679-31b507f6efc1",
          email: "ayushtiwari102003@gmail.com",
        },
      },
    }).as("loginRequest");

    // Mock session endpoint - this is crucial
    cy.intercept("POST", "**/auth/v1/token**", (req) => {
      if (req.body && req.body.grant_type === "password") {
        req.reply({
          statusCode: 200,
          body: {
            access_token: "mock-token",
            refresh_token: "mock-refresh-token",
            user: {
              id: "a36a0ac7-69b6-4d3d-8679-31b507f6efc1",
              email: "ayushtiwari102003@gmail.com",
            },
          },
        });
      }
    }).as("loginRequest");

    // Mock the session check
    cy.intercept("GET", "**/auth/v1/user**", {
      statusCode: 200,
      body: {
        id: "a36a0ac7-69b6-4d3d-8679-31b507f6efc1",
        email: "ayushtiwari102003@gmail.com",
      },
    }).as("getUser");

    // Fill form and submit
    cy.get('input[name="email"]').type("ayushtiwari102003@gmail.com");
    cy.get('input[name="password"]').type("Qwer123");
    cy.get('button[type="submit"]').click();

    // Wait for login request
    cy.wait("@loginRequest");

    // Wait for navigation and check success toast
    cy.contains("Welcome back!").should("be.visible");

    // Check URL change - be more flexible
    cy.url().should("not.include", "/login");
    // OR check for specific redirect
    // cy.url().should("match", /^http:\/\/localhost:5173\/?$/);
  });


  it("should handle login failure", () => {
    // Mock failed login response
    cy.intercept("POST", "**/auth/v1/token**", {
      statusCode: 400,
      body: {
        error: "Invalid credentials",
      },
    }).as("failedLogin");

    cy.get('input[name="email"]').type("ayushtiwari102003@gmail.com");
    cy.get('input[name="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();

    cy.wait("@failedLogin");

    // Check if error toast appears (adjust selector based on your toast implementation)
    cy.contains("Login Failed").should("be.visible");
  });

  it("should show loading state during submission", () => {
    // Set up the slow response FIRST, before any interactions
    cy.intercept("POST", "**/auth/v1/token**", {
      delay: 2000, // Increase delay to make it more visible
      statusCode: 200,
      body: {
        access_token: "token",
        user: { id: "123" },
        refresh_token: "refresh-token",
      },
    }).as("slowLogin");

    // Fill form BEFORE setting up the intercept that causes the delay
    cy.get('input[name="email"]').type("ayushtiwari102003@gmail.com");
    cy.get('input[name="password"]').type("Qwer123");

    // Now click submit
    cy.get('button[type="submit"]').click();

    // Immediately check loading state (before the delay kicks in)
    cy.get('button[type="submit"]').should("be.disabled");
    cy.get("svg.animate-spin").should("be.visible");

    // Wait for the slow response to complete
    cy.wait("@slowLogin");

    // Optionally check that loading state is gone
    cy.get('button[type="submit"]').should("not.be.disabled");
  });

}); // ← Make sure this closing bracket is here
