import React from "react";
import type { Finding } from "@frontend-experience-analyzer/core";

interface FindingCardProps {
  finding: Finding;
  index: number;
  isHighlighted?: boolean;
  onHover: (id?: string) => void;
  onSelect: (finding: Finding) => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  index,
  isHighlighted,
  onHover,
  onSelect,
}) => {
  return (
    <div
      className="card"
      onMouseEnter={() => onHover(finding.id)}
      onMouseLeave={() => onHover(undefined)}
      onClick={() => onSelect(finding)}
      style={{
        cursor: "pointer",
        marginBottom: "12px",
        borderLeft: `4px solid var(--${finding.severity})`,
        transform: isHighlighted ? "scale(1.01)" : undefined,
        borderColor: isHighlighted ? "var(--border-focus)" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--text-muted)" }}>#{index + 1}</span>
          <h4 style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)" }}>{finding.title}</h4>
        </div>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
          {(finding.wcag ?? []).map((w) => (
            <span key={w} className="badge sub">WCAG {w}</span>
          ))}
          <span className={`badge ${finding.severity}`}>{finding.severity}</span>
        </div>
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
        {finding.description}
      </p>

      {finding.recommendation && (
        <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "6px" }}>
          💡 <strong>Fix:</strong> {finding.recommendation}
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "10px", flexWrap: "wrap", fontSize: "11px", color: "var(--text-muted)" }}>
        <span>Rule: <code className="code-pill">{finding.ruleId ?? "custom"}</code></span>
        <span>Category: <code className="code-pill">{finding.category}</code></span>
        {finding.sourceLocation && (
          <span>📁 Source: <code className="code-pill">{finding.sourceLocation.file}:{finding.sourceLocation.line}</code></span>
        )}
        {finding.element?.selector && (
          <span>Target: <code className="code-pill">{finding.element.selector}</code></span>
        )}
      </div>
    </div>
  );
};
