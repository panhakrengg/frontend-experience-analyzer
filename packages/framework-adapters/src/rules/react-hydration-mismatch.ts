import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const reactHydrationMismatchRule: RuleDefinition = {
  id: "react-hydration-mismatch",
  name: "React SSR Hydration Mismatch",
  category: "interaction",
  defaultSeverity: "critical",
  description: "Server-rendered HTML diverged from initial client render, triggering a React hydration error that causes UI flashing and broken event listeners.",
  recommendation: "Ensure server and client render identical initial markup by deferring browser-only APIs (localStorage, window) to useEffect.",
  standards: [
    {
      authority: "React",
      name: "Server Components & Hydration",
      criterion: "Hydration Errors",
      url: "https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const errors = context.snapshot.interactionTrace?.consoleErrors ?? [];

    for (const error of errors) {
      if (
        error.text.includes("Hydration failed") ||
        error.text.includes("did not match") ||
        error.text.includes("Text content does not match server-rendered HTML") ||
        error.text.includes("Minified React error #418") ||
        error.text.includes("Minified React error #423")
      ) {
        findings.push({
          title: "React SSR hydration mismatch error detected",
          description: `React caught a hydration discrepancy between server and client: "${error.text}".`,
          evidence: [
            { property: "error", actual: error.text },
            { property: "location", actual: error.location ?? "React Runtime" },
          ],
          recommendation: "Wrap client-only dynamic components in suppressHydrationWarning or use dynamic(..., { ssr: false }).",
          confidence: 1,
        });
      }
    }

    return findings;
  },
};
