describe("About Page", () => {
  beforeEach(() => {
    cy.visit("/about");
  });

  describe("Page Structure and Layout", () => {
    it("should render within Layout component", () => {
      cy.get('[data-testid="layout"]').should("exist");
    });

    it("should have all main sections", () => {
      cy.get(".bg-gradient-to-br.from-primary\\/5").should("exist");
      cy.get("section").should("have.length", 5);
    });

    it("should have proper container structure", () => {
      cy.get(".container.mx-auto").should("have.length.at.least", 4);
    });
  });

  describe("Hero Section", () => {
    it("should display the main heading", () => {
      cy.get("h1")
        .should("contain.text", "About Shreephal-Handicrafts")
        .and("have.class", "text-4xl")
        .and("have.class", "md:text-5xl")
        .and("be.visible");
    });

    it("should display the hero description", () => {
      cy.contains(
        "We're passionate about creating beautiful, personalized items"
      )
        .should("be.visible")
        .and("have.class", "text-xl");
    });

    it("should have proper hero styling", () => {
      cy.get(".bg-gradient-to-br.from-primary\\/5.to-yellow-50")
        .should("exist")
        .and("have.class", "py-20");
    });

    it("should center the hero content", () => {
      cy.get(".text-center.max-w-3xl.mx-auto").should("exist");
    });
  });

  describe("Our Story Section", () => {
    it('should display the "Our Story" heading', () => {
      cy.contains("h2", "Our Story")
        .should("be.visible")
        .and("have.class", "text-3xl");
    });

    it("should display story content paragraphs", () => {
      cy.contains("Founded in 2020, Shreephal-Handicrafts began").should(
        "be.visible"
      );
      cy.contains("What started as a local shop").should("be.visible");
      cy.contains("Today, we continue to uphold").should("be.visible");
    });

    it("should display statistics grid", () => {
      const stats = [
        { value: "1000+", label: "Happy Customers" },
        { value: "5000+", label: "Products Created" },
        { value: "4.8★", label: "Customer Rating" },
        { value: "24h", label: "Fast Turnaround" },
      ];

      stats.forEach((stat) => {
        cy.contains(".text-3xl", stat.value).should("be.visible");
        cy.contains(".text-sm", stat.label).should("be.visible");
      });
    });

    it("should have proper grid layout", () => {
      cy.get(".grid.grid-cols-1.lg\\:grid-cols-2").should("exist");
      cy.get(".grid.grid-cols-2.gap-6").should("exist");
    });

    it("should have proper background styling for stats", () => {
      cy.get(".bg-gradient-to-br.from-primary\\/10.to-yellow-100")
        .should("exist")
        .and("have.class", "rounded-2xl");
    });
  });

  describe("Our Values Section", () => {
    it("should display the values heading and description", () => {
      cy.contains("h2", "Our Values")
        .should("be.visible")
        .and("have.class", "text-3xl");

      cy.contains("These core values guide everything we do").should(
        "be.visible"
      );
    });

    it("should display all four value cards", () => {
      const values = [
        {
          testId: "award-icon",
          title: "Quality First",
          description: "We use only the finest materials",
        },
        {
          testId: "users-icon",
          title: "Customer Focus",
          description: "Your satisfaction is our priority",
        },
        {
          testId: "clock-icon",
          title: "Reliability",
          description: "Count on us for timely delivery",
        },
        {
          testId: "heart-icon",
          title: "Passion",
          description: "We love what we do",
        },
      ];

      values.forEach((value) => {
        cy.get(`[data-testid="${value.testId}"]`).should("be.visible");
        cy.contains("h3", value.title).should("be.visible");
        cy.contains(value.description).should("be.visible");
      });
    });

    it("should have proper icon styling", () => {
      cy.get('[data-testid="award-icon"]')
        .should("have.class", "h-8")
        .and("have.class", "w-8")
        .and("have.class", "text-primary");
    });

    it("should have proper grid layout for values", () => {
      cy.get(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4").should(
        "exist"
      );
    });

    it("should have centered text alignment", () => {
      cy.get(".text-center").should("have.length.at.least", 4);
    });

    it("should have proper background for values section", () => {
      cy.get(".py-20.bg-gray-50").should("exist");
    });
  });

  describe("Team Section", () => {
    it("should display the team heading and description", () => {
      cy.contains("h2", "Meet Our Team")
        .should("be.visible")
        .and("have.class", "text-3xl");

      cy.contains(
        "The passionate individuals behind Shreephal-Handicrafts"
      ).should("be.visible");
    });

    it("should display all team members", () => {
      const teamMembers = [
        {
          name: "Sarah Johnson",
          role: "Founder & CEO",
          description: "Creative visionary with 15 years",
        },
        {
          name: "Mike Chen",
          role: "Head of Production",
          description: "Master craftsman ensuring",
        },
        {
          name: "Emma Davis",
          role: "Customer Success",
          description: "Dedicated to making every customer",
        },
      ];

      teamMembers.forEach((member) => {
        cy.contains("h3", member.name).should("be.visible");
        cy.contains(member.role).should("be.visible");
        cy.contains(member.description).should("be.visible");
      });
    });

    it("should have proper team member layout", () => {
      cy.get(".grid.grid-cols-1.md\\:grid-cols-3").should("exist");
      cy.get(".max-w-4xl.mx-auto").should("exist");
    });

    it("should display team member avatars with icons", () => {
      cy.get(".w-32.h-32.bg-gradient-to-br").should("have.length", 3);
      cy.get('[data-testid="sarah-icon"]').should("exist");
      cy.get('[data-testid="mike-icon"]').should("exist");
      cy.get('[data-testid="emma-icon"]').should("exist");
    });
  });

  describe("Visual Elements and Styling", () => {
    it("should have proper gradient backgrounds", () => {
      cy.get(".bg-gradient-to-br").should("have.length.at.least", 4);
    });

    it("should use consistent color scheme", () => {
      cy.get(".text-primary").should("have.length.at.least", 8);
      cy.get(".text-gray-900").should("have.length.at.least", 6);
      cy.get(".text-gray-600").should("have.length.at.least", 10);
    });

    it("should have proper spacing classes", () => {
      cy.get(".py-20").should("have.length", 4);
      cy.get(".mb-6").should("have.length.at.least", 4);
    });

    it("should display icons with proper styling", () => {
      const iconTestIds = [
        "award-icon",
        "users-icon",
        "clock-icon",
        "heart-icon",
        "sarah-icon",
        "mike-icon",
        "emma-icon",
      ];
      iconTestIds.forEach((testId) => {
        cy.get(`[data-testid="${testId}"]`).should("be.visible");
      });
    });
  });

  describe("Responsive Design", () => {
    it("should be responsive on mobile devices", () => {
      cy.viewport(375, 667);

      cy.get("h1").should("be.visible");
      cy.contains("Our Story").should("be.visible");
      cy.contains("Our Values").should("be.visible");
      cy.contains("Meet Our Team").should("be.visible");
    });

    it("should adjust grid layouts on different screen sizes", () => {
      // Mobile
      cy.viewport(375, 667);
      cy.get(".grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4").should(
        "exist"
      );

      // Tablet
      cy.viewport(768, 1024);
      cy.get(".grid.grid-cols-1.md\\:grid-cols-3").should("exist");

      // Desktop
      cy.viewport(1280, 720);
      cy.get(".max-w-3xl.mx-auto").should("exist");
    });

    it("should have responsive text sizes", () => {
      cy.get(".text-4xl.md\\:text-5xl").should("exist");
      cy.get(".text-3xl.md\\:text-4xl").should("exist");
    });

    it("should maintain proper spacing on all devices", () => {
      const viewports = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1280, height: 720 },
      ];

      viewports.forEach((viewport) => {
        cy.viewport(viewport.width, viewport.height);
        cy.get(".container.mx-auto.px-4").should("exist");
        cy.get(".py-20").should("have.length", 4);
      });
    });
  });

  describe("Content Accuracy", () => {
    it("should display correct company founding year", () => {
      cy.contains("Founded in 2020").should("be.visible");
    });

    it("should display accurate statistics", () => {
      cy.contains("1000+").should("be.visible");
      cy.contains("5000+").should("be.visible");
      cy.contains("4.8★").should("be.visible");
      cy.contains("24h").should("be.visible");
    });

    it("should have consistent company name usage", () => {
      cy.visit("/about");

      // Wait until at least one occurrence is visible
      cy.contains("Shreephal-Handicrafts").should("be.visible");

      cy.get("body").then(($body) => {
        const text = $body.text();
        const matches = (text.match(/Shreephal-Handicrafts/g) || []).length;
        expect(matches).to.be.at.least(3);
      });
    });

    it("should display complete team information", () => {
      cy.contains("Sarah Johnson")
        .parent()
        .within(() => {
          cy.contains("Founder & CEO").should("exist");
          cy.contains("Creative visionary").should("exist");
        });

      cy.contains("Mike Chen")
        .parent()
        .within(() => {
          cy.contains("Head of Production").should("exist");
          cy.contains("Master craftsman").should("exist");
        });

      cy.contains("Emma Davis")
        .parent()
        .within(() => {
          cy.contains("Customer Success").should("exist");
          cy.contains("Dedicated to making").should("exist");
        });
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      cy.get("h1").should("have.length", 1);
      cy.get("h2").should("have.length", 3);
      cy.get("h3").should("have.length.at.least", 7);
    });

    it("should have accessible color contrast", () => {
      cy.get(".text-gray-900").should("be.visible");
      cy.get(".text-gray-600").should("be.visible");
      cy.get(".text-primary").should("be.visible");
    });

    it("should have descriptive text for icons", () => {
      cy.get('[data-testid="award-icon"]').should("exist");
      cy.get('[data-testid="users-icon"]').should("exist");
      cy.get('[data-testid="clock-icon"]').should("exist");
      cy.get('[data-testid="heart-icon"]').should("exist");
    });
  });

  describe("Performance and Loading", () => {
    it("should load all sections within reasonable time", () => {
      const start = Date.now();
      cy.visit("/about").then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000);
      });
    });

    it("should not have console errors", () => {
      cy.window().then((win) => {
        cy.spy(win.console, "error").as("consoleError");
      });
      cy.get("@consoleError").should("not.have.been.called");
    });

    it("should render all icons properly", () => {
      const iconTestIds = [
        "award-icon",
        "users-icon",
        "clock-icon",
        "heart-icon",
        "sarah-icon",
        "mike-icon",
        "emma-icon",
      ];
      cy.get(`[data-testid]`).should(
        "have.length.at.least",
        iconTestIds.length
      );
      iconTestIds.forEach((testId) => {
        cy.get(`[data-testid="${testId}"]`).should("be.visible");
      });
    });
  });

  describe("User Experience", () => {
    it("should have smooth scrolling between sections", () => {
      cy.scrollTo("bottom");
      cy.contains("Meet Our Team").should("be.visible");
      cy.scrollTo("top");
      cy.contains("About Shreephal-Handicrafts").should("be.visible");
    });

    it("should maintain visual hierarchy throughout", () => {
      cy.get("h1").should("have.class", "text-4xl");
      cy.get("h2").should("have.class", "text-3xl");
      cy.get("h3").should("have.class", "text-xl");
    });

    it("should provide comprehensive company information", () => {
      cy.contains("passionate about creating").should("be.visible");
      cy.contains("Founded in 2020").should("be.visible");
      cy.contains("Quality First").should("be.visible");
      cy.contains("Customer Focus").should("be.visible");
      cy.contains("Reliability").should("be.visible");
      cy.contains("Passion").should("be.visible");
    });
  });
});

describe("About Page - Component Integration", () => {
  beforeEach(() => {
    cy.visit("/about");
  });

  it("should integrate properly with Layout component", () => {
    cy.get('[data-testid="layout"]').should("exist");
  });

  it("should properly integrate Lucide icons", () => {
    const expectedIcons = [
      "award-icon",
      "users-icon",
      "clock-icon",
      "heart-icon",
    ];
    expectedIcons.forEach((icon) => {
      cy.get(`[data-testid="${icon}"]`).should("exist");
    });
  });
});
