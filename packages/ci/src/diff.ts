import type { AnalysisResult, Finding, RegressionDiff, WebVitalsDelta } from "@frontend-experience-analyzer/core";

function findingSignature(finding: Finding): string {
  const rule = finding.ruleId ?? "custom";
  const url = finding.pageUrl ?? "";
  const selector = finding.element?.selector ?? "";
  return `${rule}::${url}::${selector}::${finding.title}`;
}

export function compareReports(baseline: AnalysisResult, current: AnalysisResult): RegressionDiff {
  const baselineMap = new Map<string, Finding>();
  for (const f of baseline.findings) {
    baselineMap.set(findingSignature(f), f);
  }

  const currentMap = new Map<string, Finding>();
  for (const f of current.findings) {
    currentMap.set(findingSignature(f), f);
  }

  const newFindings: Finding[] = [];
  const unchangedFindings: Finding[] = [];
  const resolvedFindings: Finding[] = [];

  for (const [sig, finding] of currentMap.entries()) {
    if (baselineMap.has(sig)) {
      unchangedFindings.push(finding);
    } else {
      newFindings.push(finding);
    }
  }

  for (const [sig, finding] of baselineMap.entries()) {
    if (!currentMap.has(sig)) {
      resolvedFindings.push(finding);
    }
  }

  // Calculate score deltas
  const baselineJourneys = baseline.journeys ?? [];
  const currentJourneys = current.journeys ?? [];
  const baselineAvgScore = baselineJourneys.length
    ? baselineJourneys.reduce((acc, j) => acc + j.frictionScore, 0) / baselineJourneys.length
    : 100 - baseline.findings.length * 5;
  const currentAvgScore = currentJourneys.length
    ? currentJourneys.reduce((acc, j) => acc + j.frictionScore, 0) / currentJourneys.length
    : 100 - current.findings.length * 5;

  const scoreDelta = Math.round(currentAvgScore - baselineAvgScore);

  // Calculate Web Vitals & weight deltas
  let vitalsDelta: WebVitalsDelta | undefined;
  const bPage = baseline.pages[0];
  const cPage = current.pages[0];

  if (bPage?.performanceMetrics && cPage?.performanceMetrics) {
    const bPerf = bPage.performanceMetrics;
    const cPerf = cPage.performanceMetrics;
    vitalsDelta = {
      lcpDelta: (cPerf.webVitals.lcp ?? 0) - (bPerf.webVitals.lcp ?? 0),
      clsDelta: Number(((cPerf.webVitals.cls ?? 0) - (bPerf.webVitals.cls ?? 0)).toFixed(3)),
      fcpDelta: (cPerf.webVitals.fcp ?? 0) - (bPerf.webVitals.fcp ?? 0),
      ttfbDelta: (cPerf.webVitals.ttfb ?? 0) - (bPerf.webVitals.ttfb ?? 0),
      weightDelta: cPerf.resourceBreakdown.totalBytes - bPerf.resourceBreakdown.totalBytes,
    };
  }

  return {
    baselineTarget: baseline.target,
    currentTarget: current.target,
    comparedAt: new Date().toISOString(),
    newFindings,
    resolvedFindings,
    unchangedFindings,
    scoreDelta,
    vitalsDelta,
  };
}
