import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";
import { hasAccessibleName } from "../utils.js";

export const modalDialogSemanticsRule: RuleDefinition = {
  id: "modal-dialog-semantics",
  name: "Modal Dialog Semantics",
  category: "accessibility",
  defaultSeverity: "medium",
  description: "Modal dialogs must have proper ARIA semantics (role=\"dialog\" or role=\"alertdialog\"), aria-modal=\"true\", and an accessible title (aria-label or aria-labelledby) so assistive technology can trap and announce the modal properly.",
  recommendation: "Use the HTML <dialog> element or add role=\"dialog\", aria-modal=\"true\", and aria-labelledby pointing to the modal heading.",
  standards: [
    {
      authority: "W3C",
      name: "ARIA 1.2 / WCAG 2.1",
      criterion: "4.1.2 Name, Role, Value / 1.3.1 Info and Relationships",
      url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/",
    },
  ],
  wcag: ["1.3.1", "4.1.2"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      const isDialog =
        element.tagName === "dialog" ||
        element.role === "dialog" ||
        element.role === "alertdialog" ||
        element.attributes?.["aria-modal"] === "true";

      if (isDialog) {
        // Check 1: Missing dialog role when aria-modal="true" is on non-dialog tag
        if (element.tagName !== "dialog" && element.role !== "dialog" && element.role !== "alertdialog") {
          findings.push({
            title: "Modal container missing role=\"dialog\"",
            description: "An element specifies aria-modal=\"true\" but is missing the appropriate ARIA role=\"dialog\" or role=\"alertdialog\".",
            element,
            evidence: [
              {
                property: "role",
                actual: element.role ?? "none",
                expected: "dialog or alertdialog",
              },
            ],
            recommendation: "Add role=\"dialog\" or role=\"alertdialog\" to this modal container.",
            confidence: 0.9,
          });
        }

        // Check 2: Missing accessible name for dialog
        if (!hasAccessibleName(element)) {
          findings.push({
            title: "Modal dialog missing accessible name",
            description: "A modal dialog lacks an aria-label or aria-labelledby pointing to the dialog heading.",
            element,
            evidence: [
              {
                property: "accessibleName",
                actual: element.accessibleName ?? null,
                expected: "Modal title via aria-labelledby or aria-label",
              },
            ],
            recommendation: "Add an aria-labelledby attribute to the dialog pointing to its header ID (e.g. aria-labelledby=\"modal-title\").",
            confidence: 0.95,
          });
        }
      }
    }

    return findings;
  },
};
