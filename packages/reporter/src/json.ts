import type { AnalysisResult } from "@frontend-experience-analyzer/core";

export function generateJsonReport(result: AnalysisResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}
