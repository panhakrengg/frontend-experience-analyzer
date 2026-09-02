import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export function createDesignTokenFontRule(approvedFonts: string[] = []): RuleDefinition {
  const normalizedApproved = approvedFonts.map((f) => f.toLowerCase().replace(/['"]/g, "").trim());

  return {
    id: "design-token-font",
    name: "Design System Approved Font Family",
    category: "visual",
    defaultSeverity: "medium",
    description: "Enforces usage of design system typography font families instead of arbitrary font names.",
    recommendation: "Use the approved brand font family: " + approvedFonts.join(", "),
    standards: [
      {
        authority: "Design System",
        name: "Typography Guidelines",
        criterion: "Font Family Compliance",
        url: "https://design-system.example.com/tokens/typography",
      },
    ],
    evaluate: (context: RuleContext): RuleFindingInput[] => {
      const findings: RuleFindingInput[] = [];
      if (!normalizedApproved.length) return findings;

      for (const el of context.snapshot.elements) {
        const rawStyle = el.attributes?.style ?? "";
        if (!rawStyle.toLowerCase().includes("font-family")) continue;

        const match = rawStyle.match(/font-family\s*:\s*([^;]+)/i);
        if (match && match[1]) {
          const font = match[1].toLowerCase().replace(/['"]/g, "").trim();
          const isApproved = normalizedApproved.some((af) => font.includes(af));

          if (!isApproved) {
            findings.push({
              title: `Unapproved font family: "${match[1].trim()}"`,
              description: `Element defines font-family "${match[1].trim()}" which is not in the approved design system fonts.`,
              element: el,
              evidence: [
                { property: "fontFamily", actual: match[1].trim(), expected: approvedFonts.join(", ") },
              ],
              recommendation: `Update font-family to one of: ${approvedFonts.join(", ")}.`,
              confidence: 0.95,
            });
          }
        }
      }

      return findings;
    },
  };
}
