import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const missingCspRule: RuleDefinition = {
  id: "missing-csp",
  name: "Missing Content Security Policy (CSP)",
  category: "security",
  defaultSeverity: "medium",
  description: "Page lacks a Content-Security-Policy (CSP), leaving it susceptible to Cross-Site Scripting (XSS) and unauthorized data exfiltration.",
  recommendation: "Deploy a Content-Security-Policy header or <meta http-equiv='Content-Security-Policy'> restricting script-src, style-src, and frame-ancestors.",
  standards: [
    {
      authority: "OWASP",
      name: "Top 10 Web Application Security Risks",
      criterion: "A05:2021 Security Misconfiguration",
      url: "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/",
    },
    {
      authority: "MDN",
      name: "Content Security Policy (CSP)",
      criterion: "CSP Header",
      url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const sec = context.snapshot.securityMetrics;

    if (sec && !sec.hasCsp) {
      findings.push({
        title: "Content Security Policy (CSP) is not enforced",
        description: "The page did not define a Content-Security-Policy via HTTP headers or <meta> tag to mitigate XSS attacks.",
        evidence: [
          { property: "hasCsp", actual: false, expected: true },
        ],
        recommendation: "Add a strict Content-Security-Policy header, e.g. Content-Security-Policy: default-src 'self'; script-src 'self'.",
        confidence: 0.9,
      });
    }

    return findings;
  },
};
