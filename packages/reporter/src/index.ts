import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { AnalysisResult } from "@frontend-experience-analyzer/core";
import { generateHtmlReport } from "./html.js";
import { generateJsonReport } from "./json.js";

export * from "./html.js";
export * from "./json.js";
export * from "./summary.js";

export interface WriteReportsOptions {
  outputDir: string;
}

export interface WrittenReports {
  jsonPath: string;
  htmlPath: string;
}

export async function writeReports(
  result: AnalysisResult,
  options: WriteReportsOptions,
): Promise<WrittenReports> {
  const outputDir = options.outputDir;
  await mkdir(outputDir, { recursive: true });

  const jsonPath = join(outputDir, "report.json");
  const htmlPath = join(outputDir, "report.html");

  await Promise.all([
    writeFile(jsonPath, generateJsonReport(result), "utf8"),
    writeFile(htmlPath, generateHtmlReport(result), "utf8"),
  ]);

  return { jsonPath, htmlPath };
}
