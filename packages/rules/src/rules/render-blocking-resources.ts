import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const renderBlockingResourcesRule: RuleDefinition = {
  id: "render-blocking-resource",
  name: "Render-Blocking Synchronous Script",
  category: "performance",
  defaultSeverity: "medium",
  description: "Synchronous <script> tags without 'defer' or 'async' halt HTML parser execution and delay First Contentful Paint.",
  recommendation: "Add 'defer' or 'async' to external script tags or migrate scripts to module scripts (<script type='module'>).",
  standards: [
    {
      authority: "Google Lighthouse",
      name: "Eliminate Render-Blocking Resources",
      criterion: "Parser-blocking scripts",
      url: "https://web.dev/articles/render-blocking-resources",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "script") continue;
      const src = el.attributes?.src;
      if (!src) continue;

      const hasDefer = "defer" in (el.attributes ?? {});
      const hasAsync = "async" in (el.attributes ?? {});
      const isModule = el.attributes?.type === "module";

      if (!hasDefer && !hasAsync && !isModule) {
        findings.push({
          title: "Synchronous render-blocking script tag",
          description: `External script "${src.split("/").pop() || src}" halts document parsing and First Contentful Paint.`,
          element: el,
          evidence: [
            { property: "src", actual: src },
            { property: "defer", actual: false, expected: true },
            { property: "async", actual: false, expected: true },
          ],
          recommendation: "Add defer or async attribute: <script src='...' defer></script>.",
          confidence: 0.95,
        });
      }
    }

    return findings;
  },
};
