import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const modalEscapeCloseRule: RuleDefinition = {
  id: "modal-escape-close",
  name: "Modal Escape Dismissal",
  category: "interaction",
  defaultSeverity: "high",
  description: "Modal dialogs must allow keyboard users to dismiss the dialog by pressing the Escape key without getting trapped.",
  recommendation: "Attach an onKeyDown listener for 'Escape' on modal dialogs to close the modal and return focus to the trigger element.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.1.2 No Keyboard Trap",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html",
    },
  ],
  wcag: ["2.1.2"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const interactions = context.snapshot.interactionTrace?.interactions ?? [];

    for (const event of interactions) {
      if (event.type === "modal-escape" && !event.success) {
        const matchingElement = context.snapshot.elements.find((e) => e.selector === event.targetSelector);
        findings.push({
          title: "Modal dialog cannot be closed with Escape key",
          description: `Pressing the Escape key did not close the active modal dialog (${event.targetSelector}).`,
          element: matchingElement,
          evidence: [
            { property: "action", actual: "Keyboard Escape key" },
            { property: "result", actual: "Modal remained open" },
            { property: "targetSelector", actual: event.targetSelector },
          ],
          recommendation: "Ensure pressing Escape triggers dialog close and returns focus to the calling element.",
          confidence: 0.95,
        });
      }
    }

    return findings;
  },
};
