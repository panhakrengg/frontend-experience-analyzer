import type { FindingSeverity } from "./finding.js";
import type { RuleDefinition } from "./rule.js";
import type { Viewport } from "./viewport.js";

export interface DesignSystemConfig {
  approvedColors?: string[];
  approvedFonts?: string[];
  allowedSpacingUnits?: string[];
  forbiddenClasses?: string[];
  forbidInlineStyles?: boolean;
}

export interface FEAPlugin {
  name: string;
  rules: RuleDefinition[];
}

export interface FEAConfig {
  extends?: string[];
  viewports?: Viewport[];
  rules?: Record<string, "error" | "warn" | "off" | { severity?: FindingSeverity; [key: string]: unknown }>;
  designSystem?: DesignSystemConfig;
  plugins?: (string | FEAPlugin)[];
  outputDir?: string;
  failOn?: FindingSeverity;
  sourceDir?: string;
  urls?: string[];
}
