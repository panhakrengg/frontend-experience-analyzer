import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AnalysisResult } from "@frontend-experience-analyzer/core";
import { generateHtmlReport, generateJsonReport } from "@frontend-experience-analyzer/reporter";

const mockResult: AnalysisResult = {
  target: "http://localhost:4000",
  startedAt: "2026-09-01T00:00:00.000Z",
  completedAt: "2026-09-01T00:00:05.000Z",
  pages: [
    {
      url: "http://localhost:4000",
      title: "Home",
      viewport: { name: "desktop", width: 1440, height: 900 },
      elements: [],
      metrics: {
        elementCount: 10,
        interactiveElementCount: 2,
        documentHeight: 900,
      },
    },
  ],
  findings: [
    {
      id: "accessibility-page_title-home",
      ruleId: "page-title",
      pageUrl: "http://localhost:4000",
      category: "accessibility",
      severity: "medium",
      title: "Page is missing a title",
      description: "Document has no title.",
      evidence: [{ property: "title", actual: "", expected: "Non-empty title" }],
      recommendation: "Add a title.",
      wcag: ["2.4.2"],
      confidence: 1,
    },
  ],
};

describe("Reporter", () => {
  it("generates valid JSON report", () => {
    const json = generateJsonReport(mockResult);
    const parsed = JSON.parse(json);
    assert.equal(parsed.target, "http://localhost:4000");
    assert.equal(parsed.findings.length, 1);
    assert.equal(parsed.findings[0].ruleId, "page-title");
  });

  it("generates HTML report containing findings and WCAG tags", () => {
    const html = generateHtmlReport(mockResult);
    assert.ok(html.includes("<!doctype html>"));
    assert.ok(html.includes("Frontend Experience Analyzer Report"));
    assert.ok(html.includes("Page is missing a title"));
    assert.ok(html.includes("WCAG 2.4.2"));
    assert.ok(html.includes("accessibility-page_title-home") || html.includes("finding-1"));
  });
});
