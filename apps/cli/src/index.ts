#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { AIAdvisor } from "@frontend-experience-analyzer/ai-advisor";
import { BrowserSession, capturePageSnapshot, runJourney } from "@frontend-experience-analyzer/browser";
import {
  compareReports,
  evaluateGateThresholds,
  formatJunitXml,
  formatMarkdownSummary,
  formatSarif,
} from "@frontend-experience-analyzer/ci";
import {
  DEFAULT_VIEWPORTS,
  type AdvisorReport,
  type AnalysisResult,
  type Finding,
  type FindingCategory,
  type FindingSeverity,
  type JourneyConfig,
  type JourneyReport,
  type PageSnapshot,
  type RegressionDiff,
  type Viewport,
} from "@frontend-experience-analyzer/core";
import { detectFramework, SourceMapper, StaticCodeScanner } from "@frontend-experience-analyzer/framework-adapters";
import { loadConfig } from "@frontend-experience-analyzer/plugin-system";
import { writeReports } from "@frontend-experience-analyzer/reporter";
import { BUILTIN_RULES, createPageLoadFinding } from "@frontend-experience-analyzer/rules";
import { RulesEngine } from "@frontend-experience-analyzer/rules-engine";

const [, , command, ...args] = process.argv;

try {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
  } else if (command === "rules" || command === "list-rules") {
    await runRulesCommand(args);
  } else if (command === "scan") {
    await scan(args);
  } else if (command === "scan-code") {
    await runScanCodeCommand(args);
  } else if (command === "diff") {
    await runDiffCommand(args);
  } else if (command === "journey") {
    await runJourneyCommand(args);
  } else if (command === "dashboard") {
    await runDashboardCommand(args);
  } else if (command === "advisor") {
    await runAdvisorCommand(args);
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
  if (!urls.length && !options.journey) {
    throw new Error("Missing URL. Example: fea scan http://localhost:4000");
  }

  const viewports = resolveViewports(options);
  const outputDir = options.outputDir ?? "reports";
  const startedAt = new Date().toISOString();
  const totalSteps = urls.length * viewports.length * 4 + 3;
  let currentStep = 0;

  const log = (message: string): void => {
    currentStep += 1;
    console.log(`[${currentStep}/${totalSteps}] ${message}`);
  };

  const resolved = await loadConfig(options.config);
  if (resolved) {
    console.log(`[Config] Loaded configuration with ${resolved.customRules.length} custom design system & plugin rules.`);
  }

  const rulesEngine = new RulesEngine({
    includeRules: options["include-rules"] ? options["include-rules"].split(",") : undefined,
    excludeRules: options["exclude-rules"] ? options["exclude-rules"].split(",") : undefined,
    includeCategories: options["include-categories"]
      ? (options["include-categories"].split(",") as FindingCategory[])
      : undefined,
    excludeCategories: options["exclude-categories"]
      ? (options["exclude-categories"].split(",") as FindingCategory[])
      : undefined,
  });

  if (resolved?.customRules?.length) {
    rulesEngine.registerRules(resolved.customRules);
  }

  await mkdir(outputDir, { recursive: true });
  log("Opening browser");

  const session = new BrowserSession();
  const pages: PageSnapshot[] = [];
  const findings: Finding[] = [];
  const journeys: JourneyReport[] = [];

  try {
    for (const [urlIndex, url] of urls.entries()) {
      for (const viewport of viewports) {
        log(`Loading ${url} [${viewport.name}]`);
        const page = await session.newPage();
        try {
          const snapshot = await capturePageSnapshot(page, url, viewport, {
            outputDir: join(outputDir, "assets"),
            screenshotName: `screenshot-${urlIndex + 1}-${viewport.name}`,
            timeoutMs: Number(options.timeoutMs ?? 30_000),
            enableInteractions: options.interactions !== "false",
          });

          log(`Collected ${snapshot.metrics.elementCount} elements from ${snapshot.url} [${viewport.name}]`);
          pages.push(snapshot);

          log(`Running checks for ${snapshot.url} [${viewport.name}]`);
          const pageFindings = await rulesEngine.run(snapshot);
          findings.push(...pageFindings);

          log(`Captured screenshot for ${snapshot.url} [${viewport.name}]`);
        } catch (error) {
          findings.push(createPageLoadFinding(url, viewport, error));
          log(`Failed to scan ${url} [${viewport.name}]`);
        } finally {
          await page.close().catch(() => undefined);
        }
      }
    }

    if (options.sourceDir) {
      log(`Mapping findings to source files in ${options.sourceDir}`);
      const mapper = new SourceMapper(options.sourceDir);
      await mapper.index();
      mapper.mapFindings(findings);
      const mappedCount = findings.filter((f) => f.sourceLocation).length;
      log(`Mapped ${mappedCount}/${findings.length} findings to source code components`);
    }

    if (options.journey) {
      log(`Running user journey from ${options.journey}`);
      const journeyContent = await readFile(options.journey, "utf8");
      const config: JourneyConfig = JSON.parse(journeyContent);
      const journeyReport = await runJourney(session, config, {
        outputDir,
        timeoutMs: Number(options.timeoutMs ?? 15_000),
      });
      journeys.push(journeyReport);
      log(`Journey completed: ${journeyReport.status.toUpperCase()} (Friction score: ${journeyReport.frictionScore}/100)`);
    }

    let aiAdvisor: AdvisorReport | undefined;
    if (options.ai === "true" || options.advisor === "true") {
      log("Generating AI UX Advisor recommendations");
      const advisor = new AIAdvisor({
        provider: (options.provider as any) ?? "mock",
        apiKey: options.apiKey,
        model: options.model,
      });
      const tempResult: AnalysisResult = {
        target: urls.length ? urls.join(", ") : options.journey ?? "User Journey",
        startedAt,
        completedAt: new Date().toISOString(),
        pages,
        findings,
        journeys: journeys.length ? journeys : undefined,
      };
      const report = await advisor.advise(tempResult);
      aiAdvisor = report;
      log(`AI UX Advisor generated ${report.recommendations.length} recommendations (UX Maturity: ${report.uxMaturityScore}/100)`);
    }

    const result: AnalysisResult = {
      target: urls.length ? urls.join(", ") : options.journey ?? "User Journey",
      startedAt,
      completedAt: new Date().toISOString(),
      pages,
      findings,
      journeys: journeys.length ? journeys : undefined,
      aiAdvisor,
    };

    log("Writing reports");
    const { jsonPath, htmlPath } = await writeReports(result, { outputDir });

    let diff: RegressionDiff | undefined;
    if (options.baseline) {
      log(`Comparing with baseline: ${options.baseline}`);
      const baselineRaw = await readFile(options.baseline, "utf8");
      const baselineResult: AnalysisResult = JSON.parse(baselineRaw);
      diff = compareReports(baselineResult, result);
      log(`Regression diff: +${diff.newFindings.length} new, -${diff.resolvedFindings.length} resolved, ${diff.unchangedFindings.length} unchanged (${diff.scoreDelta >= 0 ? "+" : ""}${diff.scoreDelta} score delta)`);
      await writeFile(join(outputDir, "diff.json"), JSON.stringify(diff, null, 2), "utf8");
    }

    const formats = (options.format ?? "").split(",").map((f: string) => f.trim().toLowerCase());
    if (formats.includes("markdown") || formats.includes("md") || diff) {
      const summaryMd = formatMarkdownSummary(result, diff);
      const summaryPath = join(outputDir, "summary.md");
      await writeFile(summaryPath, summaryMd, "utf8");
      console.log(`Markdown summary: ${summaryPath}`);
    }
    if (formats.includes("junit") || formats.includes("xml")) {
      const junitXml = formatJunitXml(result);
      const junitPath = join(outputDir, "junit.xml");
      await writeFile(junitPath, junitXml, "utf8");
      console.log(`JUnit report: ${junitPath}`);
    }
    if (formats.includes("sarif")) {
      const sarifJson = formatSarif(result);
      const sarifPath = join(outputDir, "results.sarif");
      await writeFile(sarifPath, sarifJson, "utf8");
      console.log(`SARIF report: ${sarifPath}`);
    }

    log("Done");
    if (pages.length) console.log(`Pages scanned: ${pages.length}/${urls.length * viewports.length}`);
    if (journeys.length) console.log(`Journeys executed: ${journeys.length} (${journeys[0]?.frictionScore}/100 friction score)`);
    if (aiAdvisor) console.log(`AI Advisor: ${aiAdvisor.uxMaturityScore}/100 UX Maturity (${aiAdvisor.topQuickWins.length} quick wins)`);
    console.log(`Findings: ${findings.length}`);
    console.log(`JSON report: ${jsonPath}`);
    console.log(`HTML report: ${htmlPath}`);

    // Evaluate Quality Gate if options are provided
    if (options["fail-on"] || options["max-critical"] || options["max-high"] || options["fail-on-regression"]) {
      const gate = evaluateGateThresholds(result, diff, {
        failOn: options["fail-on"] as FindingSeverity,
        maxCritical: options["max-critical"] !== undefined ? Number(options["max-critical"]) : undefined,
        maxHigh: options["max-high"] !== undefined ? Number(options["max-high"]) : undefined,
        failOnRegression: options["fail-on-regression"] === "true",
      });

      console.log(`\n=== CI Quality Gate Assessment ===`);
      console.log(gate.summary);
      if (!gate.passed) {
        process.exitCode = 1;
      }
    }
  } finally {
    await session.close();
  }
}

