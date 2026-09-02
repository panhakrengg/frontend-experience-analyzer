import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const modalLargerThanViewportRule: RuleDefinition = {
  id: "modal-larger-than-viewport",
  name: "Modal Exceeds Viewport",
  category: "responsive",
  defaultSeverity: "high",
  description: "A modal or dialog container is larger than the current viewport, which can hide dialog actions, confirmation buttons, or close controls off-screen.",
  recommendation: "Set max-width: 90vw; max-height: 90vh; overflow-y: auto on modal dialogs so they fit inside any viewport.",
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
    const { width: vpWidth, height: vpHeight } = context.snapshot.viewport;

    for (const element of context.snapshot.elements) {
      if (!element.visible || !element.boundingBox) continue;

      const isDialog =
        element.tagName === "dialog" ||
        element.role === "dialog" ||
        element.role === "alertdialog" ||
        element.attributes?.["aria-modal"] === "true";

      if (isDialog) {
        const exceedsWidth = element.boundingBox.width > vpWidth;
        const exceedsHeight = element.boundingBox.height > vpHeight;

        if (exceedsWidth || exceedsHeight) {
          findings.push({
            title: `Modal dialog dimensions exceed viewport (${Math.round(element.boundingBox.width)}x${Math.round(element.boundingBox.height)} vs ${vpWidth}x${vpHeight})`,
            description: "The dialog cannot fit on screen, which may prevent users on smaller viewports from reaching modal buttons.",
            element,
            evidence: [
              { property: "dialogDimensions", actual: `${Math.round(element.boundingBox.width)}x${Math.round(element.boundingBox.height)}`, expected: `< ${vpWidth}x${vpHeight}`, unit: "px" },
              { property: "viewport", actual: `${vpWidth}x${vpHeight}`, unit: "px" },
            ],
            recommendation: "Apply max-width: min(90vw, 600px) and max-height: 90vh with overflow-y: auto on the modal container.",
            confidence: 0.95,
          });
        }
      }
    }

    return findings;
  },
};
