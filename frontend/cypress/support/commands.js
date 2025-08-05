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

// Custom commands for better test organization
Cypress.Commands.add('checkSectionExists', (sectionTitle) => {
  cy.contains('h2', sectionTitle).should('be.visible');
});

Cypress.Commands.add('checkListItems', (selector, expectedCount) => {
  cy.get(`${selector} li`).should('have.length.at.least', expectedCount);
});

Cypress.Commands.add('checkResponsiveLayout', () => {
  const viewports = [
    { width: 375, height: 667 }, // Mobile
    { width: 768, height: 1024 }, // Tablet
    { width: 1280, height: 720 }  // Desktop
  ];

  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.get('h1').should('be.visible');
    cy.get('.container').should('be.visible');
  });
});

// Custom commands for the Unauthorized page
Cypress.Commands.add('checkUnauthorizedPageElements', () => {
  cy.get('[data-testid="shield-icon"]').should("be.visible");
  cy.contains('Access Denied').should('be.visible');
  cy.contains('You don\'t have permission').should('be.visible');
  cy.get('button').should('contain.text', 'Go Home');
});

Cypress.Commands.add('checkUnauthorizedResponsive', () => {
  const viewports = [
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 1280, height: 720 }
  ];

  viewports.forEach(viewport => {
    cy.viewport(viewport.width, viewport.height);
    cy.checkUnauthorizedPageElements();
  });
});
