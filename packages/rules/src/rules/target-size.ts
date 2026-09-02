import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const targetSizeRule: RuleDefinition = {
  id: "target-size",
  name: "Interactive Target Size",
  category: "responsive",
  defaultSeverity: "medium",
  description: "An interactive element is smaller than the recommended minimum target size of 24x24 CSS pixels.",
  recommendation: "Increase the clickable or tappable area to at least 24 by 24 CSS pixels.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.2",
      criterion: "2.5.8 Target Size (Minimum)",
      url: "https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html",
    },
  ],
  wcag: ["2.5.8"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      if (
        element.interactive &&
        element.boundingBox &&
        (element.boundingBox.width < 24 || element.boundingBox.height < 24)
      ) {
        findings.push({
          title: "Interactive target is too small",
          description: "An interactive element is smaller than the recommended minimum target size.",
          element,
          evidence: [
            {
              property: "width",
              actual: element.boundingBox.width,
              expected: 24,
              unit: "px",
            },
            {
              property: "height",
              actual: element.boundingBox.height,
              expected: 24,
              unit: "px",
            },
          ],
          recommendation: "Increase the clickable or tappable area to at least 24 by 24 CSS pixels.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
