import React from "react";
import type { JourneyReport } from "@frontend-experience-analyzer/core";

interface JourneyTimelineProps {
  journey: JourneyReport;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ journey }) => {
  const scoreColor =
    journey.frictionScore >= 80
      ? "var(--success)"
      : journey.frictionScore >= 50
      ? "var(--medium)"
      : "var(--critical)";

  return (
    <div className="card" style={{ marginBottom: "24px", borderLeft: `4px solid ${scoreColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>Workflow: {journey.name}</h3>
          {journey.description && (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
              {journey.description}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span className={`badge ${journey.status === "passed" ? "success" : "critical"}`}>
            {journey.status.toUpperCase()}
          </span>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "22px", fontWeight: "800", color: scoreColor }}>
              {journey.frictionScore}<span style={{ fontSize: "12px", color: "var(--text-muted)" }}>/100</span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-faint)" }}>Friction Score</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "16px", margin: "14px 0", fontSize: "12px", color: "var(--text-muted)", flexWrap: "wrap" }}>
        <span>⚡ Duration: <strong>{(journey.totalDurationMs / 1000).toFixed(2)}s</strong></span>
        <span>👣 Steps: <strong>{journey.summary.passedSteps}/{journey.summary.totalSteps} passed</strong></span>
        <span>🚨 Errors: <strong>{journey.summary.consoleErrorCount}</strong></span>
        <span>🌐 Network Failures: <strong>{journey.summary.networkFailureCount}</strong></span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
        {journey.stepResults.map((stepResult, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--bg-sub)",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span>{stepResult.status === "passed" ? "✅" : stepResult.status === "failed" ? "❌" : "⏭️"}</span>
                <strong style={{ fontSize: "13px" }}>{stepResult.step.name || stepResult.step.action}</strong>
                <code className="code-pill">
                  {stepResult.step.action} {stepResult.step.target ? `"${stepResult.step.target}"` : ""}
                </code>
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{stepResult.durationMs}ms</span>
            </div>
            {stepResult.errorMessage && (
              <div style={{ marginTop: "6px", color: "var(--critical)", fontSize: "12px" }}>
                <strong>Error:</strong> {stepResult.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
