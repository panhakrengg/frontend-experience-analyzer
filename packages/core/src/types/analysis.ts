import type { AdvisorReport } from "./advisor.js";
import type { Finding } from "./finding.js";
import type { JourneyReport } from "./journey.js";
import type { PageSnapshot } from "./page.js";

export interface AnalysisResult {
  target: string;

  startedAt: string;

  completedAt: string;

  pages: PageSnapshot[];

  findings: Finding[];

  journeys?: JourneyReport[];

  aiAdvisor?: AdvisorReport;
}