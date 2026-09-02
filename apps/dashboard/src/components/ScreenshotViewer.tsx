import React from "react";
import type { Finding, PageSnapshot } from "@frontend-experience-analyzer/core";

interface ScreenshotViewerProps {
  page: PageSnapshot;
  findings: Finding[];
  highlightedFindingId?: string;
  onHoverFinding: (id?: string) => void;
  onSelectFinding: (finding: Finding) => void;
}

export const ScreenshotViewer: React.FC<ScreenshotViewerProps> = ({
  page,
  findings,
  highlightedFindingId,
  onHoverFinding,
  onSelectFinding,
}) => {
  const pageFindings = findings.filter(
    (f) => f.pageUrl === page.url && f.element?.boundingBox
  );

  const docHeight = Math.max(page.metrics.documentHeight, page.viewport.height);
  const docWidth = page.viewport.width;

  if (!page.screenshotPath) {
    return null;
  }

  // Handle local vs relative assets path
  const screenshotSrc = page.screenshotPath.replace(/^.*[/\\]reports[/\\]/, "/reports/");

  return (
    <div className="card" style={{ marginBottom: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700" }}>
            Visual Overlay: {page.title || page.url}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Viewport: {page.viewport.name} ({page.viewport.width}x{page.viewport.height}) · {pageFindings.length} visual markers
          </p>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "100%",
          overflow: "auto",
          background: "var(--bg-sub)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: `${docWidth} / ${docHeight}`,
            minHeight: "400px",
          }}
        >
          <img
            src={screenshotSrc}
            alt={`Screenshot of ${page.url}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
          />

          {pageFindings.map((finding, idx) => {
            const box = finding.element?.boundingBox;
            if (!box) return null;

            const isHighlighted = highlightedFindingId === finding.id;
            const left = `${(box.x / docWidth) * 100}%`;
            const top = `${(box.y / docHeight) * 100}%`;
            const width = `${Math.min(100 - (box.x / docWidth) * 100, (box.width / docWidth) * 100)}%`;
            const height = `${Math.max(2, (box.height / docHeight) * 100)}%`;

            const color =
              finding.severity === "critical"
                ? "var(--critical)"
                : finding.severity === "high"
                ? "var(--high)"
                : "var(--medium)";

            return (
              <div
                key={finding.id}
                onMouseEnter={() => onHoverFinding(finding.id)}
                onMouseLeave={() => onHoverFinding(undefined)}
                onClick={() => onSelectFinding(finding)}
                title={`${idx + 1}. ${finding.title}`}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width,
                  height,
                  border: `2px solid ${color}`,
                  background: isHighlighted ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.15)",
                  boxShadow: isHighlighted ? `0 0 12px ${color}` : undefined,
                  cursor: "pointer",
                  borderRadius: "3px",
                  transition: "all 0.15s ease",
                  zIndex: isHighlighted ? 10 : 2,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-10px",
                    left: "-10px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: color,
                    color: "#fff",
                    fontSize: "11px",
                    fontWeight: "800",
                    display: "grid",
                    placeItems: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                  }}
                >
                  {idx + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
