import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const pageTitleRule: RuleDefinition = {
  id: "page-title",
  name: "Page Title",
  category: "accessibility",
  defaultSeverity: "medium",
  description: "The page has no document title, which makes it harder to identify in browser tabs and assistive technology.",
  recommendation: "Add a concise, unique title for this page.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.4.2 Page Titled",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/page-titled.html",
    },
  ],
  wcag: ["2.4.2"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    if (!context.snapshot.title.trim()) {
      return [
        {
          title: "Page is missing a title",
          description: "The page has no document title, which makes it harder to identify in browser tabs and assistive technology.",
          evidence: [
            {
              property: "title",
              actual: context.snapshot.title,
              expected: "Non-empty page title",
            },
          ],
          recommendation: "Add a concise, unique title for this page.",
          confidence: 1,
        },
      ];
    }
    return [];
  },
};
