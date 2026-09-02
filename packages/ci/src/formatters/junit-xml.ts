import type { AnalysisResult } from "@frontend-experience-analyzer/core";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatJunitXml(analysis: AnalysisResult): string {
  const failures = analysis.findings.filter((f) => f.severity === "critical" || f.severity === "high");
  const testsCount = Math.max(analysis.findings.length, 1);
  const failureCount = failures.length;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<testsuites name="Frontend Experience Analyzer" tests="${testsCount}" failures="${failureCount}" errors="0" time="0.0">\n`;
  xml += `  <testsuite name="Frontend Audit" tests="${testsCount}" failures="${failureCount}" errors="0">\n`;

  if (analysis.findings.length === 0) {
    xml += `    <testcase classname="Audit.Clean" name="No frontend experience findings detected" time="0.0"/>\n`;
  } else {
    for (const finding of analysis.findings) {
      const className = `Audit.${escapeXml(finding.category)}`;
      const name = `${escapeXml(finding.ruleId ?? "rule")}: ${escapeXml(finding.title)}`;
      const isFailure = finding.severity === "critical" || finding.severity === "high";

      xml += `    <testcase classname="${className}" name="${name}" time="0.0">\n`;
      if (isFailure) {
        xml += `      <failure message="${escapeXml(finding.description)}" type="${escapeXml(finding.severity)}">\n`;
        xml += `Category: ${escapeXml(finding.category)}\n`;
        xml += `Severity: ${escapeXml(finding.severity)}\n`;
        if (finding.element?.selector) xml += `Target: ${escapeXml(finding.element.selector)}\n`;
        if (finding.recommendation) xml += `Recommendation: ${escapeXml(finding.recommendation)}\n`;
        xml += `      </failure>\n`;
      }
      xml += `    </testcase>\n`;
    }
  }

  xml += `  </testsuite>\n`;
  xml += `</testsuites>\n`;
  return xml;
}
