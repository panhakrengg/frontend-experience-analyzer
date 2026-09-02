export type JourneyStepAction =
  | "goto"
  | "click"
  | "fill"
  | "select"
  | "press"
  | "wait"
  | "assert-visible"
  | "assert-text"
  | "screenshot";

export interface JourneyStep {
  name: string;
  action: JourneyStepAction;
  target?: string;
  value?: string;
  timeoutMs?: number;
}

export interface JourneyConfig {
  name: string;
  description?: string;
  viewport?: string;
  steps: JourneyStep[];
}

export interface JourneyStepResult {
  step: JourneyStep;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  screenshotPath?: string;
  errorMessage?: string;
  consoleErrors?: string[];
}

export interface JourneySummary {
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  consoleErrorCount: number;
  networkFailureCount: number;
}

export interface JourneyReport {
  name: string;
  description?: string;
  status: "passed" | "failed";
  totalDurationMs: number;
  frictionScore: number; // 0 to 100 (100 = smooth, 0 = highly blocked/failed)
  stepResults: JourneyStepResult[];
  summary: JourneySummary;
}
