import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import {
  inlineEventHandlerXssRule,
  insecureFormActionRule,
  insecureHrefJavascriptRule,
  subresourceIntegrityRule,
  unprotectedSensitiveInputRule,
} from "@frontend-experience-analyzer/rules";

const desktopViewport: Viewport = { name: "desktop", width: 1440, height: 900 };

function createSnapshot(elements: ElementReference[] = []): PageSnapshot {
  return {
    url: "https://example.com",
    title: "OWASP Security Test",
    lang: "en",
    viewport: desktopViewport,
    elements,
    metrics: { elementCount: elements.length, interactiveElementCount: elements.filter((e) => e.interactive).length, documentHeight: 900 },
  };
}

describe("OWASP Frontend Security Rules", () => {
  describe("subresourceIntegrityRule (OWASP A08)", () => {
    it("flags external CDN script missing integrity hash", () => {
      const snapshot = createSnapshot([
        {
          selector: "script.cdn",
          tagName: "script",
          visible: false,
          interactive: false,
          attributes: { src: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js" },
        },
      ]);
      const findings = subresourceIntegrityRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("Subresource Integrity (SRI)"));
    });

    it("passes external script with valid integrity attribute", () => {
      const snapshot = createSnapshot([
        {
          selector: "script.cdn",
          tagName: "script",
          visible: false,
          interactive: false,
          attributes: {
            src: "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js",
            integrity: "sha384-abc123hash",
            crossorigin: "anonymous",
          },
        },
      ]);
      const findings = subresourceIntegrityRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 0);
    });
  });

  describe("insecureFormActionRule (OWASP A04/A05)", () => {
    it("flags password form submitting via GET method", () => {
      const snapshot = createSnapshot([
        {
          selector: "form#login-form",
          tagName: "form",
          visible: true,
          interactive: true,
          attributes: { method: "get", action: "/api/login" },
          htmlSnippet: '<form id="login-form" method="get"><input type="password" name="pwd"/></form>',
        },
      ]);
      const findings = insecureFormActionRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("insecure HTTP GET method"));
    });
  });

  describe("inlineEventHandlerXssRule (OWASP A03 / XSS)", () => {
    it("flags element with inline onclick handler", () => {
      const snapshot = createSnapshot([
        {
          selector: "button#cta",
          tagName: "button",
          visible: true,
          interactive: true,
          attributes: { onclick: "doCheckout()" },
        },
      ]);
      const findings = inlineEventHandlerXssRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes('Dangerous inline "onclick" event handler'));
    });
  });

  describe("insecureHrefJavascriptRule (OWASP DOM XSS)", () => {
    it("flags anchor tag with javascript: pseudo-protocol", () => {
      const snapshot = createSnapshot([
        {
          selector: "a.action",
          tagName: "a",
          visible: true,
          interactive: true,
          attributes: { href: "javascript:void(0)" },
          text: "Click Here",
        },
      ]);
      const findings = insecureHrefJavascriptRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("dangerous 'javascript:' pseudo-protocol"));
    });
  });

  describe("unprotectedSensitiveInputRule (OWASP Payment / PCI-DSS)", () => {
    it("flags credit card input missing autocomplete='cc-number'", () => {
      const snapshot = createSnapshot([
        {
          selector: "input#creditcard",
          tagName: "input",
          visible: true,
          interactive: true,
          attributes: { id: "creditcard", name: "creditCardNumber", type: "text" },
        },
      ]);
      const findings = unprotectedSensitiveInputRule.evaluate({ snapshot }) as any[];
      assert.equal(findings.length, 1);
      assert.ok(findings[0].title.includes("cc-number"));
    });
  });
});
