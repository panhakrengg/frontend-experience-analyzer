import type { RuleContext, RuleDefinition, RuleFindingInput } from "@frontend-experience-analyzer/core";

export const nonButtonKeyboardRule: RuleDefinition = {
  id: "non-button-keyboard",
  name: "Keyboard Focusable Control",
  category: "accessibility",
  defaultSeverity: "high",
  description: "Non-interactive HTML elements (such as <div> or <span>) with ARIA button or link roles must be focusable using tabindex so keyboard users can navigate to and activate them.",
  recommendation: "Use a native <button> or <a> element instead, or add tabindex=\"0\" and keydown handlers (Enter/Space) to the custom element.",
  standards: [
    {
      authority: "W3C",
      name: "WCAG 2.1",
      criterion: "2.1.1 Keyboard",
      url: "https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html",
    },
  ],
  wcag: ["2.1.1"],
  evaluate: (context: RuleContext): RuleFindingInput[] => {
    const findings: RuleFindingInput[] = [];
    const interactiveRoles = ["button", "link", "menuitem", "tab", "switch", "checkbox"];
    const nativeInteractiveTags = ["a", "button", "input", "select", "textarea", "summary"];

    for (const element of context.snapshot.elements) {
      if (!element.visible) continue;

      const isNative = nativeInteractiveTags.includes(element.tagName);
      const hasCustomInteractiveRole = element.role && interactiveRoles.includes(element.role);
      const hasOnClick = "onclick" in (element.attributes ?? {});

      if (!isNative && (hasCustomInteractiveRole || hasOnClick)) {
        const tabIndex = element.attributes?.tabindex;
        const isKeyboardFocusable = tabIndex !== undefined && tabIndex !== "-1";

        if (!isKeyboardFocusable) {
          findings.push({
            title: `Non-native interactive <${element.tagName}> is not keyboard focusable`,
            description: `A custom interactive element with role="${element.role || "clickable"}" has no tabindex attribute, making it unreachable for keyboard users.`,
            element,
            evidence: [
              {
                property: "tabindex",
                actual: tabIndex ?? "missing",
                expected: "0 or replace with native <button>/<a>",
              },
              {
                property: "role",
                actual: element.role ?? "none",
              },
            ],
            recommendation: `Replace <${element.tagName}> with a native <button> element, or add tabindex="0" and key event listeners.`,
            confidence: 0.9,
          });
        }
      }
    }

    return findings;
  },
};
