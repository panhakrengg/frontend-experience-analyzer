import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AnalysisResult, Finding } from "@frontend-experience-analyzer/core";
import { AIAdvisor, MockHeuristicProvider } from "@frontend-experience-analyzer/ai-advisor";

const sampleFindings: Finding[] = [
  {
    id: "a11y-img-alt-1",
    ruleId: "image-alt",
    category: "accessibility",
    severity: "high",
    title: "Image missing alt attribute",
    description: "Found img tag with missing alt attribute",
    confidence: 1,
    pageUrl: "http://localhost:4000",
  },
  {
    id: "resp-target-1",
    ruleId: "target-size",
    category: "responsive",
    severity: "medium",
    title: "Small tap target",
    description: "Button is smaller than 24x24",
    confidence: 0.9,
    pageUrl: "http://localhost:4000",
  },
  {
    id: "inter-modal-1",
    ruleId: "modal-escape-close",
    category: "interaction",
    severity: "critical",
    title: "Modal cannot be closed with Escape key",
    description: "Modal remained open after pressing Escape",
    confidence: 0.95,
    pageUrl: "http://localhost:4000",
  },
];

const mockAnalysis: AnalysisResult = {
  target: "http://localhost:4000",
  startedAt: "2026-09-01T20:00:00.000Z",
  completedAt: "2026-09-01T20:01:00.000Z",
  pages: [
    {
      url: "http://localhost:4000",
      title: "Test App",
      viewport: { name: "desktop", width: 1440, height: 900 },
      elements: [],
      metrics: { elementCount: 30, interactiveElementCount: 10, documentHeight: 900 },
    },
  ],
  findings: sampleFindings,
};

describe("Phase 8 AI UX Advisor", () => {
  it("evaluates findings and generates structured UX recommendations and maturity score", async () => {
    const advisor = new AIAdvisor({ provider: "mock" });
    const report = await advisor.advise(mockAnalysis);

    assert.ok(report.uxMaturityScore >= 0 && report.uxMaturityScore <= 100);
    assert.ok(report.executiveSummary.includes("UX Maturity Rating"));
    assert.ok(report.topQuickWins.length > 0);
    assert.equal(report.recommendations.length, 3);
  });

  it("synthesizes code fix before/after patches for top quick wins", async () => {
    const provider = new MockHeuristicProvider();
    const report = await provider.generateReport(mockAnalysis);

    const imgAltRec = report.recommendations.find((r) => r.category === "accessibility");
    assert.ok(imgAltRec);
    assert.ok(imgAltRec?.suggestedFix);
    assert.ok(imgAltRec?.suggestedFix?.beforeCode.includes("<img"));
    assert.ok(imgAltRec?.suggestedFix?.afterCode.includes('alt="'));

    const modalRec = report.recommendations.find((r) => r.category === "interaction");
    assert.ok(modalRec);
    assert.ok(modalRec?.suggestedFix?.afterCode.includes("Escape"));
  });

  it("handles empty findings gracefully with baseline hygiene recommendation", async () => {
    const cleanAnalysis: AnalysisResult = {
      ...mockAnalysis,
      findings: [],
    };
    const advisor = new AIAdvisor({ provider: "mock" });
    const report = await advisor.advise(cleanAnalysis);

    assert.equal(report.uxMaturityScore, 100);
    assert.equal(report.recommendations.length, 1);
    assert.ok(report.recommendations[0]?.title.includes("Maintain Clean Frontend Hygiene"));
  });
});
