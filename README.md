# 🔍 Frontend Experience Analyzer (`fea`)

[![npm version](https://img.shields.io/npm/v/@panhakreng/frontend-experience-analyzer.svg)](https://www.npmjs.com/package/@panhakreng/frontend-experience-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0-green.svg)](https://nodejs.org/)

An enterprise-grade diagnostic engine, static code scanner, and visual runtime analyzer for modern frontend applications (**Vue**, **React**, **Next.js**, **Nuxt**, **Svelte**, and **HTML5**).

Audits applications across **OWASP Web Security**, **WCAG 2.2 Accessibility**, **Google Core Web Vitals**, **Multi-Viewport Responsive Design**, **Company Design System Tokens**, and **AI UX Insights**.

---

## 🌟 Key Features

* 🛡️ **OWASP Top 10 Web Security**: Detects XSS vectors (`v-html`, `dangerouslySetInnerHTML`), unsafe `target="_blank"` tabnabbing, unhashed CDN assets (Missing SRI), insecure form submissions, and credential exposure.
* ♿ **WCAG 2.2 Accessibility (Level A, AA, AAA)**: Audits image `alt` texts, form labels, ARIA attributes, touch-target sizing (minimum 24×24px), focus indicators, and keyboard navigability.
* ⚡ **Performance & Core Web Vitals**: Measures LCP, CLS, FCP, TTFB, oversized JS payloads, and unoptimized raster images.
* 📱 **Responsive Multi-Viewport Auditing**: Detects clipped text with hidden overflow, horizontal layout overflow, modal overflow, and fixed header overlaps across Mobile, Tablet, and Desktop.
* 🎨 **Design System & Token Governance**: Enforces approved color palettes, font families, bans forbidden inline styles, and detects deprecated CSS component classes via `fea.config.json`.
* 🤖 **AI UX Advisor**: Generates automated UX maturity scoring (0–100), friction analysis, and auto-generated code patches (`diff.patch`).
* 📊 **Interactive 2-Pane HTML Report**: Split-pane layout with category counters, diagnostic rules checklist, live search, and actionable code remediation guidance.
* 🔄 **CI/CD Quality Gates & Regression Diffing**: Automated baseline diffing (`fea diff`), quality threshold gates (`--fail-on`), and export to SARIF, JUnit XML, and GitHub PR Markdown summaries.

---

## 🚀 Installation & Quick Start

### Option 1: Run Instantly via `npx` (No Installation Required)

```bash
# Statically scan current project directory:
npx @panhakreng/frontend-experience-analyzer scan-code

# Or scan a specific project path:
npx @panhakreng/frontend-experience-analyzer scan-code /path/to/project
```

---

### Option 2: Install Globally (Recommended)

```bash
npm install -g @panhakreng/frontend-experience-analyzer --force
```

Once installed globally, the **`fea`** command is available anywhere in your terminal:

```bash
# Check all diagnostic rules:
fea rules

# Statically scan any frontend repository:
fea scan-code

# Scan a live web server across viewports:
fea scan http://localhost:3000 --ai
```

---

### Option 3: Local Monorepo Development

```bash
git clone https://github.com/panhakrengg/frontend-experience-analyzer.git
cd frontend-experience-analyzer
pnpm install
pnpm build
cd apps/cli && npm link
```

---

## 📖 Command Reference

### 1. `fea scan-code [dir]` (Offline Static Code Scanning)
Scans source files (`.vue`, `.tsx`, `.jsx`, `.svelte`, `.html`, `.ts`, `.js`) directly without needing a running server.

```bash
# Auto-detects ./app, ./src, or ./pages automatically:
fea scan-code

# Scan a custom directory:
fea scan-code ./src

# Scan with AI UX Advisor analysis:
fea scan-code ./app --ai

# Set custom output directory:
fea scan-code ./app --outputDir ./audit-reports
```

---

### 2. `fea rules [category]` (Rule Registry & Standards)
Displays active diagnostic rules, standard authorities (WCAG, OWASP, Google), severities, and remediation fixes.

```bash
# List all 42+ active diagnostic rules:
fea rules

# Filter by category:
fea rules security
fea rules accessibility
fea rules performance
fea rules responsive
fea rules interaction
```

---

### 3. `fea scan <url>` (Playwright Browser Runtime Scanning)
Launches headless browser capture across responsive viewports (Mobile, Tablet, Desktop) with element bounding boxes and interaction traces.

```bash
# Scan a live application:
fea scan http://localhost:5173

# Scan specific viewports:
fea scan http://localhost:3000 --viewport mobile,desktop

# Multi-page batch scan from a URL list file:
fea scan --urls urls.txt --ai
```

---

### 4. `fea diff <baseline.json> <current.json>` (CI Regression Tracking)
Compares a baseline report against the current build to catch newly introduced regressions and track resolved bugs.

```bash
fea diff reports/v1.0.0/report.json reports/v1.1.0/report.json --fail-on high
```

---

### 5. `fea dashboard [report.json]` (Interactive React 19 Viewer)
Launches the local React 19 analytics dashboard:

```bash
fea dashboard reports/report.json
```

---

## 🤖 AI UX Advisor & LLM Providers

The **AI UX Advisor** evaluates overall user experience maturity, identifies highest-ROI quick wins, and generates automated code remediation patches (`diff.patch`).

It supports two modes:

### 1. Default Offline Mode (100% Free, Zero Setup)
When you run `fea scan-code --ai` without an API key:
* Runs **100% offline** on your local machine with zero external network requests.
* Mathematically calculates your **UX Maturity Score (0–100)** across accessibility, security, and responsive dimensions.
* Uses built-in heuristic AST rules to generate instant code remediation suggestions.

### 2. Live Generative LLM Mode (Gemini, OpenAI, Claude)
To enable deep generative reasoning, full component analysis, and tailored multi-file code diffs, supply an API key using any of the following methods:

#### A. Environment Variables (Recommended)
```bash
# Google Gemini (Default model: gemini-2.0-flash)
export GEMINI_API_KEY="AIzaSyYourGeminiApiKey"
# In Windows PowerShell: $env:GEMINI_API_KEY = "AIzaSyYourGeminiApiKey"

# OpenAI (Default model: gpt-4o)
export OPENAI_API_KEY="sk-proj-YourOpenAIApiKey"

# Anthropic Claude (Default model: claude-3-5-sonnet-20241022)
export ANTHROPIC_API_KEY="sk-ant-YourAnthropicApiKey"
```

#### B. CLI Flags
```bash
fea scan-code ./app --ai --provider gemini --model gemini-2.0-flash --apiKey "AIzaSy..."
```

#### C. In `fea.config.json`
```json
{
  "advisor": {
    "provider": "gemini",
    "model": "gemini-2.0-flash"
  }
}
```

---

## 🌐 Opening Generated Reports

After a scan finishes, reports are saved to `reports/report.html` and `reports/report.json`.

### On Windows:
```powershell
Start-Process .\reports\report.html
```

### On macOS:
```bash
open reports/report.html
```

### On Linux:
```bash
xdg-open reports/report.html
```

---

## ⚙️ Configuration (`fea.config.json`)

Customize rules and define company design tokens by placing `fea.config.json` in your project root:

```json
{
  "rules": {
    "image-alt": "error",
    "inline-event-handler-xss": "error",
    "touch-target-spacing": "warn"
  },
  "designSystem": {
    "approvedColors": ["#2563eb", "#1e293b", "#ffffff", "#f8fafc", "#ef4444"],
    "approvedFonts": ["Inter", "system-ui", "sans-serif"],
    "forbiddenClasses": ["legacy-btn", "old-container", "v1-modal"],
    "forbidInlineStyles": true
  },
  "plugins": ["./custom-company-rules.js"]
}
```

---

## 🤖 CI/CD Integration (GitHub Actions)

Add automated frontend experience and security checks to your GitHub Actions workflow:

```yaml
name: Frontend Experience & Security Audit

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run FEA Scanner
        run: |
          npx @panhakreng/frontend-experience-analyzer scan-code ./src \
            --format markdown,sarif,junit \
            --outputDir reports

      - name: Upload Scan Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: fea-report
          path: reports/
```

---

## 🏗️ Monorepo Architecture

```text
frontend-experience-analyzer/
├── apps/
│   ├── cli/                   # Unified CLI runner (fea)
│   └── dashboard/             # React 19 + Vite dashboard
├── packages/
│   ├── core/                  # Core TypeScript schemas & findings
│   ├── rules/                 # 42+ diagnostic rules (WCAG, OWASP, Vitals)
│   ├── rules-engine/          # Rule execution and filtering engine
│   ├── framework-adapters/    # StaticCodeScanner & SourceMapper
│   ├── browser/               # Playwright session, Web Vitals & captures
│   ├── reporter/              # Interactive 2-pane HTML & JSON reporter
│   ├── ai-advisor/            # AI UX Advisor & patch generator
│   ├── ci/                    # Regression diffing, JUnit & SARIF formatters
│   └── plugin-system/         # Config loader & design token policies
└── tests/                     # 106+ unit & integration test suites
```

---

## 🧪 Testing

```bash
# Run all 106+ test suites:
pnpm test

# Build all 11 monorepo packages:
pnpm build
```

---

## 📄 License

MIT © [Panha Kreng](https://github.com/panhakrengg)