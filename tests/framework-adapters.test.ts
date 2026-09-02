import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  detectFramework,
  nextImageSizesRule,
  reactHydrationMismatchRule,
  SourceMapper,
} from "@frontend-experience-analyzer/framework-adapters";

const desktopViewport: Viewport = { name: "desktop", width: 1440, height: 900 };

function createSnapshot(elements: ElementReference[] = [], consoleErrors: any[] = []): PageSnapshot {
  return {
    url: "http://localhost:3000",
    title: "Framework Adapter Test",
    lang: "en",
    viewport: desktopViewport,
    elements,
    interactionTrace: {
      consoleErrors,
      networkFailures: [],
      interactions: [],
    },
    metrics: {
      elementCount: elements.length,
      interactiveElementCount: elements.filter((e) => e.interactive).length,
      documentHeight: 900,
    },
  };
}

describe("Phase 9 Framework Adapters", () => {
  describe("detectFramework", () => {
    it("detects Next.js from runtime snapshot DOM indicators", async () => {
      const snapshot = createSnapshot([
        {
          selector: "script#__NEXT_DATA__",
          tagName: "script",
          visible: false,
          interactive: false,
          htmlSnippet: '<script id="__NEXT_DATA__">{}</script>',
        },
      ]);
      const res = await detectFramework(snapshot);
      assert.equal(res.framework, "nextjs");
    });

    it("detects Nuxt / Vue from scoped attributes", async () => {
      const snapshot = createSnapshot([
        {
          selector: "div.app",
          tagName: "div",
          visible: true,
          interactive: false,
          attributes: { "data-v-12345": "" },
          htmlSnippet: '<div data-v-12345 class="app"></div>',
        },
      ]);
      const res = await detectFramework(snapshot);
      assert.equal(res.framework, "nuxt");
    });

    it("defaults to vanilla when no framework is detected", async () => {
      const snapshot = createSnapshot([
        { selector: "main", tagName: "main", visible: true, interactive: false },
      ]);
      const res = await detectFramework(snapshot);
      assert.equal(res.framework, "vanilla");
    });
  });

  describe("SourceMapper", () => {
    it("maps finding selector to source file location", async () => {
      const mapper = new SourceMapper("packages/reporter/src");
      await mapper.index();

      const finding: any = {
        id: "finding-1",
        title: "Test finding",
        category: "accessibility",
        severity: "medium",
        confidence: 1,
        element: {
          selector: "generateHtmlReport",
          tagName: "div",
          visible: true,
          interactive: false,
          text: "generateHtmlReport",
        },
      };

      const loc = mapper.mapFinding(finding);
      assert.ok(loc !== undefined);
      assert.ok(loc?.file.includes("html.ts") || loc?.file.includes("reporter"));
      assert.ok(typeof loc?.line === "number");
    });
  });

  describe("Framework Rules", () => {
    it("nextImageSizesRule flags Next.js fill image without sizes", () => {
      const snapshot = createSnapshot([
        {
          selector: "img.hero",
          tagName: "img",
          visible: true,
          interactive: false,
          attributes: {
            "data-nimg": "fill",
            style: "position: absolute; height: 100%; width: 100%;",
          },
        },
      ]);
      const findings = nextImageSizesRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Next.js <Image fill> missing responsive 'sizes'"));
    });

    it("reactHydrationMismatchRule flags SSR hydration errors in console trace", () => {
      const snapshot = createSnapshot([], [
        {
          type: "error",
          text: "Warning: Text content did not match. Server: 'Hello' Client: 'World'",
          location: "react-dom.development.js:1240",
        },
      ]);
      const findings = reactHydrationMismatchRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("React SSR hydration mismatch"));
    });
  });
});
