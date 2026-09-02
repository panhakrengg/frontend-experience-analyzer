import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";
import { isFormControl } from "../utils.js";

export const fieldErrorAssociationRule: RuleDefinition = {
  id: "field-error-association",
  name: "Form Field Error Association",
  category: "accessibility",
  defaultSeverity: "high",
  description: "When a form field is marked invalid with aria-invalid=\"true\", the corresponding error text must be programmatically associated via aria-describedby or aria-errormessage.",
  recommendation: "Add aria-describedby=\"<error-element-id>\" to the form control pointing to the error message element.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "3.3.1 Error Identification / 1.3.1 Info and Relationships",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html",
    },
  ],
  wcag: ["3.3.1", "1.3.1"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      if (isFormControl(element)) {
        const isInvalid = element.attributes?.["aria-invalid"] === "true";
        if (isInvalid) {
          const hasErrorAssociation = Boolean(
            element.attributes?.["aria-describedby"]?.trim() ||
            element.attributes?.["aria-errormessage"]?.trim()
          );

          if (!hasErrorAssociation) {
            findings.push({
              title: "Invalid form field missing error message association",
              description: "A form control has aria-invalid=\"true\" but does not reference an error message using aria-describedby or aria-errormessage.",
              element,
              evidence: [
                {
                  property: "aria-invalid",
                  actual: "true",
                },
                {
                  property: "aria-describedby",
                  actual: element.attributes?.["aria-describedby"] ?? null,
                  expected: "ID of error message element",
                },
              ],
              recommendation: "Link the validation error message to this field using aria-describedby=\"<error-id>\".",
              confidence: 0.95,
            });
          }
        }
      }
    }

    return findings;
  },
};
