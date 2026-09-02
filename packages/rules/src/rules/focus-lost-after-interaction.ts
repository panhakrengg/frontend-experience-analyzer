import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const focusLostAfterInteractionRule: RuleDefinition = {
  id: "focus-lost",
  name: "Focus Lost After Interaction",
  category: "interaction",
  defaultSeverity: "medium",
  description: "Keyboard focus was reset to <body> after dismissing a modal or collapsing an overlay, forcing screen reader and keyboard users to navigate the entire page again.",
  recommendation: "Explicitly return focus to the trigger button that originally opened the modal or dropdown upon dismissal.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.4.3 Focus Order",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html",
    },
  ],
  wcag: ["2.4.3"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const interactions = context.snapshot.interactionTrace?.interactions ?? [];

    for (const event of interactions) {
      if (
        (event.type === "modal-escape" || event.type === "dropdown-toggle") &&
        event.focusAfter === "body"
      ) {
        const matchingElement = context.snapshot.elements.find((e) => e.selector === event.targetSelector);
        findings.push({
          title: `Keyboard focus lost to <body> after ${event.type}`,
          description: `Focus was dropped to <body> when dismissing ${event.targetSelector}.`,
          element: matchingElement,
          evidence: [
            { property: "action", actual: event.type },
            { property: "focusAfter", actual: "body", expected: "Trigger element or previous active element" },
          ],
          recommendation: "Save document.activeElement before opening and call element.focus() on close.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