async function runJourneyCommand(args: string[]): Promise<void> {
  const options = parseOptions(args);
  const journeyPath = args[0] && !args[0].startsWith("--") ? args[0] : options.config;

  if (!journeyPath) {
    throw new Error("Missing journey configuration file. Example: fea journey examples/login-journey.json");
  }

  const outputDir = options.outputDir ?? "reports";
  await mkdir(outputDir, { recursive: true });

  console.log(`Loading journey configuration: ${journeyPath}`);
  const journeyContent = await readFile(journeyPath, "utf8");
  const config: JourneyConfig = JSON.parse(journeyContent);

  const session = new BrowserSession();
  try {
    console.log(`Starting journey: "${config.name}" (${config.steps.length} steps)`);
    const journeyReport = await runJourney(session, config, {
      outputDir,
      timeoutMs: Number(options.timeoutMs ?? 15_000),
    });

    const result: AnalysisResult = {
      target: config.name,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      pages: [],
      findings: [],
      journeys: [journeyReport],
    };

    const { jsonPath, htmlPath } = await writeReports(result, { outputDir });

    console.log(`\nJourney Status: ${journeyReport.status === "passed" ? "PASSED ✅" : "FAILED ❌"}`);
    console.log(`Duration: ${(journeyReport.totalDurationMs / 1000).toFixed(2)}s`);
    console.log(`Friction Score: ${journeyReport.frictionScore}/100`);
    console.log(`Steps: ${journeyReport.summary.passedSteps}/${journeyReport.summary.totalSteps} passed`);
    console.log(`JSON report: ${jsonPath}`);
    console.log(`HTML report: ${htmlPath}`);
  } finally {
    await session.close();
  }
}

