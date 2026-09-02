import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const clsThresholdRule: RuleDefinition = {
  id: "cls-threshold",
  name: "Cumulative Layout Shift (CLS)",
  category: "performance",
  defaultSeverity: "high",
  description: "Cumulative Layout Shift measures visual stability. A good CLS score is 0.1 or less (Google Core Web Vitals).",
  recommendation: "Always include explicit width and height aspect-ratio attributes on images and video elements, and reserve space for dynamic ads/banners.",
  standards: [
    {
      authority: "Google",
      name: "Core Web Vitals",
      criterion: "CLS <= 0.1",
      url: "https://web.dev/articles/cls",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const cls = context.snapshot.performanceMetrics?.webVitals.cls;

    if (cls !== undefined && cls > 0.1) {
      const isPoor = cls > 0.25;
      findings.push({
        title: `CLS is ${isPoor ? "Poor" : "Needs Improvement"}: ${cls.toFixed(3)} (threshold: <= 0.100)`,
        description: `Elements unexpectedly shifted layout during render, scoring a cumulative shift of ${cls.toFixed(3)}.`,
        severity: isPoor ? "high" : "medium",
        evidence: [
          { property: "cls", actual: cls.toFixed(3), expected: "<= 0.100" },
        ],
        recommendation: "Specify width and height attributes on <img> tags and use CSS contain-intrinsic-size for dynamic feeds.",
        confidence: 0.95,
      });
    }

    return findings;
  },
};
