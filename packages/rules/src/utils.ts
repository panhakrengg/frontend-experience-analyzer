import type { ElementReference } from "@frontend-experience-analyzer/core";

export function isFormControl(element: ElementReference): boolean {
  return ["input", "select", "textarea"].includes(element.tagName);
}

export function hasAccessibleName(element: ElementReference): boolean {
  return Boolean(
    element.accessibleName?.trim() ||
      element.text?.trim() ||
      element.attributes?.["aria-label"]?.trim() ||
      element.attributes?.["aria-labelledby"]?.trim() ||
      element.attributes?.title?.trim() ||
      element.attributes?.alt?.trim() ||
      element.attributes?.value?.trim(),
  );
}
