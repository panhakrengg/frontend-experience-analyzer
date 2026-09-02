import type { AnalysisResult } from "@frontend-experience-analyzer/core";

export function exportToJson(data: AnalysisResult): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  downloadBlob(blob, `fea-report-${Date.now()}.json`);
}

export function exportToCsv(data: AnalysisResult): void {
  const headers = ["ID", "Rule", "Category", "Severity", "Page", "Title", "Selector", "Confidence"];
  const rows = data.findings.map((f) => [
    `"${f.id}"`,
    `"${f.ruleId ?? ""}"`,
    `"${f.category}"`,
    `"${f.severity}"`,
    `"${f.pageUrl ?? ""}"`,
    `"${f.title.replace(/"/g, '""')}"`,
    `"${f.element?.selector?.replace(/"/g, '""') ?? ""}"`,
    `"${Math.round(f.confidence * 100)}%"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, `fea-findings-${Date.now()}.csv`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
