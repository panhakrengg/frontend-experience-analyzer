import type { Finding, FindingSeverity, Viewport } from "@frontend-experience-analyzer/core";

export function createPageLoadFinding(url: string, viewport: Viewport, error: unknown): Finding {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const severity: FindingSeverity = "high";

  return {
    id: `ux-page-load-${encodeURIComponent(url).replace(/[^a-zA-Z0-9_-]/g, "_")}-${viewport.name}`,
    ruleId: "page-load-failure",
    pageUrl: url,
    category: "ux",
    severity,
    title: "Page could not be scanned",
    description: "The browser could not load this page within the scan settings.",
    evidence: [
      { property: "url", actual: url },
      { property: "viewport", actual: `${viewport.width}x${viewport.height}` },
      { property: "error", actual: errorMessage },
    ],
    recommendation: "Confirm the app is running, the URL is correct, and the page can finish loading in a browser.",
    confidence: 1,
  };
}
