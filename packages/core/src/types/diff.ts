import type { Finding, FindingSeverity } from "./finding.js";

export interface WebVitalsDelta {
  lcpDelta?: number; // ms (+ slower, - faster)
  clsDelta?: number; // (+ worse, - better)
  fcpDelta?: number; // ms
  ttfbDelta?: number; // ms
  weightDelta?: number; // bytes (+ larger, - smaller)
}

export interface RegressionDiff {
  baselineTarget: string;
  currentTarget: string;
  comparedAt: string;
  newFindings: Finding[];
  resolvedFindings: Finding[];
  unchangedFindings: Finding[];
  scoreDelta: number;
  vitalsDelta?: WebVitalsDelta;
}

export interface GateOptions {
  failOn?: FindingSeverity;
  maxCritical?: number;
  maxHigh?: number;
  failOnRegression?: boolean;
}

export interface GateResult {
  passed: boolean;
  violations: string[];
  summary: string;
}
