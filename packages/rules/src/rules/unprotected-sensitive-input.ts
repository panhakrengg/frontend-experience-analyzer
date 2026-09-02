import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const unprotectedSensitiveInputRule: RuleDefinition = {
  id: "unprotected-sensitive-input",
  name: "Unprotected Payment / Sensitive Field Configuration",
  category: "security",
  defaultSeverity: "medium",
  description: "Credit card number (cc-number), security code (cc-csc), and sensitive financial inputs must define appropriate autocomplete attributes, inputmode='numeric', and pattern constraints to prevent credential misfills and unauthorized browser caching.",
  recommendation: "Add autocomplete='cc-number' and inputmode='numeric' to card number inputs.",
  standards: [
    {
      authority: "OWASP",
      name: "Payment Gateway Integration Cheat Sheet",
      criterion: "Client-side Cardholder Data Protection",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Payment_Gateway_Integration_Cheat_Sheet.html",
    },
    {
      authority: "PCI-DSS",
      name: "Payment Card Industry Data Security Standard",
      criterion: "Requirement 3: Protect Stored Cardholder Data",
      url: "https://www.pcisecuritystandards.org/",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "input") continue;
      const name = (el.attributes?.name || el.attributes?.id || "").toLowerCase();
      const autocomplete = (el.attributes?.autocomplete || "").toLowerCase();
      const inputmode = (el.attributes?.inputmode || "").toLowerCase();

      const isCreditCardField = name.includes("cardnumber") || name.includes("cc-num") || name.includes("creditcard");

      if (isCreditCardField && !autocomplete.includes("cc-number")) {
        findings.push({
          title: "Credit card input field missing 'autocomplete=\"cc-number\"'",
          description: `Input element "${name}" appears to collect payment card data but lacks the standardized 'cc-number' autocomplete attribute.`,
          element: el,
          evidence: [
            { property: "name", actual: name },
            { property: "autocomplete", actual: autocomplete || null, expected: "cc-number" },
            { property: "inputmode", actual: inputmode || null, expected: "numeric" },
          ],
          recommendation: "Add autocomplete='cc-number' and inputmode='numeric' to ensure secure payment autofill.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
