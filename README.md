# Frontend Experience Analyzer

A TypeScript monorepo for scanning rendered frontend applications and reporting basic UI, accessibility, responsive, and visual issues.

The current Phase 1 MVP includes:

- Playwright-based browser scanning
- CLI scan command
- Progress logs while scanning
- Single-page scanning
- Multi-page scanning from a URL list
- Screenshot capture
- JSON report output
- HTML report output
- Screenshot highlight overlays
- Basic issue detection for labels, alt text, small targets, and overflow

## Requirements

- Node.js 22 or newer
- pnpm 10.x

Check your versions:

```powershell
node -v
pnpm -v
```

## Install

From the project root:

```powershell
pnpm install
```

If Playwright browsers are not installed yet, run:

```powershell
pnpm exec playwright install chromium
```

## Build

```powershell
pnpm build
```

This builds the workspace packages and the CLI.

The CLI entrypoint is generated at:

```text
apps/cli/dist/index.js
```

## Scan One Page

Make sure the frontend app you want to scan is already running.

Example:

```powershell
node apps\cli\dist\index.js scan http://localhost:4000 --viewport desktop --timeoutMs 60000
```

Open the HTML report:

```powershell
start reports\report.html
```

Generated files:

```text
reports/report.json
reports/report.html
reports/assets/screenshot-1-desktop.png
```

## Scan Multiple Pages

Create a text file, for example `urls.txt`:

```text
http://localhost:4000
http://localhost:4000/login
http://localhost:4000/register
```

Then run:

```powershell
node apps\cli\dist\index.js scan --urls urls.txt --viewport desktop --timeoutMs 60000
```

Each line should contain one URL. Blank lines and lines starting with `#` are ignored.

## Viewports

Built-in viewport names:

```text
mobile
tablet
desktop
```

You can also pass a custom viewport:

```powershell
node apps\cli\dist\index.js scan http://localhost:4000 --viewport 1280x720
```

## Reports

The JSON report is intended for machines and future CI integration:

```text
reports/report.json
```

The HTML report is intended for humans:

```text
reports/report.html
```

The HTML report shows:

- scan summary
- page details
- screenshot preview
- numbered issue overlays
- finding details
- evidence
- recommendations

## Current Checks

The Phase 1 MVP currently detects:

- missing page title
- image missing `alt`
- form control missing label
- interactive control missing accessible name
- interactive target too small
- visible element overflowing the viewport
- page load failure

## Troubleshooting

### No screenshot appears in the report

Check `reports/report.json`. If it contains:

```json
"pages": []
```

then the page did not load successfully, so no screenshot was captured.

Confirm the app is running:

```powershell
start http://localhost:4000
```

Then scan again:

```powershell
node apps\cli\dist\index.js scan http://localhost:4000 --viewport desktop --timeoutMs 60000
```

### The report still shows an old layout

Generated reports do not update automatically when source code changes. Rebuild and scan again:

```powershell
pnpm build
node apps\cli\dist\index.js scan http://localhost:4000 --viewport desktop --timeoutMs 60000
start reports\report.html
```

### `apps/cli/dist/index.js` does not exist

Build the repo first:

```powershell
pnpm build
```

### Playwright browser error

Install Chromium for Playwright:

```powershell
pnpm exec playwright install chromium
```

## Repository Structure

```text
apps/
  cli/        CLI entrypoint

packages/
  core/       Shared data types
  browser/    Playwright browser/page scanning
```

Additional packages such as `rules`, `rules-engine`, and `scanner` are reserved for upcoming extraction and expansion.

## Development Workflow

After editing source files:

```powershell
pnpm build
```

Then run a scan:

```powershell
node apps\cli\dist\index.js scan http://localhost:4000 --viewport desktop --timeoutMs 60000
```

## Phase 2 Direction

Recommended next work:

- move rules into a dedicated package
- move HTML/JSON reporting into a reporter package
- add stronger responsive and accessibility checks
- add better visual overlays
- add interaction behavior checks
- add user journey testing
- add Next.js and Nuxt source-code adapters
