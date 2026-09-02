import type { ElementReference, FindingCategory } from "@frontend-experience-analyzer/core";

export function generateFindingId(
  ruleId: string,
  category: FindingCategory,
  pageUrl?: string,
  element?: ElementReference,
): string {
  const cleanCategory = category.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const cleanRule = ruleId.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  const pageSlug = pageUrl ? slugify(pageUrl) : "page";
  
  if (element) {
    const target = element.id ? `#${element.id}` : element.selector;
    const elementSlug = slugify(target);
    return `${cleanCategory}-${cleanRule}-${pageSlug}-${elementSlug}`;
  }

  return `${cleanCategory}-${cleanRule}-${pageSlug}`;
}

function slugify(input: string): string {
  return input
    .replace(/^https?:\/\//i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}
