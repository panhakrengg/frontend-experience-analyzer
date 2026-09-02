import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const imageAltRule: RuleDefinition = {
  id: "image-alt",
  name: "Image Alt Text",
  category: "accessibility",
  defaultSeverity: "high",
  description: "An image does not include an alt attribute, so assistive technology cannot tell whether it is meaningful or decorative.",
  recommendation: "Add descriptive alt text for meaningful images or alt=\"\" for decorative images.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "1.1.1 Non-text Content",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
    },
  ],
  wcag: ["1.1.1"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      if (element.tagName === "img" && !("alt" in (element.attributes ?? {}))) {
        findings.push({
          title: "Image is missing alt text",
          description: "An image does not include an alt attribute, so assistive technology cannot tell whether it is meaningful or decorative.",
          element,
          evidence: [
            {
              property: "alt",
              actual: undefined,
              expected: "Text alternative or empty decorative alt",
            },
          ],
          recommendation: "Add descriptive alt text for meaningful images or alt=\"\" for decorative images.",
          confidence: 0.95,
        });
      }
    }

    return findings;
  },
};
