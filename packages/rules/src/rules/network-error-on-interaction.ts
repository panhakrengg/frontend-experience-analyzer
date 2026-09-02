import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const networkErrorRule: RuleDefinition = {
  id: "network-error",
  name: "Network Request Failure",
  category: "interaction",
  defaultSeverity: "high",
  description: "Network requests failed during page load or user interaction with HTTP client/server errors (4xx/5xx) or network aborts.",
  recommendation: "Ensure API endpoints are reachable, CORS headers are configured, and static assets exist.",
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const failures = context.snapshot.interactionTrace?.networkFailures ?? [];

    for (const failure of failures.slice(0, 5)) {
      findings.push({
        title: `Failed network request: ${failure.method} ${truncateUrl(failure.url)}`,
        description: `Request failed with ${failure.errorText || `status ${failure.status}`}.`,
        evidence: [
          { property: "url", actual: failure.url },
          { property: "method", actual: failure.method },
          { property: "status", actual: failure.status || "Connection Error" },
          { property: "error", actual: failure.errorText },
        ],
        recommendation: "Verify the endpoint URL, authentication headers, CORS configuration, or server uptime.",
        confidence: 1,
      });
    }

    return findings;
  },
};

function truncateUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.length > 50 ? `${url.slice(0, 50)}...` : url;
  }
}
