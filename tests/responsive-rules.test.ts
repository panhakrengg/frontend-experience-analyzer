import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  clippedTextRule,
  fixedWidthLayoutRule,
  modalLargerThanViewportRule,
  stickyHeaderOverlapRule,
  tableResponsiveRule,
  touchTargetSpacingRule,
} from "@frontend-experience-analyzer/rules";

const mobileViewport: Viewport = { name: "mobile", width: 375, height: 812 };
const desktopViewport: Viewport = { name: "desktop", width: 1440, height: 900 };

function createSnapshot(viewport: Viewport, elements: ElementReference[]): PageSnapshot {
  return {
    url: "http://localhost:4000",
    title: "Responsive Test Page",
    lang: "en",
    viewport,
    elements,
    metrics: {
      elementCount: elements.length,
      interactiveElementCount: elements.filter((e) => e.interactive).length,
      documentHeight: viewport.height,
    },
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

describe("Phase 4 Responsive & Visual Rules", () => {
  describe("clippedTextRule", () => {
    it("flags text element with overflow:hidden where scrollHeight exceeds clientHeight", () => {
      const snapshot = createSnapshot(desktopViewport, [
        createElement({
          tagName: "p",
          text: "Very long paragraph text that gets clipped...",
          overflow: "hidden",
          clientHeight: 40,
          scrollHeight: 90,
        }),
      ]);
      const findings = clippedTextRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Text content is vertically clipped"));
    });

    it("passes text element when height is sufficient", () => {
      const snapshot = createSnapshot(desktopViewport, [
        createElement({
          tagName: "p",
          text: "Normal text",
          overflow: "hidden",
          clientHeight: 40,
          scrollHeight: 40,
        }),
      ]);
      const findings = clippedTextRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("fixedWidthLayoutRule", () => {
    it("flags fixed width larger than mobile viewport on mobile", () => {
      const snapshot = createSnapshot(mobileViewport, [
        createElement({
          selector: ".card-container",
          attributes: { style: "width: 800px;" },
          boundingBox: { x: 0, y: 50, width: 800, height: 300 },
        }),
      ]);
      const findings = fixedWidthLayoutRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Fixed-width container exceeds mobile viewport"));
    });

    it("does not flag on desktop viewport", () => {
      const snapshot = createSnapshot(desktopViewport, [
        createElement({
          selector: ".card-container",
          attributes: { style: "width: 800px;" },
          boundingBox: { x: 0, y: 50, width: 800, height: 300 },
        }),
      ]);
      const findings = fixedWidthLayoutRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("modalLargerThanViewportRule", () => {
    it("flags modal dialog wider than mobile screen", () => {
      const snapshot = createSnapshot(mobileViewport, [
        createElement({
          tagName: "dialog",
          role: "dialog",
          boundingBox: { x: 0, y: 100, width: 450, height: 300 },
        }),
      ]);
      const findings = modalLargerThanViewportRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Modal dialog dimensions exceed viewport"));
    });

    it("passes modal dialog within viewport bounds", () => {
      const snapshot = createSnapshot(mobileViewport, [
        createElement({
          tagName: "dialog",
          role: "dialog",
          boundingBox: { x: 10, y: 100, width: 340, height: 300 },
        }),
      ]);
      const findings = modalLargerThanViewportRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("tableResponsiveRule", () => {
    it("flags wide data table on mobile without responsive scrolling", () => {
      const snapshot = createSnapshot(mobileViewport, [
        createElement({
          tagName: "table",
          boundingBox: { x: 0, y: 100, width: 600, height: 400 },
          scrollWidth: 600,
        }),
      ]);
      const findings = tableResponsiveRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Data table overflows mobile viewport"));
    });

    it("passes table that fits mobile viewport", () => {
      const snapshot = createSnapshot(mobileViewport, [
        createElement({
          tagName: "table",
          boundingBox: { x: 0, y: 100, width: 350, height: 200 },
          scrollWidth: 350,
        }),
      ]);
      const findings = tableResponsiveRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("touchTargetSpacingRule", () => {
    it("flags small touch targets closer than 8px", () => {
      const snapshot = createSnapshot(mobileViewport, [
        createElement({
          selector: "button.first",
          tagName: "button",
          interactive: true,
          boundingBox: { x: 10, y: 10, width: 20, height: 20 },
        }),
        createElement({
          selector: "button.second",
          tagName: "button",
          interactive: true,
          boundingBox: { x: 34, y: 10, width: 20, height: 20 }, // 4px horizontal gap (10+20=30 to 34)
        }),
      ]);
      const findings = touchTargetSpacingRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Touch targets are too close"));
    });

    it("passes small touch targets with adequate clearance (>= 8px)", () => {
      const snapshot = createSnapshot(mobileViewport, [
        createElement({
          selector: "button.first",
          tagName: "button",
          interactive: true,
          boundingBox: { x: 10, y: 10, width: 20, height: 20 },
        }),
        createElement({
          selector: "button.second",
          tagName: "button",
          interactive: true,
          boundingBox: { x: 42, y: 10, width: 20, height: 20 }, // 12px gap
        }),
      ]);
      const findings = touchTargetSpacingRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("stickyHeaderOverlapRule", () => {
    it("flags interactive element obscured by fixed header", () => {
      const snapshot = createSnapshot(desktopViewport, [
        createElement({
          selector: "header.nav",
          position: "fixed",
          zIndex: 50,
          boundingBox: { x: 0, y: 0, width: 1440, height: 70 },
        }),
        createElement({
          selector: "input#search",
          tagName: "input",
          interactive: true,
          zIndex: 1,
          boundingBox: { x: 50, y: 20, width: 200, height: 30 }, // Under header
        }),
      ]);
      const findings = stickyHeaderOverlapRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Interactive element overlapped by fixed header"));
    });

    it("passes interactive elements positioned below fixed header", () => {
      const snapshot = createSnapshot(desktopViewport, [
        createElement({
          selector: "header.nav",
          position: "fixed",
          zIndex: 50,
          boundingBox: { x: 0, y: 0, width: 1440, height: 70 },
        }),
        createElement({
          selector: "input#search",
          tagName: "input",
          interactive: true,
          zIndex: 1,
          boundingBox: { x: 50, y: 90, width: 200, height: 30 }, // Below header
        }),
      ]);
      const findings = stickyHeaderOverlapRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });
});
