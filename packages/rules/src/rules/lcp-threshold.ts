import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const lcpThresholdRule: RuleDefinition = {
  id: "lcp-threshold",
  name: "Largest Contentful Paint (LCP)",
  category: "performance",
  defaultSeverity: "high",
  description: "Largest Contentful Paint measures perceived loading speed. LCP should occur within 2.5 seconds of when the page first starts loading (Google Core Web Vitals).",
  recommendation: "Optimize server response time (TTFB), preload critical hero images (<link rel='preload'>), and eliminate render-blocking CSS/JS.",
  standards: [
    {
      authority: "Google",
      name: "Core Web Vitals",
      criterion: "LCP <= 2.5s",
      url: "https://web.dev/articles/lcp",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const lcp = context.snapshot.performanceMetrics?.webVitals.lcp;

    if (lcp !== undefined && lcp > 2500) {
      const isPoor = lcp > 4000;
      findings.push({
        title: `LCP is ${isPoor ? "Poor" : "Needs Improvement"}: ${(lcp / 1000).toFixed(2)}s (threshold: <= 2.5s)`,
        description: `The largest visual element took ${(lcp / 1000).toFixed(2)}s to finish rendering, exceeding the 2.5s Core Web Vitals threshold.`,
        severity: isPoor ? "high" : "medium",
        evidence: [
          { property: "lcp", actual: `${lcp}ms`, expected: "<= 2500ms" },
        ],
        recommendation: "Preload critical hero images, enable HTTP/2 or HTTP/3, and compress images with modern formats (AVIF/WebP).",
        confidence: 0.95,
      });
    }

    return findings;
  },
};
