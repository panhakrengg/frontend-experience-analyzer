import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const insecureFormActionRule: RuleDefinition = {
  id: "insecure-form-action",
  name: "Insecure Form Action or Method",
  category: "security",
  defaultSeverity: "critical",
  description: "Forms containing password or sensitive authentication fields must submit via HTTPS using the POST method to prevent credentials from being exposed in browser history, server access logs, and HTTP referrers.",
  recommendation: "Ensure form specifies method='POST' and action='https://...'.",
  standards: [
    {
      authority: "OWASP",
      name: "Authentication Cheat Sheet",
      criterion: "Credential Transport Security",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
    },
    {
      authority: "OWASP",
      name: "Top 10 Web Application Security Risks",
      criterion: "A04:2021 Insecure Design & Transport",
      url: "https://owasp.org/Top10/A04_2021-Insecure_Design/",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "form") continue;
      const action = el.attributes?.action?.toLowerCase() ?? "";
      const method = (el.attributes?.method?.toLowerCase() ?? "get").trim();
      const html = el.htmlSnippet?.toLowerCase() ?? "";

      const hasPasswordField = html.includes('type="password"') || html.includes("type='password'");

      if (hasPasswordField && method === "get") {
        findings.push({
          title: "Password form submits via insecure HTTP GET method",
          description: "A login/credential form is configured to submit using the GET method, appending user passwords directly into the URL query parameters.",
          element: el,
          evidence: [
            { property: "method", actual: "GET", expected: "POST" },
            { property: "hasPassword", actual: true },
          ],
          recommendation: "Change form method to method='POST' and ensure CSRF protection tokens are included.",
          confidence: 1,
        });
      }

      if (action.startsWith("http://")) {
        findings.push({
          title: "Form action targets unencrypted HTTP endpoint",
          description: `Form action endpoint "${action}" transmits user data over cleartext HTTP, vulnerable to MITM interception.`,
          element: el,
          evidence: [
            { property: "action", actual: action, expected: "https://" },
          ],
          recommendation: "Update form action URL to use secure HTTPS.",
          confidence: 1,
        });
      }
    }

    return findings;
  },
};