async function resolveUrls(
  args: string[],
  options: Record<string, string | undefined>,
): Promise<string[]> {
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

function resolveViewports(options: Record<string, string | undefined>): Viewport[] {
  if (options["all-viewports"] === "true") {
    return DEFAULT_VIEWPORTS;
  }

  if (options.viewports) {
    const names = options.viewports.split(",").map((s) => s.trim());
    return names.map(parseSingleViewport);
  }

  return [parseSingleViewport(options.viewport)];
}

function parseSingleViewport(name?: string): Viewport {
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

async function runDashboardCommand(args: string[]): Promise<void> {
  const { createServer } = await import("node:http");
  const { createReadStream, existsSync } = await import("node:fs");
  const options = parseOptions(args);
  const reportPath = args[0] && !args[0].startsWith("--") ? args[0] : options.report ?? "reports/report.json";
  const port = Number(options.port ?? 3000);

  if (!existsSync(reportPath)) {
    throw new Error(`Report file not found: ${reportPath}. Run a scan first with "fea scan <url>".`);
  }

  const dashboardDistDir = join(process.cwd(), "apps", "dashboard", "dist");
  const hasDist = existsSync(dashboardDistDir);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost:${port}`);

    if (url.pathname === "/report.json" || url.pathname === "/api/report") {
      res.writeHead(200, { "Content-Type": "application/json" });
      createReadStream(reportPath).pipe(res);
      return;
    }

    if (url.pathname.startsWith("/reports/")) {
      const assetPath = join(process.cwd(), url.pathname);
      if (existsSync(assetPath)) {
        createReadStream(assetPath).pipe(res);
        return;
      }
    }

    if (hasDist) {
      let filePath = join(dashboardDistDir, url.pathname === "/" ? "index.html" : url.pathname.slice(1));
      if (!existsSync(filePath)) {
        filePath = join(dashboardDistDir, "index.html");
      }
      const ext = filePath.split(".").pop();
      const contentType = ext === "js" ? "text/javascript" : ext === "css" ? "text/css" : "text/html";
      res.writeHead(200, { "Content-Type": contentType });
      createReadStream(filePath).pipe(res);
      return;
    }

    // Fallback: serve reports/report.html
    const htmlReportPath = reportPath.replace(/\.json$/, ".html");
    if (existsSync(htmlReportPath)) {
      res.writeHead(200, { "Content-Type": "text/html" });
      createReadStream(htmlReportPath).pipe(res);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  server.listen(port, () => {
    console.log(`\n🚀 Frontend Experience Dashboard running at: http://localhost:${port}`);
    console.log(`📊 Serving report data from: ${reportPath}`);
    console.log(`Press Ctrl+C to stop.\n`);
  });
}

