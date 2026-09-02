import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export function createDesignTokenColorRule(approvedColors: string[] = []): RuleDefinition {
  const normalizedApproved = approvedColors.map((c) => c.toLowerCase().replace(/\s+/g, ""));

  return {
    id: "design-token-color",
    name: "Design System Approved Color Palette",
    category: "visual",
    defaultSeverity: "medium",
    description: "Enforces usage of design system color tokens instead of arbitrary hardcoded hex/rgb color values in inline styles.",
    recommendation: "Replace hardcoded colors with approved CSS custom properties or design token variables.",
    standards: [
      {
        authority: "Design System",
        name: "Brand Token Guidelines",
        criterion: "Color Palette Compliance",
        url: "https://design-system.example.com/tokens/colors",
      },
    ],
    evaluate: (context: RuleContext): RuleFindingInput[] => {
      const findings: RuleFindingInput[] = [];
      if (!normalizedApproved.length) return findings;

      for (const el of context.snapshot.elements) {
        const style = el.attributes?.style?.toLowerCase() ?? "";
        if (!style) continue;

        // Match hex colors #fff, #ffffff, #ffffffff or rgb/rgba(...)
        const hexMatches = style.match(/#[0-9a-f]{3,8}\b/gi) ?? [];
        const rgbMatches = style.match(/rgba?\([^)]+\)/gi) ?? [];
        const foundColors = [...hexMatches, ...rgbMatches].map((c) => c.replace(/\s+/g, ""));

        for (const color of foundColors) {
          if (!normalizedApproved.includes(color)) {
            findings.push({
              title: `Unapproved hardcoded color token detected: "${color}"`,
              description: `Element uses arbitrary color "${color}" which is not in the approved design system palette.`,
              element: el,
              evidence: [
                { property: "color", actual: color, expected: `One of: ${approvedColors.join(", ")}` },
              ],
              recommendation: "Use approved design system color tokens: var(--color-primary), var(--color-surface), etc.",
              confidence: 0.95,
            });
          }
        }
      }

      return findings;
    },
  };
}
