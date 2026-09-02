import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const touchTargetSpacingRule: RuleDefinition = {
  id: "touch-target-spacing",
  name: "Touch Target Spacing",
  category: "responsive",
  defaultSeverity: "medium",
  description: "Touch targets that are small and positioned too closely together cause accidental taps and mis-clicks on mobile and touch devices.",
  recommendation: "Ensure interactive elements on touch screens have at least 8px of clearance between their target bounds or meet the 24x24px minimum size.",
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
    const interactiveElements = context.snapshot.elements.filter(
      (el) => el.visible && el.interactive && el.boundingBox && el.boundingBox.width > 0 && el.boundingBox.height > 0
    );

    for (let i = 0; i < interactiveElements.length; i++) {
      const a = interactiveElements[i]!;
      const boxA = a.boundingBox!;

      // If target size is already >= 24x24, spacing guideline is satisfied
      if (boxA.width >= 24 && boxA.height >= 24) continue;

      for (let j = i + 1; j < interactiveElements.length; j++) {
        const b = interactiveElements[j]!;
        const boxB = b.boundingBox!;

        // Calculate distance between bounding boxes
        const horizontalDist = Math.max(0, Math.max(boxA.x - (boxB.x + boxB.width), boxB.x - (boxA.x + boxA.width)));
        const verticalDist = Math.max(0, Math.max(boxA.y - (boxB.y + boxB.height), boxB.y - (boxA.y + boxA.height)));
        const distance = Math.hypot(horizontalDist, verticalDist);

        if (distance < 8 && (horizontalDist > 0 || verticalDist > 0)) {
          findings.push({
            title: `Touch targets are too close (${Math.round(distance)}px gap)`,
            description: `A small interactive element (${Math.round(boxA.width)}x${Math.round(boxA.height)}px) is only ${Math.round(distance)}px away from an adjacent interactive control, increasing mis-tap risk.`,
            element: a,
            evidence: [
              { property: "distance", actual: Math.round(distance), expected: ">= 8", unit: "px" },
              { property: "targetSize", actual: `${Math.round(boxA.width)}x${Math.round(boxA.height)}`, unit: "px" },
              { property: "adjacentElement", actual: b.selector },
            ],
            recommendation: "Increase the spacing between adjacent clickable targets to at least 8px or increase target size to 24x24px.",
            confidence: 0.85,
          });
          break; // Avoid spamming multiple distance findings on the same element
        }
      }
    }

    return findings;
  },
};
