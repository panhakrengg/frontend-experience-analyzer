import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import type { Finding, SourceLocation } from "@frontend-experience-analyzer/core";

export interface SourceFileContent {
  relativePath: string;
  lines: string[];
}

export class SourceMapper {
  private sourceDir: string;
  private fileCache: SourceFileContent[] = [];

  constructor(sourceDir: string) {
    this.sourceDir = sourceDir;
  }

  async index(): Promise<void> {
    this.fileCache = [];
    await this.walk(this.sourceDir);
  }

  private async walk(dir: string): Promise<void> {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist") {
          continue;
        }
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          await this.walk(fullPath);
        } else if (entry.isFile()) {
          const ext = extname(entry.name).toLowerCase();
          if ([".tsx", ".jsx", ".vue", ".svelte", ".html", ".js", ".ts"].includes(ext)) {
            const content = await readFile(fullPath, "utf8");
            this.fileCache.push({
              relativePath: relative(process.cwd(), fullPath).replace(/\\/g, "/"),
              lines: content.split(/\r?\n/),
            });
          }
        }
      }
    } catch {
      // Directory read optional
    }
  }

  mapFinding(finding: Finding): SourceLocation | undefined {
    const el = finding.element;
    if (!el) return undefined;

    // Search by ID, selector class, test ID, or unique text
    const searchTerms: string[] = [];
    if (el.attributes?.id) searchTerms.push(`id="${el.attributes.id}"`, `id='${el.attributes.id}'`, `id={"${el.attributes.id}"}`);
    if (el.attributes?.["data-testid"]) searchTerms.push(`data-testid="${el.attributes["data-testid"]}"`);
    if (el.selector && el.selector.includes(".")) {
      const cls = el.selector.split(".").pop()?.split(" ")[0];
      if (cls) searchTerms.push(`className="${cls}"`, `class="${cls}"`, `className={styles.${cls}}`, cls);
    }
    if (el.text && el.text.length > 5 && el.text.length < 40) {
      searchTerms.push(el.text.trim());
    }

    for (const term of searchTerms) {
      for (const file of this.fileCache) {
        for (let lineIndex = 0; lineIndex < file.lines.length; lineIndex++) {
          const line = file.lines[lineIndex]!;
          if (line.includes(term)) {
            const componentName = file.relativePath.split("/").pop()?.replace(/\.[^.]+$/, "");
            return {
              file: file.relativePath,
              line: lineIndex + 1,
              componentName,
            };
          }
        }
      }
    }

    return undefined;
  }

  mapFindings(findings: Finding[]): Finding[] {
    for (const finding of findings) {
      if (!finding.sourceLocation) {
        finding.sourceLocation = this.mapFinding(finding);
      }
    }
    return findings;
  }
}
