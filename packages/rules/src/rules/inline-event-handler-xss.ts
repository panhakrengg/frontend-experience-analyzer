import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

const DANGEROUS_ON_EVENTS = [
  "onclick",
  "onerror",
  "onload",
  "onmouseover",
  "onfocus",
  "onblur",
  "onchange",
  "onsubmit",
  "onkeydown",
];

export const inlineEventHandlerXssRule: RuleDefinition = {
  id: "inline-event-handler-xss",
  name: "Dangerous Inline JavaScript Event Handler",
  category: "security",
  defaultSeverity: "high",
  description: "Inline event handler attributes (onclick, onerror, onload) violate strict Content Security Policy (CSP) directives and significantly increase vulnerability to Reflected and DOM-based Cross-Site Scripting (XSS).",
  recommendation: "Attach event listeners programmatically in JavaScript (addEventListener) instead of inline HTML attributes.",
  standards: [
    {
      authority: "OWASP",
      name: "Cross-Site Scripting (XSS) Prevention Cheat Sheet",
      criterion: "No Inline JavaScript Handlers",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
    },
    {
      authority: "OWASP",
      name: "Top 10 Web Application Security Risks",
      criterion: "A03:2021 Injection",
      url: "https://owasp.org/Top10/A03_2021-Injection/",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (!el.attributes) continue;
      for (const [attrName, attrVal] of Object.entries(el.attributes)) {
        const lowerName = attrName.toLowerCase();
        if (DANGEROUS_ON_EVENTS.includes(lowerName)) {
          findings.push({
            title: `Dangerous inline "${attrName}" event handler detected (<${el.tagName}>)`,
            description: `Element defines raw inline executable script ("${attrVal?.slice(0, 40)}${attrVal && attrVal.length > 40 ? "..." : ""}"), violating CSP and increasing XSS risk.`,
            element: el,
            evidence: [
              { property: attrName, actual: attrVal, expected: "Use addEventListener in JS" },
            ],
            recommendation: "Remove inline event handler attribute and register listener via addEventListener in an external script.",
            confidence: 1,
          });
        }
      }
    }

    return findings;
  },
};
