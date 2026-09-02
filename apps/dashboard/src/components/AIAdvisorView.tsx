import React from "react";
import type { AdvisorReport } from "@frontend-experience-analyzer/core";

interface AIAdvisorViewProps {
  advisor: AdvisorReport;
}

export const AIAdvisorView: React.FC<AIAdvisorViewProps> = ({ advisor }) => {
  const scoreColor =
    advisor.uxMaturityScore >= 80
      ? "var(--success)"
      : advisor.uxMaturityScore >= 50
      ? "var(--medium)"
      : "var(--critical)";

  return (
    <section className="card" style={{ marginBottom: "24px", borderLeft: `4px solid ${scoreColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "17px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px" }}>
            🤖 AI UX Advisor Insights & Code Fixes
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
            {advisor.executiveSummary}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "24px", fontWeight: "800", color: scoreColor }}>
            {advisor.uxMaturityScore}<span style={{ fontSize: "14px", color: "var(--text-muted)" }}>/100</span>
          </div>
          <div style={{ fontSize: "10px", color: "var(--text-faint)" }}>UX Maturity Score</div>
        </div>
      </div>

      <h4 style={{ fontSize: "14px", fontWeight: "700", marginTop: "16px", marginBottom: "8px" }}>
        Top Prioritized Recommendations ({advisor.topQuickWins.length} Quick Wins)
      </h4>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {advisor.topQuickWins.map((win, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--bg-sub)",
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <strong style={{ fontSize: "14px" }}>
                #{win.priority}. {win.title}
              </strong>
              <div style={{ display: "flex", gap: "6px" }}>
                <span className="badge sub">{win.category}</span>
                <span className="badge sub">Effort: {win.effort}</span>
                <span className={`badge ${win.impact}`}>{win.impact}</span>
              </div>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "6px" }}>
              {win.rationale}
            </p>

            {win.suggestedFix && (
              <div style={{ marginTop: "10px", padding: "10px", background: "var(--bg)", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--text)" }}>
                  💡 Suggested Code Patch ({win.suggestedFix.language}):
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                  {win.suggestedFix.description}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--critical)", fontWeight: "600" }}>- Before</div>
                    <pre style={{ background: "rgba(244, 63, 94, 0.05)", border: "1px solid var(--critical)", padding: "8px", borderRadius: "4px", fontSize: "11px", overflowX: "auto", fontFamily: "var(--font-mono)" }}>
                      <code>{win.suggestedFix.beforeCode}</code>
                    </pre>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--success)", fontWeight: "600" }}>+ After</div>
                    <pre style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid var(--success)", padding: "8px", borderRadius: "4px", fontSize: "11px", overflowX: "auto", fontFamily: "var(--font-mono)" }}>
                      <code>{win.suggestedFix.afterCode}</code>
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
