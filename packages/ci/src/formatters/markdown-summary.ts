import type { AnalysisResult, RegressionDiff } from "@frontend-experience-analyzer/core";

export function formatMarkdownSummary(analysis: AnalysisResult, diff?: RegressionDiff): string {
  const critical = analysis.findings.filter((f) => f.severity === "critical").length;
  const high = analysis.findings.filter((f) => f.severity === "high").length;
  const medium = analysis.findings.filter((f) => f.severity === "medium").length;
  const low = analysis.findings.filter((f) => f.severity === "low").length;

  let md = `## 🔍 Frontend Experience Analyzer Report\n\n`;
  md += `**Target:** \`${analysis.target}\` | **Scanned:** ${analysis.completedAt}\n\n`;

  md += `### 📊 Health Overview\n\n`;
  md += `| Total Issues | 🚨 Critical | ⚠️ High | 🟡 Medium | ℹ️ Low |\n`;
  md += `| :---: | :---: | :---: | :---: | :---: |\n`;
  md += `| **${analysis.findings.length}** | **${critical}** | **${high}** | **${medium}** | **${low}** |\n\n`;

  if (diff) {
    const deltaSign = diff.scoreDelta >= 0 ? `+${diff.scoreDelta}` : `${diff.scoreDelta}`;
    md += `### 🔄 Regression & Diff Analysis\n\n`;
    md += `- **New Issues (Regressions):** 🚨 \`${diff.newFindings.length}\`\n`;
    md += `- **Resolved Issues (Fixed):** ✨ \`${diff.resolvedFindings.length}\`\n`;
    md += `- **Unchanged Issues:** 📌 \`${diff.unchangedFindings.length}\`\n`;
    md += `- **Score Change:** \`${deltaSign} pts\`\n\n`;

    if (diff.newFindings.length > 0) {
      md += `#### 🚨 New Issues Introduced in this PR:\n\n`;
      md += `| Severity | Rule | Finding Title | Source |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const f of diff.newFindings) {
        const src = f.sourceLocation ? `\`${f.sourceLocation.file}:${f.sourceLocation.line}\`` : "—";
        md += `| \`${f.severity.toUpperCase()}\` | \`${f.ruleId ?? "custom"}\` | ${f.title} | ${src} |\n`;
      }
      md += `\n`;
    }
  }

  if (analysis.aiAdvisor) {
    md += `### 🤖 AI UX Advisor Insights\n\n`;
    md += `**UX Maturity Rating:** \`${analysis.aiAdvisor.uxMaturityScore}/100\`\n\n`;
    md += `> ${analysis.aiAdvisor.executiveSummary}\n\n`;
  }

  return md;
}
