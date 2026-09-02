import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const insecureHrefJavascriptRule: RuleDefinition = {
  id: "insecure-href-javascript",
  name: "Dangerous javascript: Pseudo-Protocol in Link",
  category: "security",
  defaultSeverity: "high",
  description: "Links using href='javascript:...' pseudo-protocol execute arbitrary script upon click, create accessible keyboard navigation anti-patterns, and introduce Cross-Site Scripting (XSS) vectors.",
  recommendation: "Use a <button> element with a JavaScript click handler instead of an <a href='javascript:...'> link.",
  standards: [
    {
      authority: "OWASP",
      name: "DOM based XSS Prevention Cheat Sheet",
      criterion: "Avoid javascript: Pseudo-Protocols",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html",
    },
    {
      authority: "W3C / WCAG",
      name: "Understanding Success Criterion 2.1.1: Keyboard",
      criterion: "Semantic Button Controls",
      url: "https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "a") continue;
      const href = el.attributes?.href?.trim().toLowerCase() ?? "";

      if (href.startsWith("javascript:")) {
        findings.push({
          title: "Anchor tag uses dangerous 'javascript:' pseudo-protocol",
          description: `Link "${el.text || href}" executes inline code via href, which violates secure coding practices.`,
          element: el,
          evidence: [
            { property: "href", actual: el.attributes?.href, expected: "Valid URL or <button> element" },
          ],
          recommendation: "Replace <a href='javascript:...'> with a <button type='button'> and attach a standard event listener.",
          confidence: 1,
        });
      }
    }

    return findings;
  },
};
