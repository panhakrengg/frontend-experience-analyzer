import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const focusIndicatorRule: RuleDefinition = {
  id: "focus-indicator",
  name: "Focus Indicator",
  category: "accessibility",
  defaultSeverity: "high",
  description: "Interactive elements must provide a visible focus indicator for keyboard users. Completely removing outlines without an accessible alternative creates an unreachable interface for keyboard navigation.",
  recommendation: "Ensure focus indicators are clearly visible with high contrast (e.g. using :focus-visible { outline: 2px solid #2563eb; outline-offset: 2px; }).",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.4.7 Focus Visible",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html",
    },
  ],
  wcag: ["2.4.7"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible || !element.interactive) continue;

      const inlineStyle = element.attributes?.style?.toLowerCase() ?? "";
      const hasInlineOutlineNone =
        inlineStyle.includes("outline:none") ||
        inlineStyle.includes("outline: none") ||
        inlineStyle.includes("outline:0") ||
        inlineStyle.includes("outline: 0");

      if (hasInlineOutlineNone) {
        findings.push({
          title: "Focus outline explicitly disabled via inline style",
          description: "An interactive element explicitly suppresses focus outline with inline style='outline: none', making keyboard focus invisible.",
          element,
          evidence: [
            {
              property: "style.outline",
              actual: "none / 0",
              expected: "Visible focus ring (minimum 2px with 3:1 contrast ratio)",
            },
          ],
          recommendation: "Remove inline outline suppression or provide a custom visible focus ring with :focus-visible.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
