import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  duplicateIdRule,
  emptyLinkRule,
  fieldErrorAssociationRule,
  focusIndicatorRule,
  headingHierarchyRule,
  htmlLangRule,
  iconOnlyButtonNameRule,
  modalDialogSemanticsRule,
  nonButtonKeyboardRule,
} from "@frontend-experience-analyzer/rules";

const mockViewport: Viewport = { name: "desktop", width: 1440, height: 900 };

function createSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: "http://localhost:4000",
    title: "Example Page",
    viewport: mockViewport,
    elements: [],
    metrics: {
      elementCount: 0,
      interactiveElementCount: 0,
      documentHeight: 900,
    },
    ...overrides,
  };
}

function createElement(overrides: Partial<ElementReference> = {}): ElementReference {
  return {
    selector: "div",
    tagName: "div",
    visible: true,
    interactive: false,
    ...overrides,
  };
}

describe("Phase 3 Accessibility Rules", () => {
  describe("htmlLangRule", () => {
    it("flags missing or empty lang attribute", () => {
      const snapshot = createSnapshot({ lang: undefined });
      const findings = htmlLangRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Page is missing html lang attribute");
    });

    it("passes valid lang attribute", () => {
      const snapshot = createSnapshot({ lang: "en" });
      const findings = htmlLangRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("headingHierarchyRule", () => {
    it("flags page missing an <h1> heading", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "h2", text: "Subheading" }),
        ],
      });
      const findings = headingHierarchyRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("missing a top-level <h1>"));
    });

    it("flags skipped heading level (h1 to h3)", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "h1", text: "Main Title" }),
          createElement({ tagName: "h3", text: "Deep Section" }),
        ],
      });
      const findings = headingHierarchyRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Heading level skipped"));
    });

    it("passes correct heading hierarchy (h1 -> h2 -> h3)", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "h1", text: "Main Title" }),
          createElement({ tagName: "h2", text: "Section 1" }),
          createElement({ tagName: "h3", text: "Subsection 1.1" }),
        ],
      });
      const findings = headingHierarchyRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("duplicateIdRule", () => {
    it("flags duplicate IDs on the page", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ id: "user-name", tagName: "input" }),
          createElement({ id: "user-name", tagName: "div" }),
        ],
      });
      const findings = duplicateIdRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Duplicate id attribute: #user-name"));
    });

    it("passes unique IDs", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ id: "user-name", tagName: "input" }),
          createElement({ id: "user-email", tagName: "input" }),
        ],
      });
      const findings = duplicateIdRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("emptyLinkRule", () => {
    it("flags empty link without text or aria-label", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "a", attributes: { href: "/about" }, text: "" }),
        ],
      });
      const findings = emptyLinkRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Link has no discernible text or accessible name");
    });

    it("passes link with text or aria-label", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "a", attributes: { href: "/about" }, text: "About Us", accessibleName: "About Us" }),
          createElement({ tagName: "a", attributes: { href: "/home", "aria-label": "Home" }, accessibleName: "Home" }),
        ],
      });
      const findings = emptyLinkRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("iconOnlyButtonNameRule", () => {
    it("flags icon button without accessible name", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "button", interactive: true }),
        ],
      });
      const findings = iconOnlyButtonNameRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Button is missing an accessible name");
    });

    it("passes button with aria-label or text", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "button", interactive: true, accessibleName: "Close", attributes: { "aria-label": "Close" } }),
        ],
      });
      const findings = iconOnlyButtonNameRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("nonButtonKeyboardRule", () => {
    it("flags custom role=button without tabindex", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "div", role: "button", text: "Click me" }),
        ],
      });
      const findings = nonButtonKeyboardRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("is not keyboard focusable"));
    });

    it("passes custom role=button with tabindex=0", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "div", role: "button", text: "Click me", attributes: { tabindex: "0" } }),
        ],
      });
      const findings = nonButtonKeyboardRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("modalDialogSemanticsRule", () => {
    it("flags custom modal missing role=dialog", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({ tagName: "div", attributes: { "aria-modal": "true" } }),
        ],
      });
      const findings = modalDialogSemanticsRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 2); // missing role=dialog + missing accessible name
      assert.ok(findings.some((f) => f.title.includes("missing role=\"dialog\"")));
    });

    it("passes modal with dialog role and accessible name", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "dialog",
            role: "dialog",
            accessibleName: "Settings Dialog",
            attributes: { "aria-modal": "true", "aria-labelledby": "dialog-title" },
          }),
        ],
      });
      const findings = modalDialogSemanticsRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("fieldErrorAssociationRule", () => {
    it("flags invalid input missing aria-describedby", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "input",
            attributes: { type: "text", "aria-invalid": "true" },
          }),
        ],
      });
      const findings = fieldErrorAssociationRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Invalid form field missing error message association");
    });

    it("passes invalid input with aria-describedby", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "input",
            attributes: { type: "text", "aria-invalid": "true", "aria-describedby": "email-error" },
          }),
        ],
      });
      const findings = fieldErrorAssociationRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("focusIndicatorRule", () => {
    it("flags element with inline outline: none", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "button",
            interactive: true,
            attributes: { style: "outline: none; background: blue;" },
          }),
        ],
      });
      const findings = focusIndicatorRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Focus outline explicitly disabled via inline style");
    });

    it("passes element without outline suppression", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "button",
            interactive: true,
            attributes: { style: "background: blue;" },
          }),
        ],
      });
      const findings = focusIndicatorRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });
});
