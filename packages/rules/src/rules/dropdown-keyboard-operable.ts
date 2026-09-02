import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const dropdownKeyboardOperableRule: RuleDefinition = {
  id: "dropdown-keyboard",
  name: "Dropdown Keyboard Operability",
  category: "interaction",
  defaultSeverity: "high",
  description: "Dropdown menus and comboboxes must expand and respond to standard keyboard keys (Enter, Space, or ArrowDown).",
  recommendation: "Ensure keydown listeners on dropdown triggers toggle aria-expanded and open the dropdown menu.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.1.1 Keyboard",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html",
    },
  ],
  wcag: ["2.1.1"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const interactions = context.snapshot.interactionTrace?.interactions ?? [];

    for (const event of interactions) {
      if (event.type === "dropdown-toggle" && !event.success) {
        const matchingElement = context.snapshot.elements.find((e) => e.selector === event.targetSelector);
        findings.push({
          title: `Dropdown does not open with keyboard Enter key (${event.targetSelector})`,
          description: "Pressing Enter on the focused dropdown trigger failed to expand the dropdown menu.",
          element: matchingElement,
          evidence: [
            { property: "action", actual: "Keyboard Enter key" },
            { property: "result", actual: "Menu did not expand (aria-expanded remained unchanged)" },
          ],
          recommendation: "Listen for Enter/Space key events to toggle dropdown expansion and shift focus to the first menuitem.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
