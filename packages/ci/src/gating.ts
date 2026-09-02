import type { AnalysisResult, GateOptions, GateResult, RegressionDiff } from "@frontend-experience-analyzer/core";

const SEVERITY_RANKS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export function evaluateGateThresholds(
  analysis: AnalysisResult,
  diff?: RegressionDiff,
  options: GateOptions = {}
): GateResult {
  const violations: string[] = [];

  const criticalCount = analysis.findings.filter((f) => f.severity === "critical").length;
  const highCount = analysis.findings.filter((f) => f.severity === "high").length;

  if (options.failOn) {
    const minRank = SEVERITY_RANKS[options.failOn] ?? 4;
    const failingFindings = analysis.findings.filter(
      (f) => (SEVERITY_RANKS[f.severity] ?? 0) >= minRank
    );
    if (failingFindings.length > 0) {
      violations.push(
        `Found ${failingFindings.length} issue(s) with severity >= "${options.failOn}".`
      );
    }
  }

  if (options.maxCritical !== undefined && criticalCount > options.maxCritical) {
    violations.push(`Critical issue count (${criticalCount}) exceeded limit of ${options.maxCritical}.`);
  }

  if (options.maxHigh !== undefined && highCount > options.maxHigh) {
    violations.push(`High severity issue count (${highCount}) exceeded limit of ${options.maxHigh}.`);
  }

  if (options.failOnRegression && diff && diff.newFindings.length > 0) {
    violations.push(`Detected ${diff.newFindings.length} new regression finding(s) compared to baseline.`);
  }

  const passed = violations.length === 0;
  const summary = passed
    ? `✅ Quality Gate Passed (${analysis.findings.length} total findings, 0 blocker violations).`
    : `❌ Quality Gate Failed with ${violations.length} violation(s):\n${violations.map((v) => ` - ${v}`).join("\n")}`;

  return {
    passed,
    violations,
    summary,
  };
}
