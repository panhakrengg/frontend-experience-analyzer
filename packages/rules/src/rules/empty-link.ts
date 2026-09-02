import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";
import { hasAccessibleName } from "../utils.js";

export const emptyLinkRule: RuleDefinition = {
  id: "empty-link",
  name: "Link Text / Accessible Name",
  category: "accessibility",
  defaultSeverity: "high",
  description: "Links must have discernible text or an accessible name so users and screen readers understand where the link navigates.",
  recommendation: "Add descriptive anchor text, an aria-label attribute, or an img with alt text inside the link.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.4.4 Link Purpose (In Context) / 4.1.2 Name, Role, Value",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html",
    },
  ],
  wcag: ["2.4.4", "4.1.2"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      const isLink = element.tagName === "a" || element.role === "link";
      if (isLink && !hasAccessibleName(element)) {
        findings.push({
          title: "Link has no discernible text or accessible name",
          description: "An anchor or link element does not contain any text, aria-label, aria-labelledby, or image with alt text.",
          element,
          evidence: [
            {
              property: "accessibleName",
              actual: element.accessibleName ?? null,
              expected: "Non-empty link text or aria-label",
            },
            {
              property: "href",
              actual: element.attributes?.href ?? "(no href)",
            },
          ],
          recommendation: "Provide visible text inside the link or add an aria-label attribute describing the link destination.",
          confidence: 0.95,
        });
      }
    }

    return findings;
  },
};
