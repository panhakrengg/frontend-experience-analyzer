import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const nextLinkLegacyRule: RuleDefinition = {
  id: "next-link-legacy",
  name: "Next.js Legacy Link Nested Anchor",
  category: "accessibility",
  defaultSeverity: "low",
  description: "Next.js 13+ automatically renders an <a> tag inside <Link>. Nesting an explicit <a> tag inside <Link> without legacyBehavior causes invalid HTML and duplicate semantics.",
  recommendation: "Remove the nested <a> tag and place attributes directly on <Link href='...'>.",
  standards: [
    {
      authority: "Next.js",
      name: "Link Component",
      criterion: "Nested Anchor Upgrade",
      url: "https://nextjs.org/docs/messages/invalid-new-link-with-extra-anchor",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (element.tagName !== "a") continue;
      const html = element.htmlSnippet ?? "";

      if (html.includes("<a") && html.includes("href=") && html.includes("<a ")) {
        findings.push({
          title: "Nested <a> tag detected inside Next.js Link",
          description: "An anchor tag is nested inside another anchor tag, causing invalid HTML structure.",
          element,
          evidence: [
            { property: "htmlSnippet", actual: html },
          ],
          recommendation: "Remove the inner <a> tag and apply styles/attributes directly to <Link>.",
          confidence: 0.85,
        });
      }
    }

    return findings;
  },
};
