import React, { useRef } from "react";
import type { AnalysisResult } from "@frontend-experience-analyzer/core";
import { exportToCsv, exportToJson } from "../utils/export.js";

interface HeaderProps {
  data: AnalysisResult;
  onLoadReport: (data: AnalysisResult) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  data,
  onLoadReport,
  theme,
  onToggleTheme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onLoadReport(json);
      } catch (err) {
        alert("Failed to parse JSON report file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "28px" }}>🔍</span>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-0.5px" }}>Frontend Experience Dashboard</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Target: <strong style={{ color: "var(--text)" }}>{data.target}</strong> · {new Date(data.completedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <button className="btn" onClick={() => fileInputRef.current?.click()} title="Load report.json from disk">
          📂 Load JSON
        </button>
        <button className="btn" onClick={() => exportToCsv(data)} title="Export findings to CSV">
          📊 Export CSV
        </button>
        <button className="btn" onClick={() => exportToJson(data)} title="Export report to JSON">
          💾 Export JSON
        </button>
        <button className="btn" onClick={onToggleTheme} title="Toggle theme">
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </header>
  );
};
