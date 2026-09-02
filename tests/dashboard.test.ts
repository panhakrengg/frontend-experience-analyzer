import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AnalysisResult } from "@frontend-experience-analyzer/core";

const mockResult: AnalysisResult = {
  target: "http://localhost:4000",
  startedAt: "2026-09-01T20:00:00.000Z",
  completedAt: "2026-09-01T20:01:00.000Z",
  pages: [
    {
      url: "http://localhost:4000",
      title: "Home",
      viewport: { name: "desktop", width: 1440, height: 900 },
      elements: [],
      metrics: { elementCount: 20, interactiveElementCount: 5, documentHeight: 900 },
    },
  ],
  findings: [
    {
      id: "a11y-img-alt-1",
      ruleId: "image-alt",
      category: "accessibility",
      severity: "high",
      title: "Image missing alt attribute",
      description: "Found img tag with missing alt attribute",
      confidence: 1,
      pageUrl: "http://localhost:4000",
      wcag: ["1.1.1"],
      element: { selector: "img#hero", tagName: "img", visible: true, interactive: false },
    },
    {
      id: "resp-clipped-1",
      ruleId: "clipped-text",
      category: "responsive",
      severity: "medium",
      title: "Text clipped",
      description: "Text is vertically cut off",
      confidence: 0.9,
      pageUrl: "http://localhost:4000",
      element: { selector: "div.card", tagName: "div", visible: true, interactive: false },
    },
  ],
};

describe("Phase 7 Dashboard Data & Serialization", () => {
  it("filters findings correctly by severity and category", () => {
    const highFindings = mockResult.findings.filter((f) => f.severity === "high");
    assert.equal(highFindings.length, 1);
    assert.equal(highFindings[0]?.ruleId, "image-alt");

    const respFindings = mockResult.findings.filter((f) => f.category === "responsive");
    assert.equal(respFindings.length, 1);
    assert.equal(respFindings[0]?.ruleId, "clipped-text");
  });

  it("formats findings for CSV export", () => {
    const headers = ["ID", "Rule", "Category", "Severity", "Page", "Title", "Selector", "Confidence"];
    const rows = mockResult.findings.map((f) => [
      `"${f.id}"`,
      `"${f.ruleId ?? ""}"`,
      `"${f.category}"`,
      `"${f.severity}"`,
      `"${f.pageUrl ?? ""}"`,
      `"${f.title.replace(/"/g, '""')}"`,
      `"${f.element?.selector?.replace(/"/g, '""') ?? ""}"`,
      `"${Math.round(f.confidence * 100)}%"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    assert.ok(csvContent.includes('"image-alt"'));
    assert.ok(csvContent.includes('"clipped-text"'));
    assert.ok(csvContent.includes("100%"));
  });
});
