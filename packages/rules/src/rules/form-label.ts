import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";
import { hasAccessibleName, isFormControl } from "../utils.js";

export const formLabelRule: RuleDefinition = {
  id: "form-label",
  name: "Form Control Label",
  category: "accessibility",
  defaultSeverity: "high",
  description: "A form field has no clear accessible label, making the field purpose ambiguous.",
  recommendation: "Connect a label element to the field or use aria-label/aria-labelledby when a visible label is not possible.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "1.3.1 Info and Relationships / 4.1.2 Name, Role, Value",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
    },
  ],
  wcag: ["1.3.1", "4.1.2"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      if (isFormControl(element) && !hasAccessibleName(element)) {
        findings.push({
          title: "Form control is missing a label",
          description: "A form field has no clear accessible label, making the field purpose ambiguous.",
          element,
          evidence: [
            {
              property: "accessibleName",
              actual: element.accessibleName,
              expected: "Associated label or accessible name",
            },
          ],
          recommendation: "Connect a label element to the field or use aria-label/aria-labelledby when a visible label is not possible.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