async function runAdvisorCommand(args: string[]): Promise<void> {
  const { existsSync } = await import("node:fs");
  const options = parseOptions(args);
  const reportPath = args[0] && !args[0].startsWith("--") ? args[0] : options.report ?? "reports/report.json";

  if (!existsSync(reportPath)) {
    throw new Error(`Report file not found: ${reportPath}. Run a scan first with "fea scan <url>".`);
  }

  console.log(`Loading report from: ${reportPath}`);
  const reportContent = await readFile(reportPath, "utf8");
  const analysis: AnalysisResult = JSON.parse(reportContent);

  const advisor = new AIAdvisor({
    provider: (options.provider as any) ?? "mock",
    apiKey: options.apiKey,
    model: options.model,
  });

  console.log(`Analyzing ${analysis.findings.length} findings with AI UX Advisor (${advisor["provider"].name})...\n`);
  const report = await advisor.advise(analysis);

  console.log(`=== AI UX Advisor Assessment ===`);
  console.log(`UX Maturity Score: ${report.uxMaturityScore}/100\n`);
  console.log(`Executive Summary:`);
  console.log(`${report.executiveSummary}\n`);

  console.log(`Top ${report.topQuickWins.length} Recommended Quick Wins:`);
  for (const win of report.topQuickWins) {
    console.log(`\n#${win.priority}. [${win.category.toUpperCase()}] ${win.title}`);
    console.log(`   Impact: ${win.impact} | Effort: ${win.effort}`);
    console.log(`   Rationale: ${win.rationale}`);
    if (win.suggestedFix) {
      console.log(`   Suggested Code Fix (${win.suggestedFix.language}):`);
      console.log(`   - Before:\n${win.suggestedFix.beforeCode.split("\n").map((l: string) => "     " + l).join("\n")}`);
      console.log(`   + After:\n${win.suggestedFix.afterCode.split("\n").map((l: string) => "     " + l).join("\n")}`);
    }
  }

  // Update report with AI advisor and rewrite
  analysis.aiAdvisor = report;
  const outputDir = options.outputDir ?? "reports";
  await writeReports(analysis, { outputDir });
  console.log(`\nUpdated reports with AI recommendations in ${outputDir}/.`);
}

