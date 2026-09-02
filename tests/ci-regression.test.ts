import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AnalysisResult, Finding } from "@frontend-experience-analyzer/core";
import {
  compareReports,
  evaluateGateThresholds,
  formatJunitXml,
  formatMarkdownSummary,
  formatSarif,
} from "@frontend-experience-analyzer/ci";

const baseFinding1: Finding = {
  id: "base-1",
  ruleId: "page-title",
  category: "accessibility",
  severity: "high",
  title: "Missing page title",
  description: "Page title element is empty",
  confidence: 1,
  pageUrl: "https://example.com",
  evidence: [],
};

const baseFinding2: Finding = {
  id: "base-2",
  ruleId: "image-alt",
  category: "accessibility",
  severity: "medium",
  title: "Missing image alt",
  description: "Image tag lacks alt attribute",
  confidence: 1,
  pageUrl: "https://example.com",
  evidence: [],
};

const newRegressionFinding: Finding = {
  id: "reg-1",
  ruleId: "missing-csp",
  category: "security",
  severity: "critical",
  title: "Content Security Policy missing",
  description: "No CSP header deployed",
  confidence: 1,
  pageUrl: "https://example.com",
  evidence: [],
};

const baselineReport: AnalysisResult = {
  target: "https://example.com",
  startedAt: "2026-09-01T00:00:00.000Z",
  completedAt: "2026-09-01T00:01:00.000Z",
  pages: [],
  findings: [baseFinding1, baseFinding2],
};

const currentReport: AnalysisResult = {
  target: "https://example.com",
  startedAt: "2026-09-02T00:00:00.000Z",
  completedAt: "2026-09-02T00:01:00.000Z",
  pages: [],
  findings: [baseFinding2, newRegressionFinding], // baseFinding1 was fixed, newRegressionFinding was added
};

describe("Phase 11 CI/CD & Regression Tracking", () => {
  describe("compareReports", () => {
    it("accurately identifies new, resolved, and unchanged findings", () => {
      const diff = compareReports(baselineReport, currentReport);

      assert.equal(diff.newFindings.length, 1);
      assert.equal(diff.newFindings[0]?.ruleId, "missing-csp");

      assert.equal(diff.resolvedFindings.length, 1);
      assert.equal(diff.resolvedFindings[0]?.ruleId, "page-title");

      assert.equal(diff.unchangedFindings.length, 1);
      assert.equal(diff.unchangedFindings[0]?.ruleId, "image-alt");
    });
  });

  describe("evaluateGateThresholds", () => {
    it("fails when critical findings exceed threshold", () => {
      const gate = evaluateGateThresholds(currentReport, undefined, {
        failOn: "critical",
      });
      assert.equal(gate.passed, false);
      assert.ok(gate.violations.some((v) => v.includes('severity >= "critical"')));
    });

    it("passes when issues stay within tolerances", () => {
      const cleanReport: AnalysisResult = {
        ...currentReport,
        findings: [baseFinding2], // only medium
      };
      const gate = evaluateGateThresholds(cleanReport, undefined, {
        maxCritical: 0,
        failOn: "critical",
      });
      assert.equal(gate.passed, true);
    });

    it("fails quality gate on new regression", () => {
      const diff = compareReports(baselineReport, currentReport);
      const gate = evaluateGateThresholds(currentReport, diff, {
        failOnRegression: true,
      });
      assert.equal(gate.passed, false);
      assert.ok(gate.violations.some((v) => v.includes("regression finding(s)")));
    });
  });

  describe("Formatters", () => {
    it("generates markdown summary for PR comments", () => {
      const diff = compareReports(baselineReport, currentReport);
      const md = formatMarkdownSummary(currentReport, diff);

      assert.ok(md.includes("## 🔍 Frontend Experience Analyzer Report"));
      assert.ok(md.includes("🚨 Critical"));
      assert.ok(md.includes("New Issues (Regressions)"));
    });

    it("generates valid JUnit XML", () => {
      const xml = formatJunitXml(currentReport);
      assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
      assert.ok(xml.includes("<testsuites"));
      assert.ok(xml.includes("<testcase"));
      assert.ok(xml.includes("<failure"));
    });

    it("generates valid SARIF v2.1.0 output", () => {
      const sarifRaw = formatSarif(currentReport);
      const sarif = JSON.parse(sarifRaw);
      assert.equal(sarif.version, "2.1.0");
      assert.equal(sarif.runs.length, 1);
      assert.ok(sarif.runs[0].results.length >= 2);
    });
  });
});
