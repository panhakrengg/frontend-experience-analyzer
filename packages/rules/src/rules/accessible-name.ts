import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";
import { hasAccessibleName } from "../utils.js";

export const accessibleNameRule: RuleDefinition = {
  id: "accessible-name",
  name: "Accessible Name",
  category: "accessibility",
  defaultSeverity: "high",
  description: "An interactive element is missing a usable text label for assistive technology.",
  recommendation: "Provide visible text, aria-label, aria-labelledby, title, value, or associated label text.",
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

      if (element.interactive && !hasAccessibleName(element)) {
        findings.push({
          title: "Interactive control has no accessible name",
          description: "An interactive element is missing a usable text label for assistive technology.",
          element,
          evidence: [
            {
              property: "accessibleName",
              actual: element.accessibleName,
              expected: "Visible text or accessible name",
            },
          ],
          recommendation: "Provide visible text, aria-label, aria-labelledby, title, value, or associated label text.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
