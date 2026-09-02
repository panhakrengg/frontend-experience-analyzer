import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const unoptimizedImagesRule: RuleDefinition = {
  id: "unoptimized-image",
  name: "Unoptimized Raster Image",
  category: "performance",
  defaultSeverity: "medium",
  description: "Images loaded as legacy uncompressed PNG or JPG without modern WebP/AVIF formats or loading='lazy' attribute.",
  recommendation: "Convert images to modern formats (.webp, .avif) and add loading='lazy' and decoding='async' to below-the-fold images.",
  standards: [
    {
      authority: "Google",
      name: "Image Optimization",
      criterion: "Modern WebP/AVIF Formats & Lazy Loading",
      url: "https://web.dev/articles/serve-images-webp",
    },
  ],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];

    for (const el of context.snapshot.elements) {
      if (el.tagName !== "img") continue;
      const src = el.attributes?.src?.toLowerCase() ?? "";
      const isLegacyRaster = (src.endsWith(".png") || src.endsWith(".jpg") || src.endsWith(".jpeg")) && !src.includes("data:");
      const isMissingLazy = !el.attributes?.loading;

      // Check if image is below the fold and missing loading="lazy"
      const box = el.boundingBox;
      const isBelowFold = box && box.y > context.snapshot.viewport.height;

      if (isLegacyRaster && isBelowFold && isMissingLazy) {
        findings.push({
          title: "Below-the-fold raster image missing loading='lazy'",
          description: `Image "${src.split("/").pop() || src}" is located below viewport fold (${box.y}px) but loaded eagerly without modern compression.`,
          element: el,
          evidence: [
            { property: "src", actual: src },
            { property: "loading", actual: null, expected: "lazy" },
            { property: "yPosition", actual: `${box.y}px`, expected: `> ${context.snapshot.viewport.height}px` },
          ],
          recommendation: "Add loading='lazy' and decoding='async' to the <img> tag, and serve in WebP/AVIF format.",
          confidence: 0.9,
        });
      }
    }

    return findings;
  },
};
