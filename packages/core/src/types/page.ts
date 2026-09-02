import type { ElementReference } from "./element.js";
import type { InteractionTrace } from "./interaction.js";
import type { PerformanceMetrics, SecurityMetrics } from "./performance.js";
import type { Viewport } from "./viewport.js";

export interface PageSnapshot {
  url: string;

  title: string;

  lang?: string;

  viewport: Viewport;

  screenshotPath?: string;

  elements: ElementReference[];

  interactionTrace?: InteractionTrace;

  performanceMetrics?: PerformanceMetrics;

  securityMetrics?: SecurityMetrics;

  metrics: {
    elementCount: number;
    interactiveElementCount: number;
    documentHeight: number;
  };
}
