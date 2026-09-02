import type { AdvisorReport, AnalysisResult } from "@frontend-experience-analyzer/core";

export interface AIProvider {
  name: string;
  generateReport(analysis: AnalysisResult): Promise<AdvisorReport>;
}
