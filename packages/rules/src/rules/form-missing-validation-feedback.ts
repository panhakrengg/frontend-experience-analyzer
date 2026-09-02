import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const formMissingValidationFeedbackRule: RuleDefinition = {
  id: "form-validation-feedback",
  name: "Form Validation Feedback",
  category: "interaction",
  defaultSeverity: "high",
  description: "A form with required fields lacks inline validation messages or ARIA status feedback when invalid inputs are present.",
  recommendation: "Provide clear error text when a form field is invalid, and connect it to the input with aria-describedby.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "3.3.1 Error Identification",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html",
    },
  ],
  wcag: ["3.3.1"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      const isRequired = "required" in (element.attributes ?? {});
      const isInvalid = element.attributes?.["aria-invalid"] === "true";
      const hasErrorMessage = Boolean(
        element.attributes?.["aria-describedby"] || element.attributes?.["aria-errormessage"]
      );

      if (isInvalid && !hasErrorMessage) {
        findings.push({
          title: "Invalid form input has no error message feedback",
          description: "An input marked invalid has no visible or programmatic error feedback message.",
          element,
          evidence: [
            { property: "aria-invalid", actual: "true" },
            { property: "aria-describedby", actual: null, expected: "Linked error element ID" },
          ],
          recommendation: "Display an error message near the field and link it via aria-describedby.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
