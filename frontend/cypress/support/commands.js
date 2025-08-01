// cypress/support/commands.js

// Custom commands for authentication testing
Cypress.Commands.add(
  "login",
  (email = "ayushtiwari102003@gmail.com", password = "Qwer123") => {
    cy.visit("/login");
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
  }
);

// Add this to cypress/support/commands.js
Cypress.Commands.add('mockSuccessfulRegistration', () => {
  cy.intercept("POST", "**/auth/v1/signup**", {
    statusCode: 200,
    body: {
      user: {
        id: "new-user-123",
        email: "john@example.com",
        user_metadata: { name: "John Doe", phone: "1234567890" },
      },
      session: {
        access_token: "mock-signup-token",
        refresh_token: "mock-refresh-token",
        user: {
          id: "new-user-123",
          email: "john@example.com",
        }
      }
    },
  }).as("signupRequest");

  cy.intercept("POST", "**/rest/v1/customers**", {
    statusCode: 201,
    body: [{ user_id: "new-user-123", phone: "1234567890" }],
  }).as("insertCustomer");

  // Mock session to authenticate user after signup
  cy.intercept("GET", "**/auth/v1/session**", {
    statusCode: 200,
    body: {
      data: {
        session: {
          access_token: "mock-signup-token",
          user: {
            id: "new-user-123",
            email: "john@example.com",
          }
        }
      }
    },
  }).as("getSession");

  // Set auth token in localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock-signup-token',
      refresh_token: 'mock-refresh-token',
      user: {
        id: 'new-user-123',
        email: 'john@example.com'
      }
    }));
  });
});


// Custom command to mock authentication
Cypress.Commands.add("mockAuth", (shouldSucceed = true) => {
  if (shouldSucceed) {
    cy.intercept("POST", "**/auth/v1/token**", {
      statusCode: 200,
      body: {
        access_token: "mock-token",
        user: { id: "123", email: "ayushtiwari102003@gmail.com" },
      },
    }).as("authRequest");
  } else {
    cy.intercept("POST", "**/auth/v1/token**", {
      statusCode: 400,
      body: { error: "Invalid credentials" },
    }).as("authRequest");
  }
});

// Add custom command for Supabase auth mocking
Cypress.Commands.add("mockSupabaseAuth", (scenario = "success") => {
  switch (scenario) {
    case "success":
      cy.intercept("POST", "**/auth/v1/token**", {
        statusCode: 200,
        body: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          user: {
            id: "mock-user-id",
            email: "ayushtiwari102003@gmail.com",
            user_metadata: { name: "Test User" },
          },
        },
      }).as("authLogin");
      break;

    case "signup":
      cy.intercept("POST", "**/auth/v1/signup**", {
        statusCode: 200,
        body: {
          user: {
            id: "new-user-id",
            email: "newuser@example.com",
            user_metadata: { name: "New User" },
          },
        },
      }).as("authSignup");
      break;

    case "failure":
      cy.intercept("POST", "**/auth/v1/token**", {
        statusCode: 400,
        body: {
          error: "Invalid login credentials",
        },
      }).as("authLoginFailed");
      break;
  }
});
