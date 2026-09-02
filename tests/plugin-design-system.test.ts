import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  createDeprecatedComponentClassRule,
  createDesignTokenColorRule,
  createDesignTokenFontRule,
  forbiddenInlineStylesRule,
  loadConfig,
  loadPlugins,
} from "@frontend-experience-analyzer/plugin-system";

const desktopViewport: Viewport = { name: "desktop", width: 1440, height: 900 };

function createSnapshot(elements: ElementReference[] = []): PageSnapshot {
  return {
    url: "https://acme.internal",
    title: "Design System Test",
    lang: "en",
    viewport: desktopViewport,
    elements,
    metrics: { elementCount: elements.length, interactiveElementCount: elements.filter((e) => e.interactive).length, documentHeight: 900 },
  };
}

describe("Phase 12 Custom Company Rules & Plugin System", () => {
  describe("Config & Plugin Loading", () => {
    it("loads fea.config.json and builds design system + plugin rules", async () => {
      const resolved = await loadConfig("examples/fea.config.json");
      assert.ok(resolved !== undefined);
      assert.equal(resolved?.config.failOn, "critical");
      assert.ok(resolved?.customRules.length >= 4);

      const ruleIds = resolved?.customRules.map((r) => r.id);
      assert.ok(ruleIds?.includes("design-token-color"));
      assert.ok(ruleIds?.includes("design-token-font"));
      assert.ok(ruleIds?.includes("forbidden-inline-styles"));
      assert.ok(ruleIds?.includes("deprecated-component-class"));
      assert.ok(ruleIds?.includes("brand-button-required"));
    });

    it("loads external JS plugin module dynamically", async () => {
      const rules = await loadPlugins(["examples/custom-plugin.js"]);
      assert.equal(rules.length, 1);
      assert.equal(rules[0]?.id, "brand-button-required");
    });
  });

  describe("Design System Rules", () => {
    it("designTokenColorRule flags unapproved hardcoded color", () => {
      const rule = createDesignTokenColorRule(["#ffffff", "#000000", "#3b82f6"]);
      const snapshot = createSnapshot([
        {
          selector: "div.custom",
          tagName: "div",
          visible: true,
          interactive: false,
          attributes: { style: "background-color: #ff00ea; color: #ffffff;" },
        },
      ]);
      const findings = rule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("#ff00ea"));
    });

    it("designTokenFontRule flags unapproved font family", () => {
      const rule = createDesignTokenFontRule(["Inter", "system-ui"]);
      const snapshot = createSnapshot([
        {
          selector: "h1",
          tagName: "h1",
          visible: true,
          interactive: false,
          attributes: { style: "font-family: 'Comic Sans MS', sans-serif;" },
        },
      ]);
      const findings = rule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Comic Sans MS"));
    });

    it("forbiddenInlineStylesRule flags raw style attribute", () => {
      const snapshot = createSnapshot([
        {
          selector: "button.cta",
          tagName: "button",
          visible: true,
          interactive: true,
          attributes: { style: "margin-top: 20px;" },
        },
      ]);
      const findings = forbiddenInlineStylesRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Inline style attribute detected"));
    });

    it("deprecatedComponentClassRule flags deprecated classes", () => {
      const rule = createDeprecatedComponentClassRule(["btn-legacy", "old-card"]);
      const snapshot = createSnapshot([
        {
          selector: "button.btn-legacy",
          tagName: "button",
          visible: true,
          interactive: true,
          attributes: { class: "btn-legacy btn-primary" },
        },
      ]);
      const findings = rule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes(".btn-legacy"));
    });
  });
});
