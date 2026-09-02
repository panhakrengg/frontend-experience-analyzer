import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { FEAConfig, RuleDefinition } from "@frontend-experience-analyzer/core";
import { createDeprecatedComponentClassRule } from "./design-system-rules/deprecated-component-class.js";
import { createDesignTokenColorRule } from "./design-system-rules/design-token-color.js";
import { createDesignTokenFontRule } from "./design-system-rules/design-token-font.js";
import { forbiddenInlineStylesRule } from "./design-system-rules/forbidden-inline-styles.js";
import { loadPlugins } from "./plugin-loader.js";

const DEFAULT_CONFIG_FILES = [
  "fea.config.json",
  "fea.config.js",
  "fea.config.mjs",
  ".fearc.json",
  ".fearc",
];

export interface ResolvedConfig {
  config: FEAConfig;
  customRules: RuleDefinition[];
}

export async function loadConfig(
  customPath?: string,
  cwd: string = process.cwd()
): Promise<ResolvedConfig | undefined> {
  let targetPath: string | undefined;

  if (customPath) {
    targetPath = isAbsolute(customPath) ? customPath : resolve(cwd, customPath);
  } else {
    for (const filename of DEFAULT_CONFIG_FILES) {
      const candidate = join(cwd, filename);
      if (existsSync(candidate)) {
        targetPath = candidate;
        break;
      }
    }
  }

  if (!targetPath || !existsSync(targetPath)) {
    return undefined;
  }

  let config: FEAConfig;
  if (targetPath.endsWith(".json") || targetPath.endsWith("rc")) {
    const raw = await readFile(targetPath, "utf8");
    config = JSON.parse(raw);
  } else {
    const fileUrl = pathToFileURL(targetPath).href;
    const mod = await import(fileUrl);
    config = mod.default ?? mod;
  }

  // 1. Build design system rules from config
  const customRules: RuleDefinition[] = [];
  const ds = config.designSystem;

  if (ds) {
    if (ds.approvedColors && ds.approvedColors.length > 0) {
      customRules.push(createDesignTokenColorRule(ds.approvedColors));
    }
    if (ds.approvedFonts && ds.approvedFonts.length > 0) {
      customRules.push(createDesignTokenFontRule(ds.approvedFonts));
    }
    if (ds.forbidInlineStyles) {
      customRules.push(forbiddenInlineStylesRule);
    }
    if (ds.forbiddenClasses && ds.forbiddenClasses.length > 0) {
      customRules.push(createDeprecatedComponentClassRule(ds.forbiddenClasses));
    }
  }

  // 2. Load custom plugins
  if (config.plugins && config.plugins.length > 0) {
    const pluginRules = await loadPlugins(config.plugins, cwd);
    customRules.push(...pluginRules);
  }

  return {
    config,
    customRules,
  };
}