async function runDiffCommand(args: string[]): Promise<void> {
  const { existsSync } = await import("node:fs");
  const options = parseOptions(args);
  const baselinePath = args[0] && !args[0].startsWith("--") ? args[0] : options.baseline ?? "reports/baseline.json";
  const currentPath = args[1] && !args[1].startsWith("--") ? args[1] : options.current ?? "reports/report.json";

  if (!existsSync(baselinePath)) {
    throw new Error(`Baseline report not found: ${baselinePath}`);
  }
  if (!existsSync(currentPath)) {
    throw new Error(`Current report not found: ${currentPath}`);
  }

  console.log(`Comparing baseline: ${baselinePath}`);
  console.log(`With current scan:  ${currentPath}\n`);

  const baselineRaw = await readFile(baselinePath, "utf8");
  const currentRaw = await readFile(currentPath, "utf8");
  const baseline: AnalysisResult = JSON.parse(baselineRaw);
  const current: AnalysisResult = JSON.parse(currentRaw);

  const diff = compareReports(baseline, current);

  console.log(`=== Regression Diff Analysis ===`);
  console.log(`🚨 New Issues (Regressions):  ${diff.newFindings.length}`);
  console.log(`✨ Resolved Issues (Fixed):   ${diff.resolvedFindings.length}`);
  console.log(`📌 Unchanged Issues:          ${diff.unchangedFindings.length}`);
  console.log(`📈 Score Delta:               ${diff.scoreDelta >= 0 ? "+" : ""}${diff.scoreDelta} pts\n`);

  if (diff.newFindings.length > 0) {
    console.log(`Top New Issues Introduced:`);
    for (const f of diff.newFindings.slice(0, 5)) {
      console.log(` - [${f.severity.toUpperCase()}] ${f.title} (${f.ruleId ?? "custom"})`);
    }
    console.log();
  }

  const outputDir = options.outputDir ?? "reports";
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "diff.json"), JSON.stringify(diff, null, 2), "utf8");
  const summaryMd = formatMarkdownSummary(current, diff);
  await writeFile(join(outputDir, "diff-summary.md"), summaryMd, "utf8");
  console.log(`Diff report written to ${join(outputDir, "diff.json")}`);
  console.log(`Markdown summary written to ${join(outputDir, "diff-summary.md")}`);
}

