import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const forbiddenInlineStylesRule: RuleDefinition = {
  id: "forbidden-inline-styles",
  name: "Forbidden Raw Inline Styles",
  category: "visual",
  defaultSeverity: "low",
  description: "Raw inline style attributes bypass CSS cascade architecture and design system component tokens.",
  recommendation: "Extract inline styles to CSS classes, CSS modules, or utility components.",
  standards: [
    {
      authority: "Design System",
      name: "CSS Architecture Standards",
      criterion: "No Raw Inline Styles",
      url: "https://design-system.example.com/guidelines/css",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName === "script" || el.tagName === "style" || el.tagName === "svg") continue;
      const style = el.attributes?.style?.trim();

      if (style && style.length > 0) {
        findings.push({
          title: `Inline style attribute detected on <${el.tagName}>`,
          description: `Element contains raw inline styles ("${style.slice(0, 50)}${style.length > 50 ? "..." : ""}") violating design system guidelines.`,
          element: el,
          evidence: [
            { property: "style", actual: style, expected: "Use CSS classes" },
          ],
          recommendation: "Replace inline styles with CSS classes or design system utility tokens.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
