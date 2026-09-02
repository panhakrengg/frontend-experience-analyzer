import React from "react";
import type { Finding } from "@frontend-experience-analyzer/core";

interface FindingDrawerProps {
  finding?: Finding;
  onClose: () => void;
}

export const FindingDrawer: React.FC<FindingDrawerProps> = ({ finding, onClose }) => {
  if (!finding) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              <span className={`badge ${finding.severity}`}>{finding.severity}</span>
              <span className="badge sub">{finding.category}</span>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--text)" }}>{finding.title}</h2>
          </div>
          <button className="btn" onClick={onClose} style={{ padding: "4px 10px" }}>✕</button>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
            Description
          </h4>
          <p style={{ fontSize: "14px", color: "var(--text)" }}>{finding.description}</p>
        </div>

        {finding.recommendation && (
          <div style={{ marginBottom: "20px", padding: "12px", background: "var(--bg-sub)", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <h4 style={{ fontSize: "12px", color: "var(--high)", textTransform: "uppercase", marginBottom: "4px" }}>
              💡 Recommended Solution
            </h4>
            <p style={{ fontSize: "13px" }}>{finding.recommendation}</p>
          </div>
        )}

        {finding.element?.htmlSnippet && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              DOM Snippet
            </h4>
            <pre style={{ background: "var(--bg-sub)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", fontSize: "12px", overflowX: "auto", fontFamily: "var(--font-mono)" }}>
              <code>{finding.element.htmlSnippet}</code>
            </pre>
          </div>
        )}

        {finding.evidence && finding.evidence.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Evidence & Metrics
            </h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "6px", color: "var(--text-muted)" }}>Property</th>
                  <th style={{ padding: "6px", color: "var(--text-muted)" }}>Actual</th>
                  <th style={{ padding: "6px", color: "var(--text-muted)" }}>Expected</th>
                </tr>
              </thead>
              <tbody>
                {finding.evidence.map((ev, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px" }}><code>{ev.property}</code></td>
                    <td style={{ padding: "6px", color: "var(--critical)" }}>{String(ev.actual)}</td>
                    <td style={{ padding: "6px", color: "var(--success)" }}>{ev.expected ? String(ev.expected) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {finding.standards && finding.standards.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px" }}>
              Standards Compliance
            </h4>
            {finding.standards.map((st, i) => (
              <div key={i} style={{ fontSize: "13px", marginTop: "4px" }}>
                <span>{st.authority} {st.name}: <strong>{st.criterion}</strong></span>
                {st.url && (
                  <div>
                    <a href={st.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px" }}>
                      Read Official WCAG Criterion ↗
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: "12px", color: "var(--text-faint)", marginTop: "24px" }}>
          Finding ID: <code>{finding.id}</code>
        </div>
      </div>
    </div>
  );
};
