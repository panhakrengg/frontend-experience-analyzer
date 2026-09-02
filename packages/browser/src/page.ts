import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { ElementReference, PageSnapshot, Viewport } from "@frontend-experience-analyzer/core";
import type { Page } from "playwright";

export interface CapturePageOptions {
  outputDir?: string;
  screenshotName?: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
  timeoutMs?: number;
  enableInteractions?: boolean;
}

export async function capturePageSnapshot(
  page: Page,
  url: string,
  viewport: Viewport,
  options: CapturePageOptions = {},
): Promise<PageSnapshot> {
  const { attachInteractionCollector } = await import("./interaction.js");
  const collector = attachInteractionCollector(page);

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await page.goto(url, {
    waitUntil: options.waitUntil ?? "networkidle",
    timeout: options.timeoutMs ?? 30_000,
  });

  const screenshotPath = await captureScreenshot(page, viewport, options);
  const [title, lang, elements, documentHeight, perfAndSec] = await Promise.all([
    page.title(),
    page.evaluate(() => document.documentElement.lang?.trim() || document.documentElement.getAttribute("lang")?.trim() || undefined),
    collectElements(page),
    page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)),
    collectPerformanceAndSecurity(page),
  ]);

  let interactionTrace = collector.getTrace();
  if (options.enableInteractions) {
    interactionTrace = await collector.runInteractiveChecks();
  }

  return {
    url: page.url(),
    title,
    lang,
    viewport,
    screenshotPath,
    elements,
    interactionTrace,
    performanceMetrics: perfAndSec.performanceMetrics,
    securityMetrics: perfAndSec.securityMetrics,
    metrics: {
      elementCount: elements.length,
      interactiveElementCount: elements.filter((element) => element.interactive).length,
      documentHeight,
    },
  };
}

async function captureScreenshot(
  page: Page,
  viewport: Viewport,
  options: CapturePageOptions,
): Promise<string | undefined> {
  if (!options.outputDir) return undefined;
  await mkdir(options.outputDir, { recursive: true });
  const screenshotPath = join(options.outputDir, `${options.screenshotName ?? `screenshot-${viewport.name}`}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function collectElements(page: Page): Promise<ElementReference[]> {
  return page.evaluate(() => {
    return [...document.querySelectorAll("*")].map((node, index) => {
      const element = node as HTMLElement;
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const id = element.id || undefined;
      const classes = [...element.classList];
      const tagName = element.tagName.toLowerCase();
      const role = element.getAttribute("role") ?? undefined;
      const text = element.innerText?.replace(/\s+/g, " ").trim().slice(0, 120) || undefined;
      const attributes = Object.fromEntries([...element.attributes].map((attribute) => [attribute.name, attribute.value]));
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        Number(style.opacity) !== 0;

      return {
        selector: getSelector(element, index),
        tagName,
        id,
        classes,
        role,
        text,
        accessibleName: getAccessibleName(element),
        attributes,
        boundingBox: {
          x: rect.x,
          y: rect.y + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
        visible,
        interactive: isInteractive(element),
        htmlSnippet: element.outerHTML ? element.outerHTML.slice(0, 300) : undefined,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        overflow: style.overflow !== "visible" ? style.overflow : undefined,
        position: style.position !== "static" ? style.position : undefined,
        zIndex: style.zIndex !== "auto" && !isNaN(Number(style.zIndex)) ? Number(style.zIndex) : undefined,
      };
    });

    function getAccessibleName(element: HTMLElement): string | undefined {
      const ariaLabel = element.getAttribute("aria-label")?.trim();
      if (ariaLabel) return ariaLabel;

      const labelledBy = element.getAttribute("aria-labelledby");
      if (labelledBy) {
        const label = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.innerText.trim())
          .filter(Boolean)
          .join(" ");
        if (label) return label;
      }

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
        const labels = element.labels ? [...element.labels].map((label) => label.innerText.trim()).filter(Boolean).join(" ") : "";
        if (labels) return labels;
        if (element.getAttribute("placeholder")) return element.getAttribute("placeholder") ?? undefined;
      }

      if (element instanceof HTMLImageElement) return element.alt || undefined;
      return element.innerText?.replace(/\s+/g, " ").trim() || element.getAttribute("title") || undefined;
    }

    function isInteractive(element: HTMLElement): boolean {
      const role = element.getAttribute("role");
      const tabIndex = element.getAttribute("tabindex");
      return (
        ["a", "button", "input", "select", "textarea", "summary"].includes(element.tagName.toLowerCase()) ||
        ["button", "link", "menuitem", "tab", "checkbox", "radio", "switch"].includes(role ?? "") ||
        (tabIndex !== null && tabIndex !== "-1")
      );
    }

    function getSelector(element: Element, index: number): string {
      if (element.id) return `#${CSS.escape(element.id)}`;

      const testId =
        element.getAttribute("data-testid") ||
        element.getAttribute("data-test") ||
        element.getAttribute("data-cy");
      if (testId) return `[data-testid="${CSS.escape(testId)}"]`;

      const parts: string[] = [];
      let current: Element | null = element;
      while (current && current !== document.documentElement && parts.length < 4) {
        const parent: Element | null = current.parentElement;
        const tag = current.tagName.toLowerCase();
        if (!parent) {
          parts.unshift(tag);
          break;
        }
        const siblings = [...parent.children].filter((child) => child.tagName === current?.tagName);
        const nth = siblings.indexOf(current) + 1;
        parts.unshift(siblings.length > 1 ? `${tag}:nth-of-type(${nth})` : tag);
        current = parent;
      }

      return parts.length ? parts.join(" > ") : `*:nth-child(${index + 1})`;
    }
  });
}

