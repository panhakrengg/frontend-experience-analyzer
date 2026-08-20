#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { BrowserSession, capturePageSnapshot } from "@frontend-experience-analyzer/browser";
import {
  DEFAULT_VIEWPORTS,
  type AnalysisResult,
  type ElementReference,
  type Finding,
  type FindingCategory,
  type FindingSeverity,
  type PageSnapshot,
  type Viewport,
} from "@frontend-experience-analyzer/core";

let currentRenderPages: PageSnapshot[] = [];

const [, , command, ...args] = process.argv;

try {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
  } else if (command === "scan") {
    await scan(args);
  } else {
    console.error(`Unknown command: ${command}`);
    printHelp();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

async function scan(args: string[]): Promise<void> {
  const options = parseOptions(args);
  const urls = await resolveUrls(args, options);
  if (!urls.length) {
    throw new Error("Missing URL. Example: fea scan http://localhost:4000");
  }

  const viewport = resolveViewport(options.viewport);
  const outputDir = options.outputDir ?? "reports";
  const startedAt = new Date().toISOString();
  const totalSteps = urls.length * 4 + 3;
  let currentStep = 0;

  const log = (message: string): void => {
    currentStep += 1;
    console.log(`[${currentStep}/${totalSteps}] ${message}`);
  };

  await mkdir(outputDir, { recursive: true });
  log(`Opening browser`);

  const session = new BrowserSession();
  const pages: PageSnapshot[] = [];
  const findings: Finding[] = [];

  try {
    for (const [index, url] of urls.entries()) {
      log(`Loading ${url}`);
      const page = await session.newPage();
      try {
        const snapshot = await capturePageSnapshot(page, url, viewport, {
          outputDir: join(outputDir, "assets"),
          screenshotName: `screenshot-${index + 1}-${viewport.name}`,
          timeoutMs: Number(options.timeoutMs ?? 30_000),
        });

        log(`Collected ${snapshot.metrics.elementCount} elements from ${snapshot.url}`);
        pages.push(snapshot);

        log(`Running checks for ${snapshot.url}`);
        findings.push(...runBasicRules(snapshot));

        log(`Captured screenshot for ${snapshot.url}`);
      } catch (error) {
        findings.push(createPageLoadFinding(url, viewport, error));
        log(`Failed to scan ${url}`);
      } finally {
        await page.close().catch(() => undefined);
      }
    }

    const result: AnalysisResult = {
      target: urls.join(", "),
      startedAt,
      completedAt: new Date().toISOString(),
      pages,
      findings,
    };

    const reportPath = join(outputDir, "report.json");
    const htmlReportPath = join(outputDir, "report.html");
    log(`Writing reports`);
    await Promise.all([
      writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8"),
      writeFile(htmlReportPath, renderHtmlReport(result), "utf8"),
    ]);

    log(`Done`);
    console.log(`Pages scanned: ${pages.length}/${urls.length}`);
    console.log(`Findings: ${findings.length}`);
    console.log(`JSON report: ${reportPath}`);
    console.log(`HTML report: ${htmlReportPath}`);
  } finally {
    await session.close();
  }
}

async function resolveUrls(args: string[], options: Record<string, string | undefined>): Promise<string[]> {
  const positionalUrl = args[0] && !args[0].startsWith("--") ? args[0] : undefined;
  const urls = new Set<string>();

  if (positionalUrl) urls.add(positionalUrl);

  if (options.url) urls.add(options.url);

  if (options.urls) {
    const content = await readFile(options.urls, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const url = line.trim();
      if (url && !url.startsWith("#")) urls.add(url);
    }
  }

  return [...urls];
}

function renderHtmlReport(result: AnalysisResult): string {
  currentRenderPages = result.pages;
  const counts = countFindings(result.findings);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Frontend Experience Analyzer Report</title>
  <style>
    :root {
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1f2933;
      --muted: #64748b;
      --line: #d7dce3;
      --critical: #9f1239;
      --high: #c2410c;
      --medium: #a16207;
      --low: #2563eb;
      --info: #475569;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
    header, main { max-width: 1180px; margin: 0 auto; padding: 24px; }
    header { padding-top: 32px; }
    h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.2; letter-spacing: 0; }
    h2 { margin: 32px 0 12px; font-size: 18px; letter-spacing: 0; }
    h3 { margin: 0; font-size: 16px; letter-spacing: 0; }
    .meta { color: var(--muted); font-size: 14px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-top: 20px; }
    .tile, .finding, .page-card, .empty { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; }
    .tile { padding: 16px; }
    .tile strong { display: block; font-size: 24px; line-height: 1.1; }
    .tile span { color: var(--muted); font-size: 13px; }
    .page-card { padding: 16px; margin-bottom: 16px; width: 100%; overflow: hidden; }
    .screenshot-frame { border: 1px solid var(--line); border-radius: 8px; background: #eef1f5; overflow: hidden; width: 100%; }
    .screenshot-wrap { position: relative; width: 100%; aspect-ratio: var(--shot-width) / var(--shot-height); }
    .screenshot-wrap img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
    .overlay { position: absolute; border: 3px solid var(--medium); background: rgba(161, 98, 7, 0.12); border-radius: 4px; pointer-events: auto; }
    .overlay.high, .overlay.critical { border-color: var(--high); background: rgba(194, 65, 12, 0.14); }
    .overlay.low, .overlay.info { border-color: var(--low); background: rgba(37, 99, 235, 0.12); }
    .marker { position: absolute; left: -10px; top: -10px; width: 24px; height: 24px; border-radius: 999px; color: #fff; background: currentColor; display: grid; place-items: center; font-size: 12px; font-weight: 700; }
    .marker span { color: white; }
    .finding { padding: 16px; margin-bottom: 12px; scroll-margin-top: 16px; }
    .finding-head { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .badge { color: white; border-radius: 999px; padding: 4px 8px; font-size: 12px; text-transform: uppercase; white-space: nowrap; }
    .critical { background: var(--critical); color: var(--critical); }
    .high { background: var(--high); color: var(--high); }
    .medium { background: var(--medium); color: var(--medium); }
    .low { background: var(--low); color: var(--low); }
    .info { background: var(--info); color: var(--info); }
    .badge.critical, .badge.high, .badge.medium, .badge.low, .badge.info { color: white; }
    .detail { color: var(--muted); font-size: 14px; }
    code { background: #eef1f5; border-radius: 4px; padding: 2px 5px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
    th, td { border-top: 1px solid var(--line); padding: 8px; text-align: left; vertical-align: top; }
    th { color: var(--muted); font-weight: 600; }
    .empty { padding: 24px; color: var(--muted); }
  </style>
</head>
<body>
  <header>
    <h1>Frontend Experience Analyzer Report</h1>
    <div class="meta">${escapeHtml(result.target)} · ${escapeHtml(result.startedAt)} to ${escapeHtml(result.completedAt)}</div>
    <section class="summary" aria-label="Finding summary">
      ${summaryTile("Pages", result.pages.length)}
      ${summaryTile("Total", result.findings.length)}
      ${summaryTile("High", counts.severity.high)}
      ${summaryTile("Medium", counts.severity.medium)}
      ${summaryTile("Accessibility", counts.category.accessibility)}
      ${summaryTile("Responsive", counts.category.responsive)}
      ${summaryTile("Visual", counts.category.visual)}
    </section>
  </header>
  <main>
    ${result.pages.length ? result.pages.map((page, index) => renderPageSection(page, result.findings, index)).join("\n") : `<section class="empty">No pages were scanned successfully.</section>`}
    <h2>All Findings</h2>
    ${result.findings.length ? result.findings.map((finding, index) => renderFinding(finding, index)).join("\n") : `<section class="empty">No findings were detected by the current rules.</section>`}
  </main>
</body>
</html>`;
}

function toPercent(value: number, finding: Finding): string {
  const width = finding.element?.boundingBox ? getFindingViewportWidth(finding) : 1;
  return Number(((value / width) * 100).toFixed(4)).toString();
}

function toPercentY(value: number, finding: Finding): string {
  const height = getFindingDocumentHeight(finding);
  return Number(((value / height) * 100).toFixed(4)).toString();
}

function toClampedWidthPercent(x: number, width: number, finding: Finding): string {
  const viewportWidth = getFindingViewportWidth(finding);
  const visibleX = Math.max(0, x);
  const visibleWidth = Math.max(0, Math.min(width, viewportWidth - visibleX));
  return Number(((visibleWidth / viewportWidth) * 100).toFixed(4)).toString();
}

function toClampedHeightPercent(y: number, height: number, finding: Finding): string {
  const documentHeight = getFindingDocumentHeight(finding);
  const visibleY = Math.max(0, y);
  const visibleHeight = Math.max(0, Math.min(height, documentHeight - visibleY));
  return Number(((visibleHeight / documentHeight) * 100).toFixed(4)).toString();
}

function getFindingViewportWidth(finding: Finding): number {
  const page = currentRenderPages.find((candidate) => candidate.url === finding.pageUrl);
  return page?.viewport.width ?? 1;
}

function getFindingDocumentHeight(finding: Finding): number {
  const page = currentRenderPages.find((candidate) => candidate.url === finding.pageUrl);
  return Math.max(page?.metrics.documentHeight ?? 1, page?.viewport.height ?? 1);
}


function renderPageSection(page: PageSnapshot, findings: Finding[], pageIndex: number): string {
  const pageFindings = findings.filter((finding) => finding.pageUrl === page.url && finding.element?.boundingBox);
  const screenshotPath = page.screenshotPath ? toReportRelativeAssetPath(page.screenshotPath) : undefined;
  const height = Math.max(page.metrics.documentHeight, page.viewport.height);

  return `<section class="page-card">
  <h2>Page ${pageIndex + 1}</h2>
  <p><strong>URL:</strong> ${escapeHtml(page.url)}</p>
  <p><strong>Title:</strong> ${escapeHtml(page.title || "Untitled")}</p>
  <p><strong>Viewport:</strong> ${page.viewport.width}x${page.viewport.height} (${escapeHtml(page.viewport.name)})</p>
  <p><strong>Elements:</strong> ${page.metrics.elementCount} total, ${page.metrics.interactiveElementCount} interactive</p>
  ${screenshotPath ? `<div class="screenshot-frame"><div class="screenshot-wrap" style="--shot-width:${page.viewport.width};--shot-height:${height}"><img src="${escapeAttribute(screenshotPath)}" alt="Captured screenshot for ${escapeAttribute(page.url)}">${pageFindings.map((finding) => renderOverlay(finding, findings.indexOf(finding))).join("")}</div></div>` : ""}
</section>`;
}

function renderOverlay(finding: Finding, index: number): string {
  const box = finding.element?.boundingBox;
  if (!box) return "";
  return `<a class="overlay ${finding.severity}" href="#finding-${index + 1}" title="${escapeAttribute(finding.title)}" style="left:${toPercent(box.x, finding)}%;top:${toPercentY(box.y, finding)}%;width:${toClampedWidthPercent(box.x, box.width, finding)}%;height:${toClampedHeightPercent(box.y, Math.max(box.height, 8), finding)}%"><span class="marker"><span>${index + 1}</span></span></a>`;
}

function renderFinding(finding: Finding, index: number): string {
  return `<article class="finding" id="finding-${index + 1}">
  <div class="finding-head">
    <h3>${index + 1}. ${escapeHtml(finding.title)}</h3>
    <span class="badge ${finding.severity}">${escapeHtml(finding.severity)}</span>
  </div>
  <p>${escapeHtml(finding.description)}</p>
  ${finding.recommendation ? `<p><strong>Recommendation:</strong> ${escapeHtml(finding.recommendation)}</p>` : ""}
  <p class="detail">Category: <code>${escapeHtml(finding.category)}</code> · Confidence: ${Math.round(finding.confidence * 100)}%${finding.pageUrl ? ` · Page: ${escapeHtml(finding.pageUrl)}` : ""}</p>
  ${finding.element ? `<p class="detail">Element: <code>${escapeHtml(finding.element.selector)}</code> · ${escapeHtml(finding.element.tagName)}</p>` : ""}
  ${finding.evidence.length ? renderEvidence(finding) : ""}
</article>`;
}

function renderEvidence(finding: Finding): string {
  return `<table aria-label="Evidence for ${escapeAttribute(finding.title)}">
  <thead><tr><th>Property</th><th>Actual</th><th>Expected</th></tr></thead>
  <tbody>${finding.evidence.map((item) => `<tr><td>${escapeHtml(item.property)}</td><td>${escapeHtml(formatValue(item.actual, item.unit))}</td><td>${escapeHtml(formatValue(item.expected, item.unit))}</td></tr>`).join("")}</tbody>
</table>`;
}

function runBasicRules(snapshot: PageSnapshot): Finding[] {
  const findings: Finding[] = [];

  if (!snapshot.title.trim()) {
    findings.push(pageFinding(snapshot, {
      id: "accessibility-page-title",
      category: "accessibility",
      severity: "medium",
      title: "Page is missing a title",
      description: "The page has no document title, which makes it harder to identify in browser tabs and assistive technology.",
      evidence: [{ property: "title", actual: snapshot.title, expected: "Non-empty page title" }],
      recommendation: "Add a concise, unique title for this page.",
      confidence: 1,
    }));
  }

  for (const element of snapshot.elements) {
    if (!element.visible) continue;

    if (element.tagName === "img" && !("alt" in (element.attributes ?? {}))) {
      findings.push(elementFinding(snapshot, element, {
        category: "accessibility",
        severity: "high",
        title: "Image is missing alt text",
        description: "An image does not include an alt attribute, so assistive technology cannot tell whether it is meaningful or decorative.",
        evidence: [{ property: "alt", actual: undefined, expected: "Text alternative or empty decorative alt" }],
        recommendation: "Add descriptive alt text for meaningful images or alt=\"\" for decorative images.",
        confidence: 0.95,
      }));
    }

    if (isFormControl(element) && !hasAccessibleName(element)) {
      findings.push(elementFinding(snapshot, element, {
        category: "accessibility",
        severity: "high",
        title: "Form control is missing a label",
        description: "A form field has no clear accessible label, making the field purpose ambiguous.",
        evidence: [{ property: "accessibleName", actual: element.accessibleName, expected: "Associated label or accessible name" }],
        recommendation: "Connect a label element to the field or use aria-label/aria-labelledby when a visible label is not possible.",
        confidence: 0.9,
      }));
    }

    if (element.interactive && !hasAccessibleName(element)) {
      findings.push(elementFinding(snapshot, element, {
        category: "accessibility",
        severity: "high",
        title: "Interactive control has no accessible name",
        description: "An interactive element is missing a usable text label for assistive technology.",
        evidence: [{ property: "accessibleName", actual: element.accessibleName, expected: "Visible text or accessible name" }],
        recommendation: "Provide visible text, aria-label, aria-labelledby, title, value, or associated label text.",
        confidence: 0.9,
      }));
    }

    if (element.interactive && element.boundingBox && (element.boundingBox.width < 24 || element.boundingBox.height < 24)) {
      findings.push(elementFinding(snapshot, element, {
        category: "responsive",
        severity: "medium",
        title: "Interactive target is too small",
        description: "An interactive element is smaller than the recommended minimum target size.",
        evidence: [
          { property: "width", actual: element.boundingBox.width, expected: 24, unit: "px" },
          { property: "height", actual: element.boundingBox.height, expected: 24, unit: "px" },
        ],
        recommendation: "Increase the clickable or tappable area to at least 24 by 24 CSS pixels.",
        confidence: 0.9,
      }));
    }

    if (element.boundingBox && element.boundingBox.x + element.boundingBox.width > snapshot.viewport.width + 1) {
      findings.push(elementFinding(snapshot, element, {
        category: "visual",
        severity: "medium",
        title: "Visible element overflows the viewport",
        description: "An element extends beyond the viewport width, which can create clipped content or horizontal scrolling.",
        evidence: [{ property: "rightEdge", actual: element.boundingBox.x + element.boundingBox.width, expected: snapshot.viewport.width, unit: "px" }],
        recommendation: "Use responsive sizing, wrapping, or a scroll container so the content remains reachable.",
        confidence: 0.9,
      }));
    }
  }

  return findings.map((finding, index) => ({ ...finding, id: `${finding.category}-${index + 1}` }));
}

function pageFinding(snapshot: PageSnapshot, finding: Omit<Finding, "pageUrl">): Finding {
  return { ...finding, pageUrl: snapshot.url };
}

function elementFinding(snapshot: PageSnapshot, element: ElementReference, finding: Omit<Finding, "id" | "pageUrl" | "element">): Finding {
  return {
    ...finding,
    id: "pending",
    pageUrl: snapshot.url,
    element,
  };
}

function createPageLoadFinding(url: string, viewport: Viewport, error: unknown): Finding {
  return {
    id: `page-load-${Date.now()}`,
    pageUrl: url,
    category: "ux",
    severity: "high",
    title: "Page could not be scanned",
    description: "The browser could not load this page within the scan settings.",
    evidence: [
      { property: "url", actual: url },
      { property: "viewport", actual: `${viewport.width}x${viewport.height}` },
      { property: "error", actual: error instanceof Error ? error.message : String(error) },
    ],
    recommendation: "Confirm the app is running, the URL is correct, and the page can finish loading in a browser.",
    confidence: 1,
  };
}

function isFormControl(element: ElementReference): boolean {
  return ["input", "select", "textarea"].includes(element.tagName);
}

function hasAccessibleName(element: ElementReference): boolean {
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

function toReportRelativeAssetPath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const assetsIndex = normalized.lastIndexOf("/assets/");
  if (assetsIndex >= 0) return normalized.slice(assetsIndex + 1);
  if (normalized.startsWith("assets/")) return normalized;
  return normalized;
}

function countFindings(findings: Finding[]): {
  severity: Record<FindingSeverity, number>;
  category: Record<FindingCategory, number>;
} {
  const severity: Record<FindingSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const category: Record<FindingCategory, number> = {
    accessibility: 0,
    ux: 0,
    responsive: 0,
    visual: 0,
    interaction: 0,
    performance: 0,
    security: 0,
  };

  for (const finding of findings) {
    severity[finding.severity] += 1;
    category[finding.category] += 1;
  }

  return { severity, category };
}

function summaryTile(label: string, value: number): string {
  return `<div class="tile"><strong>${value}</strong><span>${escapeHtml(label)}</span></div>`;
}

function formatValue(value: unknown, unit?: string): string {
  if (value === undefined || value === null) return "-";
  const formatted = typeof value === "number" ? Number(value.toFixed(2)).toString() : String(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

function parseOptions(args: string[]): Record<string, string | undefined> {
  const options: Record<string, string | undefined> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg || !arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = args[index + 1];
    options[key] = next && !next.startsWith("--") ? next : "true";
    if (next && !next.startsWith("--")) index += 1;
  }
  return options;
}

function resolveViewport(name?: string): Viewport {
  if (!name) return DEFAULT_VIEWPORTS.find((viewport) => viewport.name === "desktop") ?? DEFAULT_VIEWPORTS[0]!;

  const preset = DEFAULT_VIEWPORTS.find((viewport) => viewport.name === name);
  if (preset) return preset;

  const match = /^(\d+)x(\d+)$/.exec(name);
  if (!match) throw new Error(`Unknown viewport: ${name}`);

  return {
    name,
    width: Number(match[1]),
    height: Number(match[2]),
  };
}

function printHelp(): void {
  console.log(`Frontend Experience Analyzer

Usage:
  fea scan <url> [options]
  fea scan --urls urls.txt [options]

Options:
  --url <url>          Single URL to scan
  --urls <path>        Text file with one URL per line
  --viewport <name>    mobile, tablet, desktop, or WIDTHxHEIGHT
  --outputDir <path>   Report output directory
  --timeoutMs <ms>     Page load timeout

Examples:
  fea scan http://localhost:4000 --viewport desktop
  fea scan --urls urls.txt --viewport mobile
`);
}






