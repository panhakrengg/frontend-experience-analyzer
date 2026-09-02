import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const clippedTextRule: RuleDefinition = {
  id: "clipped-text",
  name: "Clipped Text Content",
  category: "visual",
  defaultSeverity: "medium",
  description: "Text inside a container is clipped or truncated because the content exceeds the container dimensions and overflow is hidden or clipped.",
  recommendation: "Allow containers to expand dynamically with content (e.g. min-height instead of fixed height) or ensure scroll/wrap behaviors are enabled.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "1.4.4 Resize Text",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html",
    },
  ],
  wcag: ["1.4.4"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible || !element.text) continue;

      const isOverflowHidden =
        element.overflow === "hidden" ||
        element.overflow === "clip" ||
        element.attributes?.style?.includes("overflow: hidden") ||
        element.attributes?.style?.includes("overflow:hidden");

      if (
        isOverflowHidden &&
        element.scrollHeight !== undefined &&
        element.clientHeight !== undefined &&
        element.scrollHeight > element.clientHeight + 4
      ) {
        findings.push({
          title: "Text content is vertically clipped",
          description: `Element content height (${element.scrollHeight}px) exceeds visible container height (${element.clientHeight}px) with overflow hidden.`,
          element,
          evidence: [
            { property: "scrollHeight", actual: element.scrollHeight, unit: "px" },
            { property: "clientHeight", actual: element.clientHeight, expected: `>= ${element.scrollHeight}`, unit: "px" },
            { property: "overflow", actual: element.overflow ?? "hidden" },
          ],
          recommendation: "Avoid fixed heights on text containers; use min-height or enable flexible vertical expansion.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