async function runScanCodeCommand(args: string[]): Promise<void> {
  const options = parseOptions(args);
  let targetDir = args[0] && !args[0].startsWith("--") ? args[0] : options.sourceDir;
  if (!targetDir) {
    if (existsSync("./src")) {
      targetDir = "./src";
    } else if (existsSync("./app")) {
      targetDir = "./app";
    } else if (existsSync("./pages")) {
      targetDir = "./pages";
    } else {
      targetDir = ".";
    }
  }
  const outputDir = options.outputDir ?? "reports";

  console.log(`\n🔍 Static Source Code Scanner`);
  console.log(`Scanning directory: ${targetDir} for accessibility, security, framework, and design tokens...\n`);

  const resolved = await loadConfig(options.config);
  const scanner = new StaticCodeScanner(targetDir, {
    approvedColors: resolved?.config.designSystem?.approvedColors,
    approvedFonts: resolved?.config.designSystem?.approvedFonts,
    forbiddenClasses: resolved?.config.designSystem?.forbiddenClasses,
    forbidInlineStyles: resolved?.config.designSystem?.forbidInlineStyles,
    onProgress: (file, index, total, issuesCount) => {
      const status = issuesCount === 0 ? "✅ 0 issues" : `⚠️ ${issuesCount} violation(s)`;
      console.log(` [${index}/${total}] ${file} -> ${status}`);
    },
  });

  const result = await scanner.scan();

  // Run AI UX advisor if requested
  if (options.ai) {
    console.log("Generating AI recommendations for source findings...");
    const advisor = new AIAdvisor({
      provider: (options.provider as any) ?? "mock",
      apiKey: options.apiKey,
      model: options.model,
    });
    result.aiAdvisor = await advisor.advise(result);
  }

  await mkdir(outputDir, { recursive: true });
  const { jsonPath, htmlPath } = await writeReports(result, { outputDir });

  // Group findings by category
  const a11yCount = result.findings.filter((f) => f.category === "accessibility").length;
  const secCount = result.findings.filter((f) => f.category === "security").length;
  const perfCount = result.findings.filter((f) => f.category === "performance").length;
  const dsCount = result.findings.filter((f) => f.category === "visual" || f.category === "ux").length;

  const filesCount = result.pages[0]?.metrics.elementCount ?? 0;
  const criticalCount = result.findings.filter((f) => f.severity === "critical").length;
  const highCount = result.findings.filter((f) => f.severity === "high").length;
  const mediumCount = result.findings.filter((f) => f.severity === "medium").length;
  const lowCount = result.findings.filter((f) => f.severity === "low").length;

  // Calculate Best Practice Compliance Score
  const deduction = criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2;
  const complianceScore = Math.max(0, 100 - deduction);

  console.log(`\n========================================================`);
  console.log(`         FRONTEND BEST PRACTICE & CODE AUDIT            `);
  console.log(`========================================================`);
  console.log(`📁 Files Scanned:       ${filesCount}`);
  console.log(`🎯 Compliance Score:    ${complianceScore}/100 ${complianceScore >= 90 ? "🟢 (Excellent)" : complianceScore >= 70 ? "🟡 (Needs Attention)" : "🔴 (Poor)"}`);
  console.log(`🚨 Total Violations:    ${result.findings.length} (Critical: ${criticalCount}, High: ${highCount}, Med: ${mediumCount}, Low: ${lowCount})\n`);

  console.log(`--- Best Practice Standards Compliance ---`);
  console.log(` ${a11yCount === 0 ? "✅" : "⚠️"} Accessibility (WCAG 2.2):     ${a11yCount === 0 ? "PASSED (0 violations)" : `${a11yCount} issue(s) found`}`);
  console.log(` ${secCount === 0 ? "✅" : "❌"} Security (OWASP Top 10):       ${secCount === 0 ? "PASSED (0 vulnerabilities)" : `${secCount} vulnerability(ies) found`}`);
  console.log(` ${perfCount === 0 ? "✅" : "⚠️"} Framework Performance:        ${perfCount === 0 ? "PASSED (0 issues)" : `${perfCount} optimization(s) found`}`);
  console.log(` ${dsCount === 0 ? "✅" : "⚠️"} Design System Governance:     ${dsCount === 0 ? "PASSED (Compliant)" : `${dsCount} token/class issue(s)`}`);

  if (result.findings.length > 0) {
    console.log(`\n--- Detailed Rule Violations & Fixes ---`);
    for (let i = 0; i < result.findings.length; i++) {
      const f = result.findings[i]!;
      const loc = f.sourceLocation ? `${f.sourceLocation.file}:${f.sourceLocation.line}` : "source";
      const std = f.standards?.[0]?.authority ? `[${f.standards[0].authority}] ` : "";
      console.log(`\n#${i + 1}. [${f.severity.toUpperCase()}] ${std}${f.title}`);
      console.log(`   📍 Location:       ${loc}`);
      console.log(`   📝 Description:    ${f.description}`);
      console.log(`   💡 Recommendation: ${f.recommendation}`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`📄 Full JSON Report: ${jsonPath}`);
  console.log(`🌐 Full HTML Report: ${htmlPath}`);
  console.log(`========================================================\n`);
}

async function runRulesCommand(args: string[]): Promise<void> {
  const options = parseOptions(args);
  const filterCat = args[0] && !args[0].startsWith("--") ? args[0].toLowerCase() : options.category?.toLowerCase();

  const resolved = await loadConfig(options.config);
  const allRules = [...BUILTIN_RULES, ...(resolved?.customRules ?? [])];

  const filteredRules = filterCat
    ? allRules.filter((r) => r.category.toLowerCase().includes(filterCat) || r.id.toLowerCase().includes(filterCat))
    : allRules;

  console.log(`\n========================================================================================`);
  console.log(`             FRONTEND EXPERIENCE ANALYZER - DIAGNOSTIC RULE REGISTRY                    `);
  console.log(`========================================================================================`);
  console.log(`Total Active Diagnostic Rules: ${filteredRules.length}\n`);

  const categories = Array.from(new Set(filteredRules.map((r) => r.category)));

  for (const cat of categories) {
    const rulesInCat = filteredRules.filter((r) => r.category === cat);
    console.log(`\n📂 [${cat.toUpperCase()}] (${rulesInCat.length} rules):`);
    console.log(`----------------------------------------------------------------------------------------`);
    for (const r of rulesInCat) {
      const auth = r.standards?.[0]?.authority ? `[${r.standards[0].authority}] ` : "";
      console.log(` • ID:       ${r.id}`);
      console.log(`   Name:     ${r.name}`);
      console.log(`   Severity: [${r.defaultSeverity.toUpperCase()}] | Standard: ${auth || "Standard"}`);
      console.log(`   Purpose:  ${r.description}`);
      console.log(`   Fix:      ${r.recommendation}`);
      console.log();
    }
  }

  console.log(`========================================================================================\n`);
}

function printHelp(): void {
  console.log(`Frontend Experience Analyzer

Usage:
  fea scan <url> [options]
  fea scan-code [dir] [options]
  fea rules [category]
  fea scan --urls urls.txt [options]
  fea diff <baseline.json> <current.json> [options]
  fea journey <config-file.json> [options]
  fea dashboard [report.json] [options]
  fea advisor [report.json] [options]

Commands:
  scan                           Scan one or multiple URLs across viewports (Browser Runtime)
  scan-code                      Statically scan frontend source code files directly (Offline)
  rules                          List all diagnostic rules and standards (WCAG, OWASP, React, etc.)
  diff                           Compare baseline vs current scan report
  journey                        Run a multi-step user journey workflow
  dashboard                      Launch interactive web dashboard viewer
  advisor                        Run AI UX Advisor analysis on a scan report


Options:
  --url <url>                    Single URL to scan
  --urls <path>                  Text file with one URL per line
  --baseline <path>              Compare scan against baseline report (regression diff)
  --fail-on <severity>           Fail CI gate if issues match/exceed severity (critical|high|medium|low)
  --max-critical <n>             Maximum tolerated critical issues before failing gate
  --max-high <n>                 Maximum tolerated high issues before failing gate
  --fail-on-regression           Fail gate if any new regression finding is introduced
  --format <formats>             Comma-separated export formats (markdown,junit,sarif)
  --journey <path>               Execute a multi-step journey JSON file
  --ai                           Enable AI UX Advisor during scan (default: false)
  --provider <name>              AI provider: mock, gemini, or openai (default: mock)
  --apiKey <key>                 API key for Gemini or OpenAI
  --viewport <name>              mobile, tablet, desktop, or WIDTHxHEIGHT (default: desktop)
  --viewports <list>             Comma-separated viewports (e.g. mobile,desktop)
  --all-viewports                Scan all presets (mobile, tablet, desktop)
  --outputDir <path>             Report output directory (default: reports)
  --timeoutMs <ms>               Page load / step timeout (default: 30000)
  --interactions <bool>          Enable dynamic interaction checks (default: true)
  --port <number>                Dashboard server port (default: 3000)
  --sourceDir <path>             Local source code directory for component mapping (e.g. ./src)
  --projectDir <path>            Root project directory containing package.json
  --include-rules <ids>          Comma-separated rule IDs to run
  --exclude-rules <ids>          Comma-separated rule IDs to skip
  --include-categories <cats>    Comma-separated categories to run
  --exclude-categories <cats>    Comma-separated categories to skip

Examples:
  fea scan http://localhost:4000 --fail-on critical --format markdown,sarif
  fea scan http://localhost:4000 --baseline reports/baseline.json --fail-on-regression
  fea diff reports/baseline.json reports/report.json
  fea journey examples/login-journey.json
  fea dashboard reports/report.json
`);
}
