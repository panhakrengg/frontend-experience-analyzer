import type { ElementReference } from "./element.js";
import type { Viewport } from "./viewport.js";

export interface PageSnapshot {
  url: string;

  title: string;

  viewport: Viewport;

  screenshotPath?: string;

  elements: ElementReference[];

  metrics: {
    elementCount: number;
    interactiveElementCount: number;
    documentHeight: number;
  };
}
