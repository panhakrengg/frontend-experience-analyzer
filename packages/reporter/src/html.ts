import type {
  AdvisorReport,
  AnalysisResult,
  Finding,
  FindingCategory,
  FindingSeverity,
  JourneyReport,
  PageSnapshot,
} from "@frontend-experience-analyzer/core";
import { BUILTIN_RULES } from "@frontend-experience-analyzer/rules";
import {
  countFindings,
  escapeAttribute,
  escapeHtml,
  formatValue,
  toReportRelativeAssetPath,
} from "./summary.js";

let currentRenderPages: PageSnapshot[] = [];

export function generateHtmlReport(result: AnalysisResult): string {
  currentRenderPages = result.pages;
  const counts = countFindings(result.findings);

  const criticalCount = counts.severity.critical;
  const highCount = counts.severity.high;
  const mediumCount = counts.severity.medium;
  const lowCount = counts.severity.low;
  const deduction = criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2;
  const complianceScore = Math.max(0, 100 - deduction);

  // Group rules and calculate rule-level violations
  const ruleCounts = new Map<string, number>();
  for (const f of result.findings) {
    const key = f.ruleId ?? "custom";
    ruleCounts.set(key, (ruleCounts.get(key) ?? 0) + 1);
  }

  const categoryIcons: Record<string, string> = {
    security: "🛡️",
    accessibility: "♿",
    performance: "⚡",
    responsive: "📱",
    visual: "🎨",
    interaction: "🕹️",
    ux: "💡",
  };

  const categories: FindingCategory[] = [
    "security",
    "accessibility",
    "performance",
    "responsive",
    "visual",
    "interaction",
    "ux",
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Frontend Experience Analyzer Report</title>
  <style>
    :root {
      --bg: #f8fafc;
      --panel: #ffffff;
      --panel-hover: #f1f5f9;
      --text: #0f172a;
      --muted: #64748b;
      --line: #e2e8f0;
      --primary: #2563eb;
      --critical: #ef4444;
      --high: #f97316;
      --medium: #f59e0b;
      --low: #3b82f6;
      --info: #64748b;
      --success: #10b981;
      --code-bg: #f1f5f9;
      --sidebar-width: 380px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0f19;
        --panel: #111827;
        --panel-hover: #1f2937;
        --text: #f9fafb;
        --muted: #9ca3af;
        --line: #1f2937;
        --code-bg: #1e293b;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
      line-height: 1.5;
    }
    header.topbar {
      background: var(--panel);
      border-bottom: 1px solid var(--line);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .topbar h1 { margin: 0; font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .topbar .meta { color: var(--muted); font-size: 13px; }
    
    .layout {
      display: flex;
      min-height: calc(100vh - 65px);
    }
    
    /* LEFT SIDEBAR */
    .sidebar {
      width: var(--sidebar-width);
      flex-shrink: 0;
      background: var(--panel);
      border-right: 1px solid var(--line);
      height: calc(100vh - 65px);
      position: sticky;
      top: 65px;
      overflow-y: auto;
      padding: 20px;
    }
    
    .sidebar-section { margin-bottom: 24px; }
    .sidebar-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      font-weight: 700;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .score-card {
      background: linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(16,185,129,0.08) 100%);
      border: 1px solid rgba(37,99,235,0.2);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .score-val { font-size: 32px; font-weight: 800; color: var(--text); line-height: 1; }
    .score-lbl { font-size: 12px; color: var(--muted); margin-top: 4px; }
    
    .filter-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 9px 12px;
      margin-bottom: 6px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 8px;
      color: var(--text);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }
    .filter-btn:hover { background: var(--panel-hover); border-color: var(--line); }
    .filter-btn.active {
      background: rgba(37, 99, 235, 0.1);
      border-color: var(--primary);
      color: var(--primary);
      font-weight: 600;
    }
    .filter-btn .count-badge {
      font-size: 11px;
      padding: 2px 7px;
      border-radius: 999px;
      background: var(--code-bg);
      color: var(--muted);
      font-weight: 600;
    }
    .filter-btn.active .count-badge {
      background: var(--primary);
      color: white;
    }
    
    .rule-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      margin-bottom: 4px;
      border-radius: 6px;
      font-size: 12px;
      color: var(--muted);
      cursor: pointer;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }
    .rule-item:hover { background: var(--panel-hover); color: var(--text); }
    .rule-item.active { background: rgba(37, 99, 235, 0.1); border-color: var(--primary); color: var(--primary); font-weight: 600; }
    .rule-item .rule-status { display: flex; align-items: center; gap: 6px; }
    .rule-dot { width: 8px; height: 8px; border-radius: 50%; }
    .rule-dot.fail { background: var(--critical); }
    .rule-dot.pass { background: var(--success); }

    /* RIGHT CONTENT */
    .content {
      flex: 1;
      padding: 24px 32px;
      max-width: 1100px;
    }
    
    .search-box {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      color: var(--text);
      font-size: 14px;
      margin-bottom: 20px;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-box:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    
    .active-filters {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      align-items: center;
      font-size: 13px;
      color: var(--muted);
      flex-wrap: wrap;
    }
    .pill {
      background: var(--primary);
      color: white;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }
    
    .finding-card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 14px;
      transition: box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .finding-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border-color: rgba(37, 99, 235, 0.3);
    }
    
    .finding-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 8px;
    }
    .finding-title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text); }
    
    .badge {
      color: white;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge.critical { background: var(--critical); }
    .badge.high { background: var(--high); }
    .badge.medium { background: var(--medium); }
    .badge.low { background: var(--low); }
    
    .finding-meta {
      font-size: 13px;
      color: var(--muted);
      margin: 6px 0 10px;
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .finding-meta strong { color: var(--text); }
    
    .code-loc {
      background: var(--code-bg);
      border: 1px solid var(--line);
      border-radius: 6px;
      padding: 6px 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      color: var(--primary);
      display: inline-block;
      margin: 6px 0 12px;
    }
    
    .recommendation-box {
      background: rgba(16, 185, 129, 0.08);
      border-left: 3px solid var(--success);
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      font-size: 13px;
      margin-top: 10px;
    }
    .recommendation-box strong { color: var(--success); }
    
    .empty-state {
      padding: 60px 20px;
      text-align: center;
      background: var(--panel);
      border: 1px dashed var(--line);
      border-radius: 12px;
      color: var(--muted);
    }
    
    .advisor-card {
      background: linear-gradient(135deg, rgba(37,99,235,0.06) 0%, rgba(147,51,234,0.08) 100%);
      border: 1px solid rgba(147,51,234,0.3);
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 24px;
    }
    .advisor-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .advisor-badge {
      background: #9333ea;
      color: white;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .advisor-score {
      font-size: 26px;
      font-weight: 800;
      color: var(--text);
    }
    .advisor-summary {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text);
      margin-bottom: 14px;
    }
    .quick-win-item {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 10px;
    }
    .diff-box {
      background: var(--code-bg);
      border-radius: 6px;
      padding: 10px;
      font-family: ui-monospace, monospace;
      font-size: 12px;
      margin-top: 8px;
      overflow-x: auto;
    }
    .diff-del { color: var(--critical); }
    .diff-add { color: var(--success); }
  </style>
</head>
<body>

  <header class="topbar">
    <div>
      <h1>🔍 Frontend Experience & Best Practice Report</h1>
      <div class="meta">${escapeHtml(result.target)} · Generated on ${new Date().toLocaleString()}</div>
    </div>
    <div style="text-align:right;">
      <span style="font-size:13px; color:var(--muted);">Total Violations: <strong>${result.findings.length}</strong></span>
    </div>
  </header>

  <div class="layout">
    <!-- LEFT SIDEBAR -->
    <aside class="sidebar" aria-label="Rule categories and filters">
      
      <!-- COMPLIANCE SCORE -->
      <div class="score-card">
        <div>
          <div class="score-val">${complianceScore}%</div>
          <div class="score-lbl">Quality & Standards Score</div>
        </div>
        <div style="font-size:28px;">${complianceScore >= 90 ? "🟢" : complianceScore >= 70 ? "🟡" : "🔴"}</div>
      </div>

      <!-- SEVERITY FILTER -->
      <div class="sidebar-section">
        <div class="sidebar-title">Severity Filters</div>
        <button class="filter-btn active" onclick="setSeverityFilter('all')">
          <span>All Severities</span>
          <span class="count-badge">${result.findings.length}</span>
        </button>
        <button class="filter-btn" onclick="setSeverityFilter('critical')">
          <span style="color:var(--critical);">🚨 Critical</span>
          <span class="count-badge">${criticalCount}</span>
        </button>
        <button class="filter-btn" onclick="setSeverityFilter('high')">
          <span style="color:var(--high);">⚠️ High</span>
          <span class="count-badge">${highCount}</span>
        </button>
        <button class="filter-btn" onclick="setSeverityFilter('medium')">
          <span style="color:var(--medium);">⚡ Medium</span>
          <span class="count-badge">${mediumCount}</span>
        </button>
        <button class="filter-btn" onclick="setSeverityFilter('low')">
          <span style="color:var(--low);">ℹ️ Low</span>
          <span class="count-badge">${lowCount}</span>
        </button>
      </div>

      <!-- CATEGORIES LIST -->
      <div class="sidebar-section">
        <div class="sidebar-title">Best Practice Categories</div>
        <button class="filter-btn active" onclick="setCategoryFilter('all')">
          <span>🌐 All Categories</span>
          <span class="count-badge">${result.findings.length}</span>
        </button>
        ${categories.map((cat) => {
          const count = counts.category[cat] || 0;
          const icon = categoryIcons[cat] || "📂";
          return `<button class="filter-btn" onclick="setCategoryFilter('${cat}')" id="cat-btn-${cat}">
            <span>${icon} ${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
            <span class="count-badge">${count}</span>
          </button>`;
        }).join("\n")}
      </div>

      <!-- DIAGNOSTIC RULES CHECKLIST -->
      <div class="sidebar-section">
        <div class="sidebar-title">
          <span>Diagnostic Rules</span>
          <span style="font-size:11px;">(${BUILTIN_RULES.length} Rules)</span>
        </div>
        <div style="max-height: 340px; overflow-y: auto; padding-right: 4px;">
          ${BUILTIN_RULES.map((rule) => {
            const count = ruleCounts.get(rule.id) || 0;
            const hasFail = count > 0;
            return `<div class="rule-item" onclick="setRuleFilter('${rule.id}')" id="rule-btn-${rule.id}" title="${escapeAttribute(rule.name)}: ${rule.description}">
              <div class="rule-status">
                <span class="rule-dot ${hasFail ? "fail" : "pass"}"></span>
                <span>${escapeHtml(rule.id)}</span>
              </div>
              <span style="font-size:11px; font-weight:600; color:${hasFail ? "var(--critical)" : "var(--success)"};">
                ${hasFail ? `${count} fail` : "✅ pass"}
              </span>
            </div>`;
          }).join("\n")}
        </div>
      </div>

    </aside>

    <!-- RIGHT CONTENT AREA -->
    <main class="content">
      ${result.aiAdvisor ? renderAdvisorSection(result.aiAdvisor) : ""}
      
      <!-- SEARCH INPUT -->
      <input type="text" id="searchInput" class="search-box" placeholder="🔍 Search issues by file path, component name, rule ID, or description..." oninput="onSearchChange()">

      <!-- ACTIVE FILTER INDICATORS -->
      <div class="active-filters" id="activeFilterBar">
        <span>Showing <strong id="visibleCount">${result.findings.length}</strong> of ${result.findings.length} issues</span>
        <span id="filterPills"></span>
      </div>

      <!-- ISSUES LIST -->
      <div id="findingsContainer">
        ${result.findings.length === 0 ? `
          <div class="empty-state">
            <h2>🎉 Zero Issues Detected</h2>
            <p>All scanned source files and pages meet 100% of the active best practices and rules.</p>
          </div>
        ` : result.findings.map((finding, idx) => `
          <article class="finding-card" 
                   id="finding-${idx + 1}"
                   data-id="${escapeAttribute(finding.id)}"
                   data-severity="${escapeAttribute(finding.severity)}" 
                   data-category="${escapeAttribute(finding.category)}" 
                   data-rule="${escapeAttribute(finding.ruleId ?? "")}" 
                   data-text="${escapeAttribute((finding.title + " " + (finding.description || "") + " " + (finding.sourceLocation?.file || "") + " " + (finding.ruleId || "")).toLowerCase())}">
            <div class="finding-head">
              <h3 class="finding-title">#${idx + 1}. ${escapeHtml(finding.title)}</h3>
              <span class="badge ${finding.severity}">${escapeHtml(finding.severity)}</span>
            </div>

            <div class="finding-meta">
              <span>Category: <strong>${categoryIcons[finding.category] || ""} ${escapeHtml(finding.category)}</strong></span>
              <span>Rule: <code>${escapeHtml(finding.ruleId ?? "custom")}</code></span>
              ${finding.standards?.[0]?.authority ? `<span>Standard: <strong>${escapeHtml(finding.standards[0].authority)}</strong></span>` : ""}
              ${finding.wcag?.length ? `<span>WCAG ${escapeHtml(finding.wcag.join(", "))}</span>` : ""}
            </div>

            ${finding.sourceLocation ? `
              <div class="code-loc">📍 <strong>Source:</strong> ${escapeHtml(finding.sourceLocation.file)}:${finding.sourceLocation.line}</div>
            ` : ""}

            <p style="margin: 8px 0; font-size:14px; color:var(--text);">${escapeHtml(finding.description)}</p>

            ${finding.recommendation ? `
              <div class="recommendation-box">
                <strong>💡 Actionable Recommendation:</strong> ${escapeHtml(finding.recommendation)}
              </div>
            ` : ""}
          </article>
        `).join("\n")}
      </div>

    </main>
  </div>

  <script>
    let currentSeverity = 'all';
    let currentCategory = 'all';
    let currentRule = 'all';
    let searchQuery = '';

    function setSeverityFilter(sev) {
      currentSeverity = sev;
      updateCards();
    }

    function setCategoryFilter(cat) {
      currentCategory = cat;
      currentRule = 'all';
      updateCards();
    }

    function setRuleFilter(ruleId) {
      currentRule = ruleId;
      updateCards();
    }

    function onSearchChange() {
      searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();
      updateCards();
    }

    function clearFilter(type) {
      if (type === 'severity') currentSeverity = 'all';
      if (type === 'category') currentCategory = 'all';
      if (type === 'rule') currentRule = 'all';
      if (type === 'search') {
        searchQuery = '';
        document.getElementById('searchInput').value = '';
      }
      updateCards();
    }

    function updateCards() {
      const cards = document.querySelectorAll('.finding-card');
      let visible = 0;

      cards.forEach(card => {
        const sev = card.getAttribute('data-severity');
        const cat = card.getAttribute('data-category');
        const rule = card.getAttribute('data-rule');
        const text = card.getAttribute('data-text');

        const matchSev = currentSeverity === 'all' || sev === currentSeverity;
        const matchCat = currentCategory === 'all' || cat === currentCategory;
        const matchRule = currentRule === 'all' || rule === currentRule;
        const matchSearch = !searchQuery || text.includes(searchQuery);

        if (matchSev && matchCat && matchRule && matchSearch) {
          card.style.display = 'block';
          visible++;
        } else {
          card.style.display = 'none';
        }
      });

      document.getElementById('visibleCount').textContent = visible;

      // Update active pills
      let pills = '';
      if (currentCategory !== 'all') {
        pills += '<span class="pill" onclick="clearFilter(\\'category\\')">Category: ' + currentCategory + ' ✕</span> ';
      }
      if (currentSeverity !== 'all') {
        pills += '<span class="pill" onclick="clearFilter(\\'severity\\')">Severity: ' + currentSeverity + ' ✕</span> ';
      }
      if (currentRule !== 'all') {
        pills += '<span class="pill" onclick="clearFilter(\\'rule\\')">Rule: ' + currentRule + ' ✕</span> ';
      }
      if (searchQuery) {
        pills += '<span class="pill" onclick="clearFilter(\\'search\\')">Search: "' + searchQuery + '" ✕</span> ';
      }
      document.getElementById('filterPills').innerHTML = pills;
    }
  </script>

</body>
</html>`;
}

function renderAdvisorSection(advisor: AdvisorReport): string {
  const scoreColor = advisor.uxMaturityScore >= 80 ? "var(--success)" : advisor.uxMaturityScore >= 60 ? "var(--medium)" : "var(--critical)";
  return `
    <section class="advisor-card">
      <div class="advisor-top">
        <div style="display:flex; align-items:center; gap:10px;">
          <span class="advisor-badge">🤖 AI UX ADVISOR</span>
          <h2 style="margin:0; font-size:18px;">Executive UX Assessment</h2>
        </div>
        <div style="text-align:right;">
          <span style="font-size:12px; color:var(--muted); display:block;">UX Maturity Score</span>
          <span class="advisor-score" style="color:${scoreColor};">${advisor.uxMaturityScore}/100</span>
        </div>
      </div>
      <div class="advisor-summary">
        ${escapeHtml(advisor.executiveSummary)}
      </div>
      ${advisor.topQuickWins && advisor.topQuickWins.length ? `
        <h4 style="margin: 16px 0 8px; font-size:13px; text-transform:uppercase; letter-spacing:0.04em; color:var(--muted);">
          🏆 Top Quick Wins & AI Fix Recommendations
        </h4>
        <div>
          ${advisor.topQuickWins.map((win) => `
            <div class="quick-win-item">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <strong>${escapeHtml(win.title)}</strong>
                <span class="badge ${win.impact}">${escapeHtml(win.impact)}</span>
              </div>
              <p style="margin: 6px 0; font-size:13px; color:var(--text);">${escapeHtml(win.rationale)}</p>
              ${win.suggestedFix ? `
                <div class="diff-box">
                  <div class="diff-del">- ${escapeHtml(win.suggestedFix.beforeCode)}</div>
                  <div class="diff-add">+ ${escapeHtml(win.suggestedFix.afterCode)}</div>
                </div>
              ` : ""}
            </div>
          `).join("\n")}
        </div>
      ` : ""}
    </section>
  `;
}
