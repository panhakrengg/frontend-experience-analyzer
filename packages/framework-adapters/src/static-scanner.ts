import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import type {
  AnalysisResult,
  Finding,
  FindingCategory,
  FindingSeverity,
  PageSnapshot,
} from "@frontend-experience-analyzer/core";

export interface StaticCodeScannerOptions {
  approvedColors?: string[];
  approvedFonts?: string[];
  forbiddenClasses?: string[];
  forbidInlineStyles?: boolean;
  onProgress?: (file: string, index: number, total: number, fileFindingsCount: number) => void;
}

export interface RuleAuditSummary {
  ruleId: string;
  name: string;
  category: FindingCategory;
  authority: string;
  passed: boolean;
  violationsCount: number;
}

export class StaticCodeScanner {
  private sourceDir: string;
  private options: StaticCodeScannerOptions;

  constructor(sourceDir: string, options: StaticCodeScannerOptions = {}) {
    this.sourceDir = sourceDir;
    this.options = options;
  }

  async scan(): Promise<AnalysisResult> {
    const startedAt = new Date().toISOString();
    const files = await this.collectFiles(this.sourceDir);
    const findings: Finding[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const fileFindings = this.analyzeFile(file.relativePath, file.content);
      findings.push(...fileFindings);

      if (this.options.onProgress) {
        this.options.onProgress(file.relativePath, i + 1, files.length, fileFindings.length);
      }
    }

    const completedAt = new Date().toISOString();

    return {
      target: `Source Directory: ${this.sourceDir}`,
      startedAt,
      completedAt,
      pages: [
        {
          url: `file://${this.sourceDir}`,
          title: `Static Code Analysis (${files.length} source files)`,
          viewport: { name: "desktop", width: 1440, height: 900 },
          elements: [],
          metrics: {
            elementCount: files.length,
            interactiveElementCount: 0,
            documentHeight: 0,
          },
        },
      ],
      findings,
    };
  }

  private async collectFiles(dir: string): Promise<{ relativePath: string; content: string }[]> {
    const resolvedRoot = isAbsolute(dir) ? dir : resolve(process.cwd(), dir);
    if (!existsSync(resolvedRoot)) {
      throw new Error(
        `Directory not found: "${dir}" (resolved to: "${resolvedRoot}").\nTip: Provide a full path like "C:\\Users\\kreng\\Desktop\\einv-api\\caminv-portal-merchants\\app" or a relative path from the current directory.`
      );
    }

    const results: { relativePath: string; content: string }[] = [];

    const walk = async (currentDir: string) => {
      try {
        const entries = await readdir(currentDir, { withFileTypes: true });
        for (const entry of entries) {
          if (
            entry.name.startsWith(".") ||
            entry.name === "node_modules" ||
            entry.name === "dist" ||
            entry.name === "build" ||
            entry.name === ".next" ||
            entry.name === ".nuxt" ||
            entry.name === ".output" ||
            entry.name === "coverage" ||
            entry.name === "reports" ||
            entry.name === "test-results"
          ) {
            continue;
          }
          const fullPath = join(currentDir, entry.name);
          if (entry.isDirectory()) {
            await walk(fullPath);
          } else if (entry.isFile()) {
            const ext = extname(entry.name).toLowerCase();
            if ([".tsx", ".jsx", ".vue", ".svelte", ".html", ".js", ".ts", ".css"].includes(ext)) {
              const content = await readFile(fullPath, "utf8");
              results.push({
                relativePath: relative(process.cwd(), fullPath).replace(/\\/g, "/"),
                content,
              });
            }
          }
        }
      } catch {
        // Fallback on permission/missing dir
      }
    };

    await walk(this.sourceDir);
    return results;
  }

  private analyzeFile(filePath: string, content: string): Finding[] {
    const findings: Finding[] = [];
    const lines = content.split(/\r?\n/);
    const isJsx = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
    const isHtml = filePath.endsWith(".html");

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]!;
      const lineNumber = lineIndex + 1;

      // ==========================================
      // 1. ACCESSIBILITY (WCAG 2.2) BEST PRACTICES
      // ==========================================