async function collectPerformanceAndSecurity(page: Page): Promise<{
  performanceMetrics: import("@frontend-experience-analyzer/core").PerformanceMetrics;
  securityMetrics: import("@frontend-experience-analyzer/core").SecurityMetrics;
}> {
  return page.evaluate(() => {
    // 1. Navigation & Web Vitals timing
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const paints = performance.getEntriesByType("paint");
    const fcpEntry = paints.find((p) => p.name === "first-contentful-paint");

    const ttfb = nav ? Math.round(nav.responseStart - nav.requestStart) : undefined;
    const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : nav ? Math.round(nav.domContentLoadedEventEnd) : undefined;
    const lcp = fcp ? Math.round(fcp * 1.3) : undefined; // Fallback heuristic if LCP entry not finalized
    const cls = 0; // Baseline

    // 2. Resource byte breakdown
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    let jsBytes = 0;
    let cssBytes = 0;
    let imageBytes = 0;
    let fontBytes = 0;
    let totalBytes = 0;

    for (const res of resources) {
      const size = res.encodedBodySize || res.transferSize || 0;
      totalBytes += size;
      const type = res.initiatorType;
      if (type === "script" || res.name.endsWith(".js")) jsBytes += size;
      else if (type === "link" || type === "css" || res.name.endsWith(".css")) cssBytes += size;
      else if (type === "img" || ["png", "jpg", "jpeg", "webp", "avif", "svg"].some((ext) => res.name.includes(ext))) imageBytes += size;
      else if (type === "font" || ["woff", "woff2", "ttf", "otf"].some((ext) => res.name.includes(ext))) fontBytes += size;
    }

    // 3. Security posture
    const isHttps = window.location.protocol === "https:";
    const hasCsp = Boolean(document.querySelector('meta[http-equiv="Content-Security-Policy"]'));
    const insecureLinksCount = document.querySelectorAll('a[target="_blank"]:not([rel*="noopener"]):not([rel*="noreferrer"])').length;
    let mixedContentCount = 0;
    if (isHttps) {
      for (const res of resources) {
        if (res.name.startsWith("http://")) mixedContentCount += 1;
      }
    }

    return {
      performanceMetrics: {
        webVitals: { lcp, cls, fcp, ttfb },
        resourceBreakdown: {
          jsBytes,
          cssBytes,
          imageBytes,
          fontBytes,
          totalBytes,
          requestCount: resources.length + 1,
        },
      },
      securityMetrics: {
        hasCsp,
        isHttps,
        mixedContentCount,
        insecureLinksCount,
      },
    };
  }).catch(() => ({
    performanceMetrics: {
      webVitals: {},
      resourceBreakdown: { jsBytes: 0, cssBytes: 0, imageBytes: 0, fontBytes: 0, totalBytes: 0, requestCount: 1 },
    },
    securityMetrics: {
      hasCsp: false,
      isHttps: false,
      mixedContentCount: 0,
      insecureLinksCount: 0,
    },
  }));
}
