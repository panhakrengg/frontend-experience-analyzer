import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const unresponsiveButtonRule: RuleDefinition = {
  id: "unresponsive-button",
  name: "Unresponsive Interactive Element",
  category: "interaction",
  defaultSeverity: "medium",
  description: "Clicking an interactive element produced zero DOM mutation, zero network request, and zero navigation, suggesting a dead button or unimplemented handler.",
  recommendation: "Ensure interactive elements have attached event listeners or appropriate href attributes, or remove non-functional buttons.",
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const interactions = context.snapshot.interactionTrace?.interactions ?? [];

    for (const event of interactions) {
      if (event.type === "click" && !event.success && event.mutationsCount === 0) {
        const matchingElement = context.snapshot.elements.find((e) => e.selector === event.targetSelector);
        findings.push({
          title: `Button appears unresponsive on click (${event.targetSelector})`,
          description: "Clicking this element triggered no state changes, network requests, or DOM mutations.",
          element: matchingElement,
          evidence: [
            { property: "targetSelector", actual: event.targetSelector },
            { property: "mutationsCount", actual: 0 },
          ],
          recommendation: "Attach a click handler, navigate to target, or disable the button if inactive.",
          confidence: 0.8,
        });
      }
    }

    return findings;
  },
};
