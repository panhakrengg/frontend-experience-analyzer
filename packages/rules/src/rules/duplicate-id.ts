import type { ElementReference, RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const duplicateIdRule: RuleDefinition = {
  id: "duplicate-id",
  name: "Duplicate ID Attribute",
  category: "accessibility",
  defaultSeverity: "high",
  description: "The id attribute value must be unique on the page. Duplicate IDs cause label associations, ARIA relationships, and script element lookups to fail.",
  recommendation: "Ensure every element with an id attribute has a unique ID across the entire document.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "4.1.1 Parsing",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/parsing.html",
    },
  ],
  wcag: ["4.1.1"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const idMap = new Map<string, ElementReference[]>();

    for (const element of context.snapshot.elements) {
      if (element.id?.trim()) {
        const id = element.id.trim();
        const list = idMap.get(id) ?? [];
        list.push(element);
        idMap.set(id, list);
      }
    }

    for (const [id, elements] of idMap.entries()) {
      if (elements.length > 1) {
        // Flag duplicate instances after the first one
        for (let i = 1; i < elements.length; i++) {
          const element = elements[i]!;
          findings.push({
            title: `Duplicate id attribute: #${id}`,
            description: `The id "${id}" is used on ${elements.length} different elements on this page.`,
            element,
            evidence: [
              {
                property: "id",
                actual: id,
                expected: "Unique identifier",
                description: `First declared on <${elements[0]?.tagName}> (${elements[0]?.selector})`,
              },
            ],
            recommendation: `Rename this id or dynamically generate unique IDs for repeated component instances.`,
            confidence: 1,
          });
        }
      }
    }

    return findings;
  },
};
