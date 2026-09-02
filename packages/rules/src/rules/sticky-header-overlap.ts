import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const stickyHeaderOverlapRule: RuleDefinition = {
  id: "sticky-header-overlap",
  name: "Sticky/Fixed Overlay Overlap",
  category: "visual",
  defaultSeverity: "medium",
  description: "Fixed or sticky header/footer overlays with high z-index can obscure interactive elements positioned at the top or bottom of the page.",
  recommendation: "Ensure main content containers have sufficient scroll-padding-top or margin/padding to account for fixed/sticky headers.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.4.7 Focus Visible / 1.4.10 Reflow",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html",
    },
  ],
  wcag: ["2.4.7", "1.4.10"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const fixedHeaders = context.snapshot.elements.filter(
      (el) =>
        el.visible &&
        (el.position === "fixed" || el.position === "sticky") &&
        el.boundingBox &&
        el.boundingBox.y <= 0 &&
        el.boundingBox.height > 20 &&
        (el.zIndex ?? 0) >= 10
    );

    if (fixedHeaders.length === 0) return [];

    const header = fixedHeaders[0]!;
    const headerBottom = (header.boundingBox?.y ?? 0) + (header.boundingBox?.height ?? 0);

    const overlappingInteractive = context.snapshot.elements.filter(
      (el) =>
        el.visible &&
        el.interactive &&
        el.selector !== header.selector &&
        el.position !== "fixed" &&
        el.position !== "sticky" &&
        el.boundingBox &&
        el.boundingBox.y < headerBottom &&
        el.boundingBox.y + el.boundingBox.height > 0 &&
        (el.zIndex ?? 0) < (header.zIndex ?? 10)
    );

    for (const el of overlappingInteractive.slice(0, 3)) {
      findings.push({
        title: `Interactive element overlapped by fixed header (${el.selector})`,
        description: `A fixed header of height ${Math.round(header.boundingBox!.height)}px is overlapping an interactive element at top: ${Math.round(el.boundingBox!.y)}px.`,
        element: el,
        evidence: [
          { property: "headerHeight", actual: Math.round(header.boundingBox!.height), unit: "px" },
          { property: "elementTop", actual: Math.round(el.boundingBox!.y), expected: `>= ${Math.round(headerBottom)}`, unit: "px" },
          { property: "headerSelector", actual: header.selector },
        ],
        recommendation: `Add scroll-padding-top: ${Math.round(header.boundingBox!.height)}px or add top padding to the content wrapper.`,
        confidence: 0.85,
      });
    }

    return findings;
  },
};
