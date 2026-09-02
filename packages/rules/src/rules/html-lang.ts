import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const htmlLangRule: RuleDefinition = {
  id: "html-lang",
  name: "HTML Lang Attribute",
  category: "accessibility",
  defaultSeverity: "high",
  description: "The <html> root element does not have a valid lang attribute, preventing screen readers from choosing the correct pronunciation and voice synthesizer.",
  recommendation: "Add a valid lang attribute to the <html> tag (e.g. <html lang=\"en\">).",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "3.1.1 Language of Page",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html",
    },
  ],
  wcag: ["3.1.1"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const lang = context.snapshot.lang?.trim();

    if (!lang) {
      return [
        {
          title: "Page is missing html lang attribute",
          description: "The root <html> element lacks a lang attribute or has an empty value.",
          evidence: [
            {
              property: "html[lang]",
              actual: context.snapshot.lang ?? null,
              expected: "Valid BCP 47 language code (e.g. 'en', 'km', 'fr')",
            },
          ],
          recommendation: "Specify the primary natural language of the page on the <html> element (e.g. <html lang=\"en\">).",
          confidence: 1,
        },
      ];
    }

    return [];
  },
};
