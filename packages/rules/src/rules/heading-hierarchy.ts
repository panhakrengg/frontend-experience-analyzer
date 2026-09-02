import type { ElementReference, RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const headingHierarchyRule: RuleDefinition = {
  id: "heading-hierarchy",
  name: "Heading Hierarchy",
  category: "accessibility",
  defaultSeverity: "medium",
  description: "Headings structure the page content. Skipping heading levels (e.g., <h1> followed directly by <h3>) creates confusion for users navigating with assistive technology.",
  recommendation: "Ensure headings follow a logical descending numerical order without skipping levels, and provide a top-level <h1> heading.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "1.3.1 Info and Relationships / 2.4.6 Headings and Labels",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
    },
  ],
  wcag: ["1.3.1", "2.4.6"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const headingElements: { level: number; element: ElementReference }[] = [];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      const tagMatch = /^h([1-6])$/i.exec(element.tagName);
      if (tagMatch) {
        headingElements.push({ level: Number(tagMatch[1]), element });
      } else if (element.role === "heading" && element.attributes?.["aria-level"]) {
        const ariaLevel = Number(element.attributes["aria-level"]);
        if (ariaLevel >= 1 && ariaLevel <= 6) {
          headingElements.push({ level: ariaLevel, element });
        }
      }
    }

    if (headingElements.length > 0) {
      const hasH1 = headingElements.some((h) => h.level === 1);
      if (!hasH1) {
        findings.push({
          title: "Page is missing a top-level <h1> heading",
          description: "No level 1 heading was detected on the page. The <h1> identifies the main topic of the page.",
          element: headingElements[0]?.element,
          evidence: [
            {
              property: "firstHeadingLevel",
              actual: `h${headingElements[0]?.level}`,
              expected: "h1",
            },
          ],
          recommendation: "Add an <h1> heading describing the main purpose or topic of the page.",
          confidence: 0.9,
        });
      }

      let prevLevel = 0;
      for (const heading of headingElements) {
        if (prevLevel > 0 && heading.level > prevLevel + 1) {
          findings.push({
            title: `Heading level skipped: <h${prevLevel}> to <h${heading.level}>`,
            description: `Heading level jumped from ${prevLevel} directly to ${heading.level}, skipping level ${prevLevel + 1}.`,
            element: heading.element,
            evidence: [
              {
                property: "headingLevelJump",
                actual: `h${heading.level}`,
                expected: `h${prevLevel + 1} or lower`,
              },
            ],
            recommendation: `Change this heading to <h${prevLevel + 1}> or reorganize the section structure.`,
            confidence: 0.95,
          });
        }
        prevLevel = heading.level;
      }
    }

    return findings;
  },
};
