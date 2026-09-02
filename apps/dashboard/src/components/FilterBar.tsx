import React from "react";
import type { FindingCategory } from "@frontend-experience-analyzer/core";

interface FilterBarProps {
  categories: FindingCategory[];
  selectedCategory?: FindingCategory;
  onSelectCategory: (category?: FindingCategory) => void;
  viewports: string[];
  selectedViewport?: string;
  onSelectViewport: (viewport?: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalFindings: number;
  filteredFindings: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  viewports,
  selectedViewport,
  onSelectViewport,
  searchQuery,
  onSearchChange,
  totalFindings,
  filteredFindings,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "20px",
        padding: "12px 16px",
        background: "var(--bg-card)",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Category:</span>
        <button
          className={`btn ${!selectedCategory ? "btn-primary" : ""}`}
          onClick={() => onSelectCategory(undefined)}
          style={{ padding: "4px 10px", fontSize: "12px" }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn ${selectedCategory === cat ? "btn-primary" : ""}`}
            onClick={() => onSelectCategory(selectedCategory === cat ? undefined : cat)}
            style={{ padding: "4px 10px", fontSize: "12px", textTransform: "capitalize" }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        {viewports.length > 1 && (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: "600" }}>Viewport:</span>
            <select
              value={selectedViewport ?? ""}
              onChange={(e) => onSelectViewport(e.target.value || undefined)}
              style={{
                background: "var(--bg-sub)",
                border: "1px solid var(--border)",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            >
              <option value="">All Viewports</option>
              {viewports.map((vp) => (
                <option key={vp} value={vp}>
                  {vp}
                </option>
              ))}
            </select>
          </div>
        )}

        <input
          type="text"
          placeholder="Filter by keyword / rule / ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: "var(--bg-sub)",
            border: "1px solid var(--border)",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "13px",
            width: "220px",
          }}
        />

        <span style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          Showing <strong>{filteredFindings}</strong> of {totalFindings}
        </span>
      </div>
    </div>
  );
};
