import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const viewportOverflowRule: RuleDefinition = {
  id: "viewport-overflow",
  name: "Viewport Overflow",
  category: "visual",
  defaultSeverity: "medium",
  description: "A visible element extends beyond the viewport width, which can create clipped content or unintended horizontal scrolling.",
  recommendation: "Use responsive sizing, wrapping, or a scroll container so the content remains reachable.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "1.4.10 Reflow",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/reflow.html",
    },
  ],
  wcag: ["1.4.10"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      if (element.boundingBox && element.boundingBox.x + element.boundingBox.width > context.snapshot.viewport.width + 1) {
        findings.push({
          title: "Visible element overflows the viewport",
          description: "An element extends beyond the viewport width, which can create clipped content or horizontal scrolling.",
          element,
          evidence: [
            {
              property: "rightEdge",
              actual: element.boundingBox.x + element.boundingBox.width,
              expected: context.snapshot.viewport.width,
              unit: "px",
            },
          ],
          recommendation: "Use responsive sizing, wrapping, or a scroll container so the content remains reachable.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
