import type { ConsoleMessage, InteractionEvent, InteractionTrace, NetworkEvent } from "@frontend-experience-analyzer/core";
import type { Page } from "playwright";

export interface InteractionCollector {
  getTrace(): InteractionTrace;
  runInteractiveChecks(): Promise<InteractionTrace>;
}

export function attachInteractionCollector(page: Page): InteractionCollector {
  const consoleErrors: ConsoleMessage[] = [];
  const networkFailures: NetworkEvent[] = [];
  const interactions: InteractionEvent[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push({
        type: "error",
        text: msg.text(),
        location: msg.location().url ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
      });
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push({
      type: "error",
      text: `Unhandled Exception: ${error.message}`,
      location: error.stack?.split("\n")[1]?.trim(),
    });
  });

  page.on("requestfailed", (request) => {
    networkFailures.push({
      url: request.url(),
      method: request.method(),
      status: 0,
      failed: true,
      errorText: request.failure()?.errorText ?? "Network request failed",
    });
  });

  page.on("response", (response) => {
    if (response.status() >= 400) {
      networkFailures.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status(),
        failed: true,
        errorText: `HTTP ${response.status()} ${response.statusText()}`,
      });
    }
  });

  const getTrace = (): InteractionTrace => ({
    consoleErrors: [...consoleErrors],
    networkFailures: [...networkFailures],
    interactions: [...interactions],
  });

  const runInteractiveChecks = async (): Promise<InteractionTrace> => {
    // 1. Modal Escape key test
    try {
      const openModal = await page.$("dialog[open], [role='dialog']:not([aria-hidden='true']), .modal.show, .modal.open");
      if (openModal) {
        const selector = await getElementSelector(page, openModal);
        const focusBefore = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());

        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);

        const isStillVisible = await openModal.isVisible().catch(() => false);
        const focusAfter = await page.evaluate(() => document.activeElement?.tagName.toLowerCase());

        interactions.push({
          type: "modal-escape",
          targetSelector: selector,
          success: !isStillVisible,
          errorMessage: isStillVisible ? "Modal remained visible after pressing Escape" : undefined,
          focusBefore,
          focusAfter,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore interaction probe errors
    }

    // 2. Custom dropdown keyboard toggle check
    try {
      const dropdown = await page.$("[aria-haspopup='true']:not(button), [role='combobox'], [role='menuitem'][aria-haspopup]");
      if (dropdown) {
        const selector = await getElementSelector(page, dropdown);
        const wasExpanded = await dropdown.getAttribute("aria-expanded");

        await dropdown.focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(150);

        const isExpanded = await dropdown.getAttribute("aria-expanded");
        const toggled = wasExpanded !== isExpanded || (isExpanded === "true");

        interactions.push({
          type: "dropdown-toggle",
          targetSelector: selector,
          success: toggled,
          errorMessage: !toggled ? "Dropdown did not expand on Enter key press" : undefined,
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore probe errors
    }

    return getTrace();
  };

  return { getTrace, runInteractiveChecks };
}

async function getElementSelector(page: Page, handle: any): Promise<string> {
  return page.evaluate((el: Element) => {
    if (el.id) return `#${el.id}`;
    if (el.className && typeof el.className === "string") {
      const firstClass = el.className.trim().split(/\s+/)[0];
      if (firstClass) return `${el.tagName.toLowerCase()}.${firstClass}`;
    }
    return el.tagName.toLowerCase();
  }, handle);
}
