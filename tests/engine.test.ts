import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PageSnapshot } from "@frontend-experience-analyzer/core";
import { RulesEngine } from "@frontend-experience-analyzer/rules-engine";
import { generateFindingId } from "@frontend-experience-analyzer/rules-engine";

function createSnapshot(overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    url: "http://localhost:4000/login",
    title: "",
    lang: "en",
    viewport: { name: "desktop", width: 1440, height: 900 },
    elements: [
      {
        selector: "img.hero",
        tagName: "img",
        visible: true,
        interactive: false,
        attributes: { src: "logo.png" },
      },
    ],
    metrics: {
      elementCount: 1,
      interactiveElementCount: 0,
      documentHeight: 900,
    },
    ...overrides,
  };
}

describe("RulesEngine", () => {
  it("runs all default rules", async () => {
    const engine = new RulesEngine();
    const snapshot = createSnapshot();
    const findings = await engine.run(snapshot);

    // Missing title + missing image alt
    assert.equal(findings.length, 2);
    const ruleIds = findings.map((f) => f.ruleId);
    assert.ok(ruleIds.includes("page-title"));
    assert.ok(ruleIds.includes("image-alt"));
  });

  it("filters rules with includeRules", async () => {
    const engine = new RulesEngine({ includeRules: ["page-title"] });
    const snapshot = createSnapshot();
    const findings = await engine.run(snapshot);

    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.ruleId, "page-title");
  });

  it("filters rules with excludeRules", async () => {
    const engine = new RulesEngine({ excludeRules: ["page-title"] });
    const snapshot = createSnapshot();
    const findings = await engine.run(snapshot);

    assert.equal(findings.length, 1);
    assert.equal(findings[0]?.ruleId, "image-alt");
  });

  it("filters rules with includeCategories", async () => {
    const engine = new RulesEngine({ includeCategories: ["responsive"] });
    const snapshot = createSnapshot();
    const findings = await engine.run(snapshot);

    assert.equal(findings.length, 0);
  });

  it("generates deterministic and stable finding IDs", () => {
    const id1 = generateFindingId("target-size", "responsive", "http://localhost:4000/login", {
      selector: "button.submit",
      tagName: "button",
      visible: true,
      interactive: true,
    });
    const id2 = generateFindingId("target-size", "responsive", "http://localhost:4000/login", {
      selector: "button.submit",
      tagName: "button",
      visible: true,
      interactive: true,
    });

    assert.equal(id1, id2);
    assert.ok(id1.startsWith("responsive-target-size-localhost_4000_login-"));
  });
});
