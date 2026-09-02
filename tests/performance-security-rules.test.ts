import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  clsThresholdRule,
  lcpThresholdRule,
  missingCspRule,
  mixedContentRule,
  oversizedJavascriptBundleRule,
  renderBlockingResourcesRule,
  sensitiveInputAutocompleteRule,
  unoptimizedImagesRule,
  vulnerableLinkTargetRule,
} from "@frontend-experience-analyzer/rules";

const desktopViewport: Viewport = { name: "desktop", width: 1440, height: 900 };

function createSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: "https://example.com",
    title: "Performance & Security Test",
    lang: "en",
    viewport: desktopViewport,
    elements: [],
    metrics: { elementCount: 10, interactiveElementCount: 5, documentHeight: 1200 },
    ...overrides,
  };
}

describe("Phase 10 Performance & Security Rules", () => {
  describe("lcpThresholdRule", () => {
    it("flags LCP > 2500ms", () => {
      const snapshot = createSnapshot({
        performanceMetrics: {
          webVitals: { lcp: 3200 },
          resourceBreakdown: { jsBytes: 100, cssBytes: 100, imageBytes: 100, fontBytes: 100, totalBytes: 400, requestCount: 4 },
        },
      });
      const findings = lcpThresholdRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("LCP is Needs Improvement: 3.20s"));
    });

    it("passes LCP <= 2500ms", () => {
      const snapshot = createSnapshot({
        performanceMetrics: {
          webVitals: { lcp: 1400 },
          resourceBreakdown: { jsBytes: 100, cssBytes: 100, imageBytes: 100, fontBytes: 100, totalBytes: 400, requestCount: 4 },
        },
      });
      const findings = lcpThresholdRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("clsThresholdRule", () => {
    it("flags CLS > 0.1", () => {
      const snapshot = createSnapshot({
        performanceMetrics: {
          webVitals: { cls: 0.185 },
          resourceBreakdown: { jsBytes: 100, cssBytes: 100, imageBytes: 100, fontBytes: 100, totalBytes: 400, requestCount: 4 },
        },
      });
      const findings = clsThresholdRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("CLS is Needs Improvement: 0.185"));
    });
  });

  describe("oversizedJavascriptBundleRule", () => {
    it("flags initial JS payload > 500KB", () => {
      const snapshot = createSnapshot({
        performanceMetrics: {
          webVitals: {},
          resourceBreakdown: { jsBytes: 750_000, cssBytes: 20_000, imageBytes: 100_000, fontBytes: 50_000, totalBytes: 920_000, requestCount: 15 },
        },
      });
      const findings = oversizedJavascriptBundleRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("JavaScript payload exceeds budget: 732KB"));
    });
  });

  describe("unoptimizedImagesRule", () => {
    it("flags below-the-fold raster image missing loading='lazy'", () => {
      const snapshot = createSnapshot({
        elements: [
          {
            selector: "img.banner",
            tagName: "img",
            visible: true,
            interactive: false,
            attributes: { src: "/images/hero-banner.png" },
            boundingBox: { x: 0, y: 1500, width: 800, height: 400 },
          },
        ],
      });
      const findings = unoptimizedImagesRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Below-the-fold raster image missing loading='lazy'"));
    });
  });

  describe("renderBlockingResourcesRule", () => {
    it("flags external script tag without defer or async", () => {
      const snapshot = createSnapshot({
        elements: [
          {
            selector: "script.analytics",
            tagName: "script",
            visible: false,
            interactive: false,
            attributes: { src: "https://cdn.example.com/analytics.js" },
          },
        ],
      });
      const findings = renderBlockingResourcesRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Synchronous render-blocking script tag"));
    });
  });

  describe("missingCspRule", () => {
    it("flags page lacking Content-Security-Policy", () => {
      const snapshot = createSnapshot({
        securityMetrics: { hasCsp: false, isHttps: true, mixedContentCount: 0, insecureLinksCount: 0 },
      });
      const findings = missingCspRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Content Security Policy (CSP) is not enforced"));
    });
  });

  describe("vulnerableLinkTargetRule", () => {
    it("flags target='_blank' link missing rel='noopener noreferrer'", () => {
      const snapshot = createSnapshot({
        elements: [
          {
            selector: "a.external",
            tagName: "a",
            visible: true,
            interactive: true,
            attributes: { href: "https://external.com", target: "_blank" },
          },
        ],
      });
      const findings = vulnerableLinkTargetRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("target='_blank' link missing rel='noopener noreferrer'"));
    });
  });

  describe("mixedContentRule", () => {
    it("flags insecure HTTP asset on HTTPS page", () => {
      const snapshot = createSnapshot({
        url: "https://secure.example.com",
        elements: [
          {
            selector: "img.avatar",
            tagName: "img",
            visible: true,
            interactive: false,
            attributes: { src: "http://insecure-cdn.com/avatar.jpg" },
          },
        ],
      });
      const findings = mixedContentRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Insecure HTTP resource loaded on HTTPS page"));
    });
  });

  describe("sensitiveInputAutocompleteRule", () => {
    it("flags password field without explicit autocomplete", () => {
      const snapshot = createSnapshot({
        elements: [
          {
            selector: "input#password",
            tagName: "input",
            visible: true,
            interactive: true,
            attributes: { type: "password", id: "password" },
          },
        ],
      });
      const findings = sensitiveInputAutocompleteRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Password input missing explicit autocomplete attribute"));
    });
  });
});
