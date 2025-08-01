describe("Register Component", () => {
  beforeEach(() => {
    cy.visit("/register");
  });

  it("should render registration form correctly", () => {
    cy.get("h1").should("contain", "Create Account");
    cy.get('input[name="firstName"]').should("be.visible");
    cy.get('input[name="lastName"]').should("be.visible");
    cy.get('input[name="email"]').should("be.visible");
    cy.get('input[name="phone"]').should("be.visible");
    cy.get('input[name="password"]').should("be.visible");
    cy.get('input[name="confirmPassword"]').should("be.visible");
    cy.get('button[type="submit"]').should("contain", "Create Account");
    cy.get('a[href="/login"]').should("contain", "Sign in here");
  });

  it("should validate required fields", () => {
    cy.get('button[type="submit"]').click();

    // Check HTML5 validation
    cy.get('input[name="firstName"]:invalid').should("exist");
    cy.get('input[name="lastName"]:invalid').should("exist");
    cy.get('input[name="email"]:invalid').should("exist");
    cy.get('input[name="phone"]:invalid').should("exist");
    cy.get('input[name="password"]:invalid').should("exist");
    cy.get('input[name="confirmPassword"]:invalid').should("exist");
  });

  it("should toggle password visibility for both password fields", () => {
    // Test password field
    cy.get('input[name="password"]').should("have.attr", "type", "password");
    cy.get('input[name="password"]').parent().find("button").click();
    cy.get('input[name="password"]').should("have.attr", "type", "text");

    // Test confirm password field
    cy.get('input[name="confirmPassword"]').should(
      "have.attr",
      "type",
      "password"
    );
    cy.get('input[name="confirmPassword"]').parent().find("button").click();
    cy.get('input[name="confirmPassword"]').should("have.attr", "type", "text");
  });

  it("should show error when passwords do not match", () => {
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="phone"]').type("1234567890");
    cy.get('input[name="password"]').type("password123");
    cy.get('input[name="confirmPassword"]').type("differentpassword");

    cy.get('button[type="submit"]').click();

    // Check for password mismatch toast
    cy.contains("Password Mismatch").should("be.visible");
  });

  it("should handle successful registration", () => {
    // Mock successful signup response
    cy.intercept("POST", "**/auth/v1/signup**", {
      statusCode: 200,
      body: {
        user: {
          id: "123",
          email: "john@example.com",
          user_metadata: { name: "John Doe", phone: "1234567890" },
        },
      },
    }).as("signupRequest");

    // Mock customers table insert
    cy.intercept("POST", "**/rest/v1/customers**", {
      statusCode: 201,
      body: [{ user_id: "123", phone: "1234567890" }],
    }).as("insertCustomer");

    // Fill out the form
    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="phone"]').type("1234567890");
    cy.get('input[name="password"]').type("password123");
    cy.get('input[name="confirmPassword"]').type("password123");

    cy.get('button[type="submit"]').click();

    cy.wait("@signupRequest");
    cy.wait("@insertCustomer");

    // Check success toast and redirect
    cy.contains("Account Created!").should("be.visible");
    cy.url().should("include", "/personal-details");
  });

  it("should handle registration failure", () => {
    cy.intercept("POST", "**/auth/v1/signup**", {
      statusCode: 400,
      body: {
        error: "Email already registered",
      },
    }).as("failedSignup");

    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type("existing@example.com");
    cy.get('input[name="phone"]').type("1234567890");
    cy.get('input[name="password"]').type("password123");
    cy.get('input[name="confirmPassword"]').type("password123");

    cy.get('button[type="submit"]').click();

    cy.wait("@failedSignup");
    cy.contains("Registration Failed").should("be.visible");
  });

  it("should update all form fields correctly", () => {
    const formData = {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "9876543210",
      password: "securepassword123",
      confirmPassword: "securepassword123",
    };

    // Type in all fields
    Object.entries(formData).forEach(([field, value]) => {
      cy.get(`input[name="${field}"]`).type(value);
      cy.get(`input[name="${field}"]`).should("have.value", value);
    });
  });

  it("should show loading state during registration", () => {
    cy.intercept("POST", "**/auth/v1/signup**", {
      delay: 1000,
      statusCode: 200,
      body: { user: { id: "123" } },
    }).as("slowSignup");

    cy.get('input[name="firstName"]').type("John");
    cy.get('input[name="lastName"]').type("Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="phone"]').type("1234567890");
    cy.get('input[name="password"]').type("password123");
    cy.get('input[name="confirmPassword"]').type("password123");

    cy.get('button[type="submit"]').click();

    cy.get('button[type="submit"]').should("be.disabled");
    cy.get('button[type="submit"]').should("contain", "Creating Account...");

    cy.wait("@slowSignup");
  });
});
