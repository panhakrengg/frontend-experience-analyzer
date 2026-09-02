import React from "react";
import type { AnalysisResult, FindingSeverity } from "@frontend-experience-analyzer/core";

interface SummaryMetricsProps {
  data: AnalysisResult;
  selectedSeverity?: FindingSeverity;
  onSelectSeverity: (severity?: FindingSeverity) => void;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({
  data,
  selectedSeverity,
  onSelectSeverity,
}) => {
  const counts = {
    critical: data.findings.filter((f) => f.severity === "critical").length,
    high: data.findings.filter((f) => f.severity === "high").length,
    medium: data.findings.filter((f) => f.severity === "medium").length,
    low: data.findings.filter((f) => f.severity === "low").length,
  };

  // UX Health Score: 100 max, minus penalties
  const healthScore = Math.max(
    0,
    100 - counts.critical * 25 - counts.high * 10 - counts.medium * 4 - counts.low * 1
  );

  const scoreColor =
    healthScore >= 80 ? "var(--success)" : healthScore >= 50 ? "var(--medium)" : "var(--critical)";

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
      }}
    >
      <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
          UX Health Score
        </div>
        <div style={{ fontSize: "32px", fontWeight: "800", color: scoreColor, marginTop: "4px" }}>
          {healthScore}<span style={{ fontSize: "18px", color: "var(--text-muted)" }}>/100</span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-faint)" }}>
          {healthScore >= 80 ? "Excellent user experience" : "Requires attention"}
        </div>
      </div>

      <div
        className="card"
        onClick={() => onSelectSeverity(selectedSeverity === "critical" ? undefined : "critical")}
        style={{
          cursor: "pointer",
          border: selectedSeverity === "critical" ? "2px solid var(--critical)" : undefined,
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--critical)", fontWeight: "700", textTransform: "uppercase" }}>
          Critical Issues
        </div>
        <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--critical)", marginTop: "4px" }}>
          {counts.critical}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-faint)" }}>Blockers & severe failures</div>
      </div>

      <div
        className="card"
        onClick={() => onSelectSeverity(selectedSeverity === "high" ? undefined : "high")}
        style={{
          cursor: "pointer",
          border: selectedSeverity === "high" ? "2px solid var(--high)" : undefined,
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--high)", fontWeight: "700", textTransform: "uppercase" }}>
          High Priority
        </div>
        <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--high)", marginTop: "4px" }}>
          {counts.high}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-faint)" }}>WCAG & layout violations</div>
      </div>

      <div
        className="card"
        onClick={() => onSelectSeverity(selectedSeverity === "medium" ? undefined : "medium")}
        style={{
          cursor: "pointer",
          border: selectedSeverity === "medium" ? "2px solid var(--medium)" : undefined,
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--medium)", fontWeight: "700", textTransform: "uppercase" }}>
          Medium / Warnings
        </div>
        <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--medium)", marginTop: "4px" }}>
          {counts.medium}
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-faint)" }}>Usability & spacing flaws</div>
      </div>

      <div className="card">
        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase" }}>
          Coverage
        </div>
        <div style={{ fontSize: "32px", fontWeight: "800", color: "var(--text)", marginTop: "4px" }}>
          {data.pages.length} <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>pages</span>
        </div>
        <div style={{ fontSize: "11px", color: "var(--text-faint)" }}>
          {data.journeys?.length ?? 0} user journeys recorded
        </div>
      </div>
    </section>
  );
};
