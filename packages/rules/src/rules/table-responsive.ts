import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const tableResponsiveRule: RuleDefinition = {
  id: "table-responsive",
  name: "Responsive Data Table",
  category: "responsive",
  defaultSeverity: "medium",
  description: "Data tables wider than the screen on mobile devices cause page-level horizontal blowout if not wrapped in a dedicated horizontally-scrollable container.",
  recommendation: "Wrap data tables in a container with overflow-x: auto (e.g. <div class=\"table-responsive\" tabindex=\"0\" role=\"region\" aria-label=\"Data Table\">...</div>).",
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
    const vpWidth = context.snapshot.viewport.width;

    if (vpWidth > 768) return [];

    for (const element of context.snapshot.elements) {
      if (!element.visible || element.tagName !== "table" || !element.boundingBox) continue;

      const isWiderThanViewport =
        element.boundingBox.width > vpWidth ||
        (element.scrollWidth !== undefined && element.scrollWidth > vpWidth);

      if (isWiderThanViewport) {
        findings.push({
          title: `Data table overflows mobile viewport (${Math.round(element.boundingBox.width)}px > ${vpWidth}px)`,
          description: "A <table> element is wider than the mobile viewport and may cause horizontal page distortion.",
          element,
          evidence: [
            { property: "tableWidth", actual: Math.round(element.boundingBox.width), expected: `<= ${vpWidth}`, unit: "px" },
            { property: "viewportWidth", actual: vpWidth, unit: "px" },
          ],
          recommendation: "Wrap the table in an overflow-x: auto container or use a card-based mobile layout.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
