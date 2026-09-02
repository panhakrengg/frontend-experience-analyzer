import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  DEFAULT_VIEWPORTS,
  type JourneyConfig,
  type JourneyReport,
  type JourneyStep,
  type JourneyStepResult,
  type JourneySummary,
  type Viewport,
} from "@frontend-experience-analyzer/core";
import type { Page } from "playwright";
import { BrowserSession } from "./browser.js";
import { attachInteractionCollector } from "./interaction.js";

export interface RunJourneyOptions {
  outputDir?: string;
  timeoutMs?: number;
  viewport?: Viewport;
}

export function calculateFrictionScore(summary: JourneySummary, totalDurationMs: number): number {
  if (summary.totalSteps === 0) return 100;
  if (summary.failedSteps > 0) {
    const successRatio = summary.passedSteps / summary.totalSteps;
    const base = Math.round(successRatio * 60);
    return Math.max(0, base - summary.consoleErrorCount * 5 - summary.networkFailureCount * 10);
  }

  let score = 100;
  // Penalty for console errors
  score -= summary.consoleErrorCount * 5;
  // Penalty for network failures
  score -= summary.networkFailureCount * 10;
  // Penalty for slow journeys (> 6s)
  if (totalDurationMs > 6000) {
    const extraSeconds = (totalDurationMs - 6000) / 1000;
    score -= Math.min(20, Math.round(extraSeconds * 2));
  }

  return Math.max(0, Math.min(100, score));
}

export async function runJourney(
  session: BrowserSession,
  config: JourneyConfig,
  options: RunJourneyOptions = {},
): Promise<JourneyReport> {
  const page: Page = await session.newPage();
  const collector = attachInteractionCollector(page);
  const viewport = options.viewport ?? resolveJourneyViewport(config.viewport);

  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const journeySlug = slugify(config.name);
  const assetsDir = options.outputDir ? join(options.outputDir, "assets") : undefined;
  if (assetsDir) {
    await mkdir(assetsDir, { recursive: true });
  }

  const stepResults: JourneyStepResult[] = [];
  const journeyStart = Date.now();
  let hasFailed = false;

  try {
    for (let index = 0; index < config.steps.length; index++) {
      const step = config.steps[index]!;
      if (hasFailed) {
        stepResults.push({
          step,
          status: "skipped",
          durationMs: 0,
        });
        continue;
      }

      const stepStart = Date.now();
      let stepStatus: "passed" | "failed" = "passed";
      let errorMessage: string | undefined;
      let screenshotPath: string | undefined;

      try {
        await executeStep(page, step, options.timeoutMs ?? 15_000);

        if (assetsDir) {
          screenshotPath = join(assetsDir, `journey-${journeySlug}-step-${index + 1}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {
            screenshotPath = undefined;
          });
        }
      } catch (error) {
        stepStatus = "failed";
        hasFailed = true;
        errorMessage = error instanceof Error ? error.message : String(error);

        if (assetsDir) {
          screenshotPath = join(assetsDir, `journey-${journeySlug}-step-${index + 1}-failed.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {
            screenshotPath = undefined;
          });
        }
      }

      const durationMs = Date.now() - stepStart;
      stepResults.push({
        step,
        status: stepStatus,
        durationMs,
        screenshotPath,
        errorMessage,
      });
    }
  } finally {
    await page.close().catch(() => undefined);
  }

  const totalDurationMs = Date.now() - journeyStart;
  const trace = collector.getTrace();
  const passedSteps = stepResults.filter((s) => s.status === "passed").length;
  const failedSteps = stepResults.filter((s) => s.status === "failed").length;

  const summary: JourneySummary = {
    totalSteps: config.steps.length,
    passedSteps,
    failedSteps,
    consoleErrorCount: trace.consoleErrors.length,
    networkFailureCount: trace.networkFailures.length,
  };

  const frictionScore = calculateFrictionScore(summary, totalDurationMs);

  return {
    name: config.name,
    description: config.description,
    status: failedSteps === 0 ? "passed" : "failed",
    totalDurationMs,
    frictionScore,
    stepResults,
    summary,
  };
}

async function executeStep(page: Page, step: JourneyStep, timeoutMs: number): Promise<void> {
  const timeout = step.timeoutMs ?? timeoutMs;

  switch (step.action) {
    case "goto":
      if (!step.target) throw new Error("Step 'goto' requires a target URL");
      await page.goto(step.target, { timeout, waitUntil: "domcontentloaded" });
      break;

    case "click":
      if (!step.target) throw new Error("Step 'click' requires a target selector");
      await page.click(step.target, { timeout });
      break;

    case "fill":
      if (!step.target) throw new Error("Step 'fill' requires a target selector");
      await page.fill(step.target, step.value ?? "", { timeout });
      break;

    case "select":
      if (!step.target) throw new Error("Step 'select' requires a target selector");
      await page.selectOption(step.target, step.value ?? "", { timeout });
      break;

    case "press":
      if (step.target) {
        await page.press(step.target, step.value ?? "Enter", { timeout });
      } else {
        await page.keyboard.press(step.value ?? "Enter");
      }
      break;

    case "wait":
      await page.waitForTimeout(Number(step.value) || 500);
      break;

    case "assert-visible":
      if (!step.target) throw new Error("Step 'assert-visible' requires a target selector");
      await page.waitForSelector(step.target, { state: "visible", timeout });
      break;

    case "assert-text": {
      if (!step.target) throw new Error("Step 'assert-text' requires a target selector");
      const element = await page.waitForSelector(step.target, { state: "visible", timeout });
      const text = await element.textContent();
      if (!text?.includes(step.value ?? "")) {
        throw new Error(`Expected element "${step.target}" to contain "${step.value}", but got "${text?.trim()}"`);
      }
      break;
    }

    case "screenshot":
      // Handled automatically per step
      break;

    default:
      throw new Error(`Unknown step action: ${(step as any).action}`);
  }
}

function resolveJourneyViewport(name?: string): Viewport {
  if (!name) return DEFAULT_VIEWPORTS.find((v) => v.name === "desktop") ?? DEFAULT_VIEWPORTS[0]!;
  const preset = DEFAULT_VIEWPORTS.find((v) => v.name === name);
  if (preset) return preset;

  const match = /^(\d+)x(\d+)$/.exec(name);
  if (match) {
    return { name, width: Number(match[1]), height: Number(match[2]) };
  }
  return DEFAULT_VIEWPORTS[0]!;
}

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 30);
}
