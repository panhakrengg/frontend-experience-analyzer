import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, InteractionTrace, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  consoleErrorRule,
  dropdownKeyboardOperableRule,
  focusLostAfterInteractionRule,
  formMissingValidationFeedbackRule,
  modalEscapeCloseRule,
  networkErrorRule,
  unresponsiveButtonRule,
} from "@frontend-experience-analyzer/rules";

const desktopViewport: Viewport = { name: "desktop", width: 1440, height: 900 };

function createSnapshot(trace: Partial<InteractionTrace> = {}, elements: ElementReference[] = []): PageSnapshot {
  return {
    url: "http://localhost:4000/app",
    title: "Interaction Test Page",
    lang: "en",
    viewport: desktopViewport,
    elements,
    interactionTrace: {
      consoleErrors: [],
      networkFailures: [],
      interactions: [],
      ...trace,
    },
    metrics: {
      elementCount: elements.length,
      interactiveElementCount: elements.filter((e) => e.interactive).length,
      documentHeight: 900,
    },
  };
}

describe("Phase 5 Interaction Rules", () => {
  describe("consoleErrorRule", () => {
    it("flags JavaScript console errors", () => {
      const snapshot = createSnapshot({
        consoleErrors: [
          { type: "error", text: "TypeError: Cannot read property 'map' of undefined", location: "bundle.js:42" },
        ],
      });
      const findings = consoleErrorRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("JavaScript runtime error"));
    });

    it("passes when no console errors are captured", () => {
      const snapshot = createSnapshot({ consoleErrors: [] });
      const findings = consoleErrorRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("networkErrorRule", () => {
    it("flags failed network requests", () => {
      const snapshot = createSnapshot({
        networkFailures: [
          { url: "http://localhost:4000/api/checkout", method: "POST", status: 500, failed: true, errorText: "Internal Server Error" },
        ],
      });
      const findings = networkErrorRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Failed network request: POST"));
    });

    it("passes when no network requests fail", () => {
      const snapshot = createSnapshot({ networkFailures: [] });
      const findings = networkErrorRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("modalEscapeCloseRule", () => {
    it("flags modal that fails to close on Escape key", () => {
      const snapshot = createSnapshot(
        {
          interactions: [
            {
              type: "modal-escape",
              targetSelector: "dialog#auth-modal",
              success: false,
              errorMessage: "Modal remained open",
            },
          ],
        },
        [{ selector: "dialog#auth-modal", tagName: "dialog", visible: true, interactive: true }]
      );
      const findings = modalEscapeCloseRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("cannot be closed with Escape key"));
    });

    it("passes when modal closes successfully", () => {
      const snapshot = createSnapshot({
        interactions: [
          {
            type: "modal-escape",
            targetSelector: "dialog#auth-modal",
            success: true,
          },
        ],
      });
      const findings = modalEscapeCloseRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("unresponsiveButtonRule", () => {
    it("flags button with 0 mutations and unsuccessful action", () => {
      const snapshot = createSnapshot(
        {
          interactions: [
            {
              type: "click",
              targetSelector: "button#noop-action",
              success: false,
              mutationsCount: 0,
            },
          ],
        },
        [{ selector: "button#noop-action", tagName: "button", visible: true, interactive: true }]
      );
      const findings = unresponsiveButtonRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Button appears unresponsive on click"));
    });
  });

  describe("focusLostAfterInteractionRule", () => {
    it("flags focus dropping to body after modal dismissal", () => {
      const snapshot = createSnapshot({
        interactions: [
          {
            type: "modal-escape",
            targetSelector: "dialog#alert",
            success: true,
            focusAfter: "body",
          },
        ],
      });
      const findings = focusLostAfterInteractionRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Keyboard focus lost to <body>"));
    });
  });

  describe("formMissingValidationFeedbackRule", () => {
    it("flags invalid input missing error message link", () => {
      const snapshot = createSnapshot(
        {},
        [
          {
            selector: "input#email",
            tagName: "input",
            visible: true,
            interactive: true,
            attributes: { type: "email", required: "true", "aria-invalid": "true" },
          },
        ]
      );
      const findings = formMissingValidationFeedbackRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Invalid form input has no error message"));
    });

    it("passes invalid input when aria-describedby is present", () => {
      const snapshot = createSnapshot(
        {},
        [
          {
            selector: "input#email",
            tagName: "input",
            visible: true,
            interactive: true,
            attributes: { type: "email", required: "true", "aria-invalid": "true", "aria-describedby": "email-err" },
          },
        ]
      );
      const findings = formMissingValidationFeedbackRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("dropdownKeyboardOperableRule", () => {
    it("flags custom dropdown failing to expand on Enter", () => {
      const snapshot = createSnapshot({
        interactions: [
          {
            type: "dropdown-toggle",
            targetSelector: "div.custom-select",
            success: false,
            errorMessage: "Menu did not expand",
          },
        ],
      });
      const findings = dropdownKeyboardOperableRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Dropdown does not open with keyboard Enter key"));
    });
  });
});
