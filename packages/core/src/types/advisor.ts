export interface AdvisorFix {
  title: string;
  description: string;
  language: string;
  beforeCode: string;
  afterCode: string;
}

export interface AdvisorRecommendation {
  priority: number;
  title: string;
  category: string;
  impact: "critical" | "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
  rationale: string;
  suggestedFix?: AdvisorFix;
  relatedFindingIds: string[];
}

export interface AdvisorReport {
  executiveSummary: string;
  uxMaturityScore: number; // 0 to 100
  topQuickWins: AdvisorRecommendation[];
  recommendations: AdvisorRecommendation[];
}
