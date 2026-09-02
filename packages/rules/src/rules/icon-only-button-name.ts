import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";
import { hasAccessibleName } from "../utils.js";

export const iconOnlyButtonNameRule: RuleDefinition = {
  id: "icon-only-button-name",
  name: "Button Accessible Name",
  category: "accessibility",
  defaultSeverity: "high",
  description: "Buttons must have discernible text or an accessible name (e.g. via aria-label) so users know what action the button performs.",
  recommendation: "Add visible text, an aria-label, aria-labelledby, or title attribute to the button.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "4.1.2 Name, Role, Value",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html",
    },
  ],
  wcag: ["4.1.2"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      const isButton =
        element.tagName === "button" ||
        element.role === "button" ||
        (element.tagName === "input" && ["button", "submit", "reset", "image"].includes(element.attributes?.type ?? ""));

      if (isButton && !hasAccessibleName(element)) {
        findings.push({
          title: "Button is missing an accessible name",
          description: "A button (likely an icon-only button) has no text content, aria-label, or title.",
          element,
          evidence: [
            {
              property: "accessibleName",
              actual: element.accessibleName ?? null,
              expected: "Action description (e.g. 'Close', 'Edit', 'Submit')",
            },
          ],
          recommendation: "Add an aria-label attribute to describe the button's action (e.g. <button aria-label=\"Search\"><svg .../></button>).",
          confidence: 0.95,
        });
      }
    }

    return findings;
  },
};
