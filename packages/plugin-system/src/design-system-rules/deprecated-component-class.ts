import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export function createDeprecatedComponentClassRule(forbiddenClasses: string[] = []): RuleDefinition {
  return {
    id: "deprecated-component-class",
    name: "Deprecated Component Class Usage",
    category: "ux",
    defaultSeverity: "high",
    description: "Detects legacy or deprecated design system component classes marked for deprecation.",
    recommendation: "Migrate deprecated classes to the modern design system v2 components.",
    standards: [
      {
        authority: "Design System",
        name: "Migration & Deprecation Guide",
        criterion: "Legacy Class Elimination",
        url: "https://design-system.example.com/migration",
      },
    ],
    evaluate: (context: RuleContext): RuleFindingInput[] => {
      const findings: RuleFindingInput[] = [];
      if (!forbiddenClasses.length) return findings;

      for (const el of context.snapshot.elements) {
        const clsAttr = el.attributes?.class ?? el.attributes?.className ?? "";
        if (!clsAttr) continue;
        const classes = clsAttr.split(/\s+/);

        for (const cls of classes) {
          if (forbiddenClasses.includes(cls)) {
            findings.push({
              title: `Deprecated design system class detected: ".${cls}"`,
              description: `Element uses deprecated class ".${cls}" which has been phased out.`,
              element: el,
              evidence: [
                { property: "class", actual: cls, expected: "Modern component class" },
              ],
              recommendation: `Remove ".${cls}" and replace with modern design system component tokens.`,
              confidence: 1,
            });
          }
        }
      }

      return findings;
    },
  };
}
