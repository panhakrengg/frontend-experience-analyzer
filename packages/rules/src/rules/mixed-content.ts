import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const mixedContentRule: RuleDefinition = {
  id: "mixed-content",
  name: "Mixed Content Insecure Asset",
  category: "security",
  defaultSeverity: "critical",
  description: "HTTPS page loads passive or active assets over unencrypted HTTP, allowing man-in-the-middle attackers to tamper with or spy on data.",
  recommendation: "Update all asset URLs to use https:// or relative paths.",
  standards: [
    {
      authority: "W3C",
      name: "Mixed Content",
      criterion: "Upgrade Insecure Requests",
      url: "https://www.w3.org/TR/mixed-content/",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const isHttps = context.snapshot.url.startsWith("https://") || Boolean(context.snapshot.securityMetrics?.isHttps);

    if (!isHttps) return findings;

    for (const el of context.snapshot.elements) {
      const src = el.attributes?.src;
      const href = el.attributes?.href;

      if (src && src.startsWith("http://")) {
        findings.push({
          title: `Insecure HTTP resource loaded on HTTPS page (${el.tagName})`,
          description: `Resource "${src}" is requested over unencrypted HTTP, violating mixed-content security.`,
          element: el,
          evidence: [
            { property: "pageProtocol", actual: "https:" },
            { property: "resourceSrc", actual: src, expected: "https://" },
          ],
          recommendation: "Change resource URL to HTTPS or host locally.",
          confidence: 1,
        });
      }
    }

    return findings;
  },
};
