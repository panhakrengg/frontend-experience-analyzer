import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const sensitiveInputAutocompleteRule: RuleDefinition = {
  id: "sensitive-input-autocomplete",
  name: "Sensitive Form Field Missing Proper Autocomplete",
  category: "security",
  defaultSeverity: "medium",
  description: "Password and credential inputs should declare explicit autocomplete values ('current-password', 'new-password', 'one-time-code') to prevent browser credential misfills and password manager confusion.",
  recommendation: "Add autocomplete='current-password' or autocomplete='new-password' to password inputs.",
  standards: [
    {
      authority: "OWASP / W3C",
      name: "Authentication Best Practices",
      criterion: "Credential Autocomplete Attributes",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "input") continue;
      const type = el.attributes?.type?.toLowerCase();
      const autocomplete = el.attributes?.autocomplete?.toLowerCase();

      if (type === "password" && (!autocomplete || autocomplete === "on")) {
        findings.push({
          title: "Password input missing explicit autocomplete attribute",
          description: "Password field does not specify whether it is 'current-password' or 'new-password', degrading password manager autofill precision.",
          element: el,
          evidence: [
            { property: "type", actual: "password" },
            { property: "autocomplete", actual: autocomplete ?? null, expected: "current-password or new-password" },
          ],
          recommendation: "Add autocomplete='current-password' for login forms or autocomplete='new-password' for registration/reset forms.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
