import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { FrameworkDetection, PageSnapshot } from "@frontend-experience-analyzer/core";

export async function detectFramework(
  snapshot?: PageSnapshot,
  projectDir?: string
): Promise<FrameworkDetection> {
  // 1. Check projectDir package.json if available
  if (projectDir) {
    try {
      const pkgPath = join(projectDir, "package.json");
      const pkgRaw = await readFile(pkgPath, "utf8");
      const pkg = JSON.parse(pkgRaw);
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (allDeps["next"]) {
        return { framework: "nextjs", version: allDeps["next"] };
      }
      if (allDeps["nuxt"]) {
        return { framework: "nuxt", version: allDeps["nuxt"] };
      }
      if (allDeps["@remix-run/react"] || allDeps["@remix-run/node"]) {
        return { framework: "remix" };
      }
      if (allDeps["svelte"] || allDeps["@sveltejs/kit"]) {
        return { framework: "svelte" };
      }
      if (allDeps["vite"]) {
        return { framework: "vite", version: allDeps["vite"] };
      }
    } catch {
      // package.json read optional
    }
  }

  // 2. Inspect runtime DOM elements and HTML
  if (snapshot) {
    for (const el of snapshot.elements) {
      const html = el.htmlSnippet ?? "";
      const attrs = el.attributes ?? {};

      if (html.includes("__NEXT_DATA__") || html.includes("/_next/static") || "data-nextjs-scroll-focus" in attrs) {
        return { framework: "nextjs" };
      }
      if (html.includes("__NUXT__") || html.includes("__vue_app__") || Object.keys(attrs).some((k) => k.startsWith("data-v-"))) {
        return { framework: "nuxt" };
      }
      if (html.includes("data-svelte") || Object.keys(attrs).some((k) => k.startsWith("svelte-"))) {
        return { framework: "svelte" };
      }
      if (html.includes("data-reactroot") || html.includes("/@vite/client")) {
        return { framework: "vite" };
      }
    }
  }

  return { framework: "vanilla" };
}
