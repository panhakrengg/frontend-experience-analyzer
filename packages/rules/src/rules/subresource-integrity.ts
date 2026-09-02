import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const subresourceIntegrityRule: RuleDefinition = {
  id: "subresource-integrity",
  name: "Missing Subresource Integrity (SRI)",
  category: "security",
  defaultSeverity: "high",
  description: "External CDN scripts and stylesheets without 'integrity' and 'crossorigin' attributes can allow compromised third-party CDNs to inject malicious payloads into your application.",
  recommendation: "Add cryptographic SHA-384 or SHA-512 hashes to external scripts/styles: integrity='sha384-...' crossorigin='anonymous'.",
  standards: [
    {
      authority: "OWASP",
      name: "Software and Data Integrity Failures",
      criterion: "A08:2021 Subresource Integrity",
      url: "https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/",
    },
    {
      authority: "W3C",
      name: "Subresource Integrity (SRI)",
      criterion: "Cryptographic Digest Verification",
      url: "https://www.w3.org/TR/SRI/",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "script" && el.tagName !== "link") continue;
      const src = el.attributes?.src || el.attributes?.href || "";
      if (!src.startsWith("http://") && !src.startsWith("https://")) continue;

      // Check if it is an external host
      try {
        const pageHost = new URL(context.snapshot.url).hostname;
        const assetHost = new URL(src).hostname;
        if (pageHost === assetHost) continue;
      } catch {
        // Continue check
      }

      const hasIntegrity = Boolean(el.attributes?.integrity);
      const isExternalCDN =
        src.includes("cdnjs.cloudflare.com") ||
        src.includes("unpkg.com") ||
        src.includes("cdn.jsdelivr.net") ||
        src.includes("ajax.googleapis.com") ||
        src.includes("code.jquery.com") ||
        src.includes("stackpath.bootstrapcdn.com");

      if ((isExternalCDN || src.startsWith("http")) && !hasIntegrity) {
        findings.push({
          title: `External CDN resource loaded without Subresource Integrity (SRI) (${el.tagName})`,
          description: `Third-party asset "${src}" lacks an 'integrity' cryptographic hash and 'crossorigin="anonymous"' attribute.`,
          element: el,
          evidence: [
            { property: "src", actual: src },
            { property: "integrity", actual: null, expected: "sha384-... or sha512-..." },
          ],
          recommendation: "Add the 'integrity' hash and 'crossorigin=\"anonymous\"' attribute to the external CDN tag.",
          confidence: 0.95,
        });
      }
    }

    return findings;
  },
};
