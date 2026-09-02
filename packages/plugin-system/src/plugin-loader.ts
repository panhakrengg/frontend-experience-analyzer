import { isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { FEAPlugin, RuleDefinition } from "@frontend-experience-analyzer/core";

export async function loadPlugins(
  plugins: (string | FEAPlugin)[] = [],
  cwd: string = process.cwd()
): Promise<RuleDefinition[]> {
  const loadedRules: RuleDefinition[] = [];

  for (const pluginItem of plugins) {
    if (typeof pluginItem === "object" && pluginItem !== null && Array.isArray(pluginItem.rules)) {
      loadedRules.push(...pluginItem.rules);
    } else if (typeof pluginItem === "string") {
      try {
        const fullPath = isAbsolute(pluginItem) ? pluginItem : resolve(cwd, pluginItem);
        const fileUrl = pathToFileURL(fullPath).href;
        const mod = await import(fileUrl);
        const plugin: FEAPlugin = mod.default ?? mod;

        if (plugin && Array.isArray(plugin.rules)) {
          loadedRules.push(...plugin.rules);
        } else if (Array.isArray(mod.rules)) {
          loadedRules.push(...mod.rules);
        }
      } catch (err) {
        console.warn(`[FEA Plugin Loader] Failed to load plugin "${pluginItem}":`, err);
      }
    }
  }

  return loadedRules;
}
