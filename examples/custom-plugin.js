/**
 * Example Custom Frontend Experience Analyzer Plugin
 */

export const brandButtonRule = {
  id: "brand-button-required",
  name: "Require Brand Button Component",
  category: "visual",
  defaultSeverity: "medium",
  description: "Raw <button> elements must use the company brand button class or component instead of unstyled browser buttons.",
  recommendation: "Add class='btn-brand' or use <BrandButton />.",
  standards: [
    {
      authority: "Acme Corp",
      name: "Design System Governance",
      criterion: "Button Guidelines",
      url: "https://acme.internal/design-system/button",
    },
  ],
  evaluate: (context) => {
    const findings = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "button") continue;
      const cls = el.attributes?.class || el.attributes?.className || "";

      if (!cls.includes("btn-brand") && !cls.includes("brand-button")) {
        findings.push({
          title: "Raw button missing required 'btn-brand' class",
          description: `Button "${el.text || el.selector}" lacks company design system styling.`,
          element: el,
          evidence: [
            { property: "class", actual: cls || null, expected: "btn-brand" },
          ],
          recommendation: "Apply the 'btn-brand' class or use the <BrandButton /> component.",
          confidence: 1,
        });
      }
    }

    return findings;
  },
};

export default {
  name: "acme-corp-brand-rules",
  rules: [brandButtonRule],
};
