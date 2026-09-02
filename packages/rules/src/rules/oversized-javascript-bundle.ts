import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const oversizedJavascriptBundleRule: RuleDefinition = {
  id: "oversized-js-bundle",
  name: "Oversized JavaScript Payload",
  category: "performance",
  defaultSeverity: "high",
  description: "Initial JavaScript payload exceeds performance budget (500KB threshold), leading to high CPU parse/compile overhead on mobile devices.",
  recommendation: "Use dynamic imports (React.lazy / dynamic import), split vendor bundles, and remove unused libraries (lodash, moment).",
  standards: [
    {
      authority: "W3C / Chrome",
      name: "Performance Budgets",
      criterion: "Initial JS < 500KB",
      url: "https://web.dev/articles/reduce-javascript-payloads-with-code-splitting",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const jsBytes = context.snapshot.performanceMetrics?.resourceBreakdown.jsBytes;

    if (jsBytes !== undefined && jsBytes > 500_000) {
      const isCritical = jsBytes > 1_000_000;
      const kb = Math.round(jsBytes / 1024);
      findings.push({
        title: `JavaScript payload exceeds budget: ${kb}KB (threshold: <= 500KB)`,
        description: `Page requested ${kb}KB of JavaScript code on initial load, delaying main thread interactivity.`,
        severity: isCritical ? "high" : "medium",
        evidence: [
          { property: "jsBytes", actual: `${kb}KB`, expected: "<= 500KB" },
        ],
        recommendation: "Split large routes with code-splitting, tree-shake dependencies, and analyze bundles with source-map-explorer.",
        confidence: 1,
      });
    }

    return findings;
  },
};
