import type { Finding, FindingCategory, FindingSeverity } from "@frontend-experience-analyzer/core";

export interface FindingCounts {
  severity: Record<FindingSeverity, number>;
  category: Record<FindingCategory, number>;
}

export function countFindings(findings: Finding[]): FindingCounts {
  const severity: Record<FindingSeverity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  const category: Record<FindingCategory, number> = {
    accessibility: 0,
    ux: 0,
    responsive: 0,
    visual: 0,
    interaction: 0,
    performance: 0,
    security: 0,
  };

  for (const finding of findings) {
    if (finding.severity in severity) {
      severity[finding.severity] += 1;
    }
    if (finding.category in category) {
      category[finding.category] += 1;
    }
  }

  return { severity, category };
}

export function formatValue(value: unknown, unit?: string): string {
  if (value === undefined || value === null) return "-";
  const formatted = typeof value === "number" ? Number(value.toFixed(2)).toString() : String(value);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

export function toReportRelativeAssetPath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  const assetsIndex = normalized.lastIndexOf("/assets/");
  if (assetsIndex >= 0) return normalized.slice(assetsIndex + 1);
  if (normalized.startsWith("assets/")) return normalized;
  return normalized;
}
