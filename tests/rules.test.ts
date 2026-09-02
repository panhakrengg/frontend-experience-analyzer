import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  accessibleNameRule,
  formLabelRule,
  imageAltRule,
  pageTitleRule,
  targetSizeRule,
  viewportOverflowRule,
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

describe("Rules", () => {
  describe("pageTitleRule", () => {
    it("flags empty title", () => {
      const snapshot = createSnapshot({ title: "   " });
      const findings = pageTitleRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Page is missing a title");
    });

    it("passes non-empty title", () => {
      const snapshot = createSnapshot({ title: "My Awesome Page" });
      const findings = pageTitleRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("imageAltRule", () => {
    it("flags img without alt attribute", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "img",
            attributes: { src: "hero.png" },
          }),
        ],
      });
      const findings = imageAltRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Image is missing alt text");
    });

    it("passes img with alt attribute (including decorative alt='')", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "img",
            attributes: { src: "hero.png", alt: "" },
          }),
          createElement({
            tagName: "img",
            attributes: { src: "logo.png", alt: "Logo" },
          }),
        ],
      });
      const findings = imageAltRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("formLabelRule", () => {
    it("flags form input without accessible name", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "input",
            attributes: { type: "text" },
          }),
        ],
      });
      const findings = formLabelRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Form control is missing a label");
    });

    it("passes form input with accessible name", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "input",
            accessibleName: "Username",
            attributes: { type: "text" },
          }),
        ],
      });
      const findings = formLabelRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("accessibleNameRule", () => {
    it("flags interactive button without name", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "button",
            interactive: true,
            accessibleName: undefined,
            text: undefined,
          }),
        ],
      });
      const findings = accessibleNameRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Interactive control has no accessible name");
    });

    it("passes button with text", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "button",
            interactive: true,
            accessibleName: "Submit",
            text: "Submit",
          }),
        ],
      });
      const findings = accessibleNameRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("targetSizeRule", () => {
    it("flags interactive element smaller than 24x24", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "button",
            interactive: true,
            boundingBox: { x: 10, y: 10, width: 20, height: 20 },
          }),
        ],
      });
      const findings = targetSizeRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Interactive target is too small");
    });

    it("passes interactive element at least 24x24", () => {
      const snapshot = createSnapshot({
        elements: [
          createElement({
            tagName: "button",
            interactive: true,
            boundingBox: { x: 10, y: 10, width: 32, height: 32 },
          }),
        ],
      });
      const findings = targetSizeRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("viewportOverflowRule", () => {
    it("flags element extending past viewport width", () => {
      const snapshot = createSnapshot({
        viewport: { name: "mobile", width: 375, height: 812 },
        elements: [
          createElement({
            tagName: "div",
            boundingBox: { x: 0, y: 100, width: 500, height: 200 },
          }),
        ],
      });
      const findings = viewportOverflowRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.equal(findings[0].title, "Visible element overflows the viewport");
    });

    it("passes element within viewport width", () => {
      const snapshot = createSnapshot({
        viewport: { name: "mobile", width: 375, height: 812 },
        elements: [
          createElement({
            tagName: "div",
            boundingBox: { x: 0, y: 100, width: 350, height: 200 },
          }),
        ],
      });
      const findings = viewportOverflowRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });
});
