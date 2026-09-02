import type { ElementReference } from "./element.js";
import type { SourceLocation } from "./framework.js";

export type FindingCategory =
  | "accessibility"
  | "ux"
  | "responsive"
  | "visual"
  | "interaction"
  | "performance"
  | "security";

export type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface StandardReference {
  authority: string;
  name: string;
  version?: string;
  criterion?: string;
  url: string;
}

export interface Evidence {
  property: string;
  actual?: unknown;
  expected?: unknown;
  unit?: string;
  description?: string;
}

export interface SuggestedFix {
  type: "html" | "css" | "javascript" | "framework";
  code: string;
  explanation?: string;
}

export interface Finding {
  id: string;

  ruleId?: string;

  pageUrl?: string;

  category: FindingCategory;

  severity: FindingSeverity;

  title: string;

  description: string;

  element?: ElementReference;

  evidence: Evidence[];

  standards?: StandardReference[];

  wcag?: string[];

  recommendation?: string;

  suggestedFix?: SuggestedFix;

  sourceLocation?: SourceLocation;

  confidence: number;
}
