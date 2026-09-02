import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const fixedWidthLayoutRule: RuleDefinition = {
  id: "fixed-width-layout",
  name: "Fixed Width on Mobile",
  category: "responsive",
  defaultSeverity: "high",
  description: "Elements with rigid fixed pixel widths or min-widths wider than smaller viewports cause viewport overflow and broken mobile layouts.",
  recommendation: "Use responsive units (e.g. max-width: 100%, width: 100%, flexbox, or grid) instead of fixed large pixel widths on containers.",
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
    const viewportWidth = context.snapshot.viewport.width;

    // Primarily applies to mobile/tablet viewports (<= 768px)
    if (viewportWidth > 768) return [];

    for (const element of context.snapshot.elements) {
      if (!element.visible || !element.boundingBox) continue;

      const style = element.attributes?.style?.toLowerCase() ?? "";
      const hasLargeFixedWidth =
        /width:\s*([4-9]\d{2,}|\d{4,})px/.test(style) ||
        /min-width:\s*([4-9]\d{2,}|\d{4,})px/.test(style);

      if (hasLargeFixedWidth && element.boundingBox.width > viewportWidth) {
        findings.push({
          title: `Fixed-width container exceeds mobile viewport (${element.boundingBox.width}px > ${viewportWidth}px)`,
          description: "An element defines a fixed pixel width that cannot shrink on mobile devices, forcing horizontal scrolling.",
          element,
          evidence: [
            { property: "elementWidth", actual: element.boundingBox.width, expected: `<= ${viewportWidth}`, unit: "px" },
            { property: "viewportWidth", actual: viewportWidth, unit: "px" },
          ],
          recommendation: "Replace fixed width with max-width: 100% or use responsive media queries.",
          confidence: 0.95,
        });
      }
    }

    return findings;
  },
};
