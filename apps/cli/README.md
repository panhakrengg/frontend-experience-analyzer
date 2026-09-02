# 🔍 Frontend Experience Analyzer (`fea`)

[![npm version](https://img.shields.io/npm/v/@panhakreng/frontend-experience-analyzer.svg)](https://www.npmjs.com/package/@panhakreng/frontend-experience-analyzer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.0-green.svg)](https://nodejs.org/)

An automated diagnostic CLI and static code scanner for modern frontend web applications (**Vue**, **React**, **Next.js**, **Nuxt**, **Svelte**, and **HTML5**).

Audits applications across **OWASP Top 10 Web Security**, **WCAG 2.2 Accessibility**, **Google Core Web Vitals**, **Responsive Multi-Viewport Layouts**, **Company Design System Tokens**, and **AI UX Insights**.

---

## ⚡ Instant Usage via `npx` (No Installation Required)

You can run `fea` immediately in any repository without installing:

```bash
# Statically scan the current project (auto-detects ./app, ./src, ./pages):
npx @panhakreng/frontend-experience-analyzer scan-code

# Statically scan a specific path:
npx @panhakreng/frontend-experience-analyzer scan-code /path/to/project

# List all 42+ active diagnostic rules:
npx @panhakreng/frontend-experience-analyzer rules

# Scan live running web server across viewports:
npx @panhakreng/frontend-experience-analyzer scan http://localhost:3000 --ai
```

---

## 📦 Global Installation

To use the short `fea` command everywhere across your terminal:

```bash
npm install -g @panhakreng/frontend-experience-analyzer --force
```

Now you can run:

```bash
# In any project folder:
fea scan-code
fea rules
fea rules security
```

---

## 📖 Command Guide

### 1. `fea scan-code [dir]` — Offline Static Code Scanner
Scans source files (`.vue`, `.tsx`, `.jsx`, `.svelte`, `.html`, `.ts`, `.js`) directly for security vulnerabilities and code anti-patterns without needing a running server.

```bash
# Auto-detects ./src, ./app, or ./pages automatically:
fea scan-code

# Scan a custom folder:
fea scan-code ./app

# Scan with AI UX Advisor analysis:
fea scan-code ./src --ai

# Output to a custom report folder:
fea scan-code ./src --outputDir ./audit-reports
```

---

### 2. `fea rules [category]` — Rule Registry & Standards
Lists all active diagnostic rules, standard authorities (WCAG, OWASP, Google, W3C), severity levels, and code remediation recommendations.

```bash
# Display all 42+ rules:
fea rules

# Filter by standard / category:
fea rules security        # OWASP Top 10 & Web Security
fea rules accessibility   # WCAG 2.2 Levels A, AA, AAA
fea rules performance     # Core Web Vitals & Payloads
fea rules responsive      # Mobile/Tablet Viewport Overflow
fea rules interaction     # Modal, Button, and Console Errors
```

---

### 3. `fea scan <url>` — Real Browser Runtime Scan
Launches headless browser captures across responsive viewports (Mobile, Tablet, Desktop) with element overlays and interaction logs.

```bash
# Scan a live web server:
fea scan http://localhost:3000

# Scan specific viewports:
fea scan http://localhost:5173 --viewport mobile,desktop

# Batch scan multiple URLs:
fea scan --urls urls.txt --ai
```

---

### 4. `fea diff <baseline.json> <current.json>` — CI Regression Tracking
Compares a baseline scan against the current build to catch newly introduced regressions and track resolved bugs.

```bash
fea diff reports/v1.0.0/report.json reports/v1.1.0/report.json --fail-on high
```

---

### 5. `fea dashboard [report.json]` — Interactive React 19 Dashboard
Launches the built-in React 19 interactive analytics dashboard:

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

## 🌐 Opening the Interactive HTML Report

After scanning, the report is saved to `reports/report.html` and `reports/report.json`.

### On Windows (PowerShell):
```powershell
Start-Process .\reports\report.html
```

### On macOS (Terminal):
```bash
open reports/report.html
```

### On Linux:
```bash
xdg-open reports/report.html
```

---

## ⚙️ Configuration File (`fea.config.json`)

Customize rules and enforce company design tokens by placing `fea.config.json` in your repository root:

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

## 📄 License

MIT © [Panha Kreng](https://github.com/panhakrengg)
