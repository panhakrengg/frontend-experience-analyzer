import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const vulnerableLinkTargetRule: RuleDefinition = {
  id: "vulnerable-link-target",
  name: "Vulnerable Target Blank Link (Reverse Tabnabbing)",
  category: "security",
  defaultSeverity: "high",
  description: "Links opening in a new tab (target='_blank') without rel='noopener' or rel='noreferrer' expose the parent window to window.opener phishing redirection attacks.",
  recommendation: "Add rel='noopener noreferrer' to all links with target='_blank'.",
  standards: [
    {
      authority: "OWASP",
      name: "Reverse Tabnabbing",
      criterion: "Target Blank Protection",
      url: "https://owasp.org/www-community/attacks/Reverse_Tabnabbing",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "a") continue;
      const target = el.attributes?.target;
      const rel = (el.attributes?.rel ?? "").toLowerCase();

      if (target === "_blank" && !rel.includes("noopener") && !rel.includes("noreferrer")) {
        findings.push({
          title: "target='_blank' link missing rel='noopener noreferrer'",
          description: `External link "${el.attributes?.href || el.text}" opens in a new tab without isolating window.opener.`,
          element: el,
          evidence: [
            { property: "target", actual: "_blank" },
            { property: "rel", actual: rel || null, expected: "noopener noreferrer" },
          ],
          recommendation: "Add rel='noopener noreferrer' to the anchor tag.",
          confidence: 1,
        });
      }
    }

    return findings;
  },
};
