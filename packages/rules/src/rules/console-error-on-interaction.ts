import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const consoleErrorRule: RuleDefinition = {
  id: "console-error",
  name: "JavaScript Console Error",
  category: "interaction",
  defaultSeverity: "high",
  description: "Unhandled JavaScript exceptions or console.error calls occurred during page load or user interaction, which can cause UI freezes and broken user journeys.",
  recommendation: "Inspect the runtime error stack trace and fix the JavaScript null-pointer, uncaught promise, or syntax error.",
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const errors = context.snapshot.interactionTrace?.consoleErrors ?? [];

    for (const error of errors.slice(0, 5)) {
      findings.push({
        title: `JavaScript runtime error: ${truncate(error.text, 60)}`,
        description: `Browser caught a JavaScript exception: "${error.text}".`,
        evidence: [
          { property: "errorMessage", actual: error.text },
          { property: "location", actual: error.location ?? "unknown" },
        ],
        recommendation: "Fix the uncaught exception or rejected promise in your application bundle.",
        confidence: 1,
      });
    }

    return findings;
  },
};

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str;
}