      // Rule: Image Alt Text (WCAG 1.1.1)
      if (/<img\b(?![^>]*\balt=)/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-a11y-img-alt-${filePath}-${lineNumber}`,
          ruleId: "image-alt",
          category: "accessibility",
          severity: "high",
          title: "Image element missing 'alt' attribute",
          description: "Found <img> tag without an accessible alt attribute in component source code.",
          filePath,
          lineNumber,
          recommendation: 'Add alt="Descriptive text" or alt="" for decorative images.',
          wcag: ["1.1.1 Non-text Content"],
          authority: "WCAG 2.2 Level A",
        }));
      }

      // Rule: Empty / Unlabeled Button (WCAG 4.1.2)
      if (/<button\b(?![^>]*\b(aria-label|aria-labelledby)=)[^>]*>\s*<\/button>/i.test(line) || /<button\b(?![^>]*\b(aria-label|aria-labelledby)=)[^>]*\/>/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-a11y-empty-button-${filePath}-${lineNumber}`,
          ruleId: "icon-only-button-name",
          category: "accessibility",
          severity: "high",
          title: "Button component lacks accessible label or text",
          description: "Button element is rendered without text content or an aria-label attribute.",
          filePath,
          lineNumber,
          recommendation: 'Add visible text or aria-label="Action description" to the button.',
          wcag: ["4.1.2 Name, Role, Value"],
          authority: "WCAG 2.2 Level A",
        }));
      }

      // Rule: Non-interactive Element with Click Handler (WCAG 2.1.1)
      if (isJsx && /<(div|span|p|section)\b[^>]*\bonClick=/i.test(line) && !/role=["'](button|link|tab|menuitem)["']/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-a11y-non-interactive-click-${filePath}-${lineNumber}`,
          ruleId: "non-button-keyboard",
          category: "accessibility",
          severity: "medium",
          title: "Click handler assigned to non-interactive HTML element",
          description: "Using onClick on <div> or <span> elements without keyboard event handlers (onKeyDown) and role='button' breaks keyboard navigation.",
          filePath,
          lineNumber,
          recommendation: "Replace with a semantic <button> element or add role='button' with tabIndex={0} and onKeyDown.",
          wcag: ["2.1.1 Keyboard"],
          authority: "WCAG 2.2 Level A",
        }));
      }

      // Rule: HTML Lang Attribute in root HTML (WCAG 3.1.1)
      if (isHtml && /<html\b(?![^>]*\blang=)/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-a11y-html-lang-${filePath}-${lineNumber}`,
          ruleId: "html-lang",
          category: "accessibility",
          severity: "medium",
          title: "HTML root element missing 'lang' attribute",
          description: "The <html> tag must specify a primary language for screen reader synthesis.",
          filePath,
          lineNumber,
          recommendation: 'Add lang="en" to the <html> tag.',
          wcag: ["3.1.1 Language of Page"],
          authority: "WCAG 2.2 Level A",
        }));
      }

      // ==========================================
      // 2. OWASP & WEB SECURITY BEST PRACTICES
      // ==========================================

      // Rule: Vulnerable Link Target / Reverse Tabnabbing (OWASP)
      if (/target=["']_blank["']/i.test(line) && !/rel=["'][^"']*(noopener|noreferrer)/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-sec-target-blank-${filePath}-${lineNumber}`,
          ruleId: "vulnerable-link-target",
          category: "security",
          severity: "high",
          title: "target='_blank' link missing rel='noopener noreferrer'",
          description: "External link opens in a new window without isolating window.opener (Reverse Tabnabbing vulnerability).",
          filePath,
          lineNumber,
          recommendation: 'Add rel="noopener noreferrer" to all target="_blank" links.',
          authority: "OWASP Top 10 Web Security",
        }));
      }

      // Rule: Dangerous javascript: Pseudo-Protocol (OWASP DOM XSS)
      if (/href=["']javascript:/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-sec-href-js-${filePath}-${lineNumber}`,
          ruleId: "insecure-href-javascript",
          category: "security",
          severity: "high",
          title: "Dangerous 'javascript:' pseudo-protocol in anchor tag",
          description: "Executing scripts directly in href attributes introduces Cross-Site Scripting (XSS) vectors and accessibility issues.",
          filePath,
          lineNumber,
          recommendation: "Use a <button type='button'> with an onClick handler instead.",
          authority: "OWASP DOM XSS Cheat Sheet",
        }));
      }

      // Rule: React dangerouslySetInnerHTML / Vue v-html (OWASP A03 Injection)
      if (/\bdangerouslySetInnerHTML\b/i.test(line) || /\bv-html\b/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-sec-dangerously-set-html-${filePath}-${lineNumber}`,
          ruleId: "inline-event-handler-xss",
          category: "security",
          severity: "high",
          title: "Raw unescaped HTML injection detected (dangerouslySetInnerHTML / v-html)",
          description: "Injecting unescaped HTML strings directly into the DOM can lead to Critical Cross-Site Scripting (XSS).",
          filePath,
          lineNumber,
          recommendation: "Sanitize HTML using DOMPurify before injecting or use standard React JSX components.",
          authority: "OWASP A03:2021 Injection",
        }));
      }

      // Rule: Insecure cleartext HTTP asset URL
      if (/(src|href)=["']http:\/\/(?!localhost|127\.0\.0\.1)/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-sec-mixed-content-${filePath}-${lineNumber}`,
          ruleId: "mixed-content",
          category: "security",
          severity: "critical",
          title: "Insecure cleartext HTTP resource URL",
          description: "Asset URL uses unencrypted http:// protocol, causing Mixed Content blocks and MITM vulnerabilities on HTTPS sites.",
          filePath,
          lineNumber,
          recommendation: "Update the resource URL from http:// to secure https://.",
          authority: "W3C Mixed Content / OWASP",
        }));
      }

      // Rule: Sensitive Password Field without Autocomplete (OWASP Authentication)
      if (/type=["']password["']/i.test(line) && !/autoComplete=["'](current-password|new-password)["']/i.test(line) && !/autocomplete=["'](current-password|new-password)["']/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-sec-pwd-autocomplete-${filePath}-${lineNumber}`,
          ruleId: "sensitive-input-autocomplete",
          category: "security",
          severity: "medium",
          title: "Password input field missing standard 'autoComplete' attribute",
          description: "Password fields should explicitly specify autoComplete='current-password' or autoComplete='new-password' for secure password managers.",
          filePath,
          lineNumber,
          recommendation: 'Add autoComplete="current-password" or autoComplete="new-password" to the password input.',
          authority: "OWASP Authentication Cheat Sheet",
        }));
      }

      // ==========================================
      // 3. REACT & FRAMEWORK BEST PRACTICES
      // ==========================================

      // Rule: Array index as key in React list
      if (isJsx && /key=\{index\}/i.test(line) || isJsx && /key=\{i\}/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-react-index-key-${filePath}-${lineNumber}`,
          ruleId: "react-hydration-mismatch",
          category: "ux",
          severity: "medium",
          title: "Using array index as React list 'key'",
          description: "Using index as a key (key={index}) leads to subtle UI rendering bugs, state corruption, and reconciliation performance penalties when list items change.",
          filePath,
          lineNumber,
          recommendation: "Use a stable unique ID from your data (e.g. key={item.id}) instead of array index.",
          authority: "React Best Practices",
        }));
      }

      // Rule: Next.js <Image fill> missing sizes
      if (/<Image\b[^>]*\bfill\b(?![^>]*\bsizes=)/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-fw-next-image-sizes-${filePath}-${lineNumber}`,
          ruleId: "next-image-sizes",
          category: "performance",
          severity: "medium",
          title: "Next.js <Image fill> missing responsive 'sizes' prop",
          description: "Responsive fill images require a sizes prop to avoid downloading full-resolution desktop images on mobile viewports.",
          filePath,
          lineNumber,
          recommendation: "Add sizes='(max-width: 768px) 100vw, 50vw' to the <Image /> component.",
          authority: "Next.js Performance Guide",
        }));
      }

      // ==========================================
      // 4. DESIGN SYSTEM & TOKEN GOVERNANCE
      // ==========================================

      // Rule: Forbidden Raw Inline Styles
      if (this.options.forbidInlineStyles && /\bstyle=["'][^"']+["']/i.test(line) || this.options.forbidInlineStyles && /\bstyle=\{\{/i.test(line)) {
        findings.push(this.createFinding({
          id: `static-ds-inline-style-${filePath}-${lineNumber}`,
          ruleId: "forbidden-inline-styles",
          category: "visual",
          severity: "low",
          title: "Raw inline style violates design system governance",
          description: "Design system policy forbids raw inline style attributes in component templates.",
          filePath,
          lineNumber,
          recommendation: "Extract inline styles to CSS modules, Tailwind utilities, or design token variables.",
          authority: "Design System Governance",
        }));
      }

      // Rule: Deprecated Component Classes
      if (this.options.forbiddenClasses?.length) {
        for (const cls of this.options.forbiddenClasses) {
          if (new RegExp(`\\b${cls}\\b`).test(line)) {
            findings.push(this.createFinding({
              id: `static-ds-deprecated-cls-${cls}-${filePath}-${lineNumber}`,
              ruleId: "deprecated-component-class",
              category: "ux",
              severity: "high",
              title: `Deprecated component class ".${cls}" detected`,
              description: `Component source references deprecated class ".${cls}" which has been phased out.`,
              filePath,
              lineNumber,
              recommendation: `Migrate to the modern design system component replacement for ".${cls}".`,
              authority: "Design System Governance",
            }));
          }
        }
      }
    }

    return findings;
  }

  private createFinding(opts: {
    id: string;
    ruleId: string;
    category: FindingCategory;
    severity: FindingSeverity;
    title: string;
    description: string;
    filePath: string;
    lineNumber: number;
    recommendation: string;
    wcag?: string[];
    authority?: string;
  }): Finding {
    return {
      id: opts.id,
      ruleId: opts.ruleId,
      category: opts.category,
      severity: opts.severity,
      title: opts.title,
      description: opts.description,
      pageUrl: `file://${opts.filePath}`,
      confidence: 1,
      sourceLocation: {
        file: opts.filePath,
        line: opts.lineNumber,
      },
      recommendation: opts.recommendation,
      wcag: opts.wcag,
      standards: opts.authority
        ? [
            {
              authority: opts.authority,
              name: opts.title,
              criterion: opts.ruleId,
              url: "https://frontend-experience-analyzer.dev/rules",
            },
          ]
        : undefined,
      evidence: [
        { property: "sourceFile", actual: opts.filePath },
        { property: "lineNumber", actual: opts.lineNumber },
      ],
    };
  }
}
