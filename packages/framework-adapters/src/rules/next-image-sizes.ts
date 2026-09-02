import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const nextImageSizesRule: RuleDefinition = {
  id: "next-image-sizes",
  name: "Next.js Image Missing Sizes Attribute",
  category: "performance",
  defaultSeverity: "medium",
  description: "Next.js <Image> with fill mode or responsive layout requires a 'sizes' attribute to prevent downloading full-resolution images on mobile viewports.",
  recommendation: "Provide a responsive sizes attribute, e.g., sizes='(max-width: 768px) 100vw, 50vw'.",
  standards: [
    {
      authority: "Next.js",
      name: "Image Optimization",
      criterion: "Responsive Sizes",
      url: "https://nextjs.org/docs/app/api-reference/components/image#sizes",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const element of context.snapshot.elements) {
      if (element.tagName !== "img") continue;
      const isNextImage =
        element.attributes?.["data-nimg"] ||
        element.attributes?.src?.includes("/_next/image") ||
        (element.attributes?.decoding === "async" && element.attributes?.loading === "lazy");

      const hasFillStyle =
        element.attributes?.style?.includes("position: absolute") ||
        element.attributes?.style?.includes("position:absolute");

      const hasSizes = Boolean(element.attributes?.sizes);

      if (isNextImage && hasFillStyle && !hasSizes) {
        findings.push({
          title: "Next.js <Image fill> missing responsive 'sizes' prop",
          description: "An image rendered with fill styling lacks a sizes attribute, resulting in oversized image downloads on mobile devices.",
          element,
          evidence: [
            { property: "isNextImage", actual: true },
            { property: "sizes", actual: null, expected: "(max-width: 768px) 100vw, 50vw" },
          ],
          recommendation: "Add sizes='(max-width: 768px) 100vw, 50vw' to the <Image /> component.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
