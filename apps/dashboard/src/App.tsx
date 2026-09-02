import React, { useEffect, useState } from "react";
import type { AnalysisResult, Finding, FindingCategory, FindingSeverity } from "@frontend-experience-analyzer/core";
import { Header } from "./components/Header.js";
import { SummaryMetrics } from "./components/SummaryMetrics.js";
import { FilterBar } from "./components/FilterBar.js";
import { ScreenshotViewer } from "./components/ScreenshotViewer.js";
import { FindingCard } from "./components/FindingCard.js";
import { JourneyTimeline } from "./components/JourneyTimeline.js";
import { AIAdvisorView } from "./components/AIAdvisorView.js";
import { FindingDrawer } from "./components/FindingDrawer.js";

const DEFAULT_RESULT: AnalysisResult = {
  target: "http://localhost:4000",
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  pages: [],
  findings: [],
};

export const App: React.FC = () => {
  const [data, setData] = useState<AnalysisResult>(() => {
    return (window as any).__FEA_REPORT__ ?? DEFAULT_RESULT;
  });
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [selectedSeverity, setSelectedSeverity] = useState<FindingSeverity | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<FindingCategory | undefined>();
  const [selectedViewport, setSelectedViewport] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedFindingId, setHighlightedFindingId] = useState<string | undefined>();
  const [drawerFinding, setDrawerFinding] = useState<Finding | undefined>();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Try auto-loading report.json from root if available
  useEffect(() => {
    if (!data.pages.length && !data.findings.length) {
      fetch("/report.json")
        .then((res) => res.json())
        .then((json) => setData(json))
        .catch(() => undefined);
    }
  }, []);

  const categories: FindingCategory[] = [
    "accessibility",
    "responsive",
    "visual",
    "interaction",
    "performance",
  ];

  const viewports = Array.from(new Set(data.pages.map((p) => p.viewport.name)));

  const filteredFindings = data.findings.filter((f) => {
    if (selectedSeverity && f.severity !== selectedSeverity) return false;
    if (selectedCategory && f.category !== selectedCategory) return false;
    if (selectedViewport) {
      const page = data.pages.find((p) => p.url === f.pageUrl);
      if (page && page.viewport.name !== selectedViewport) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.ruleId && f.ruleId.toLowerCase().includes(q)) ||
        (f.element?.selector && f.element.selector.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="dashboard-container">
      <Header
        data={data}
        onLoadReport={(newData) => setData(newData)}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
      />

      <SummaryMetrics
        data={data}
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
      />

      {data.aiAdvisor && <AIAdvisorView advisor={data.aiAdvisor} />}

      {data.journeys && data.journeys.map((j, i) => (
        <JourneyTimeline key={i} journey={j} />
      ))}

      {data.pages.length > 0 && (
        <ScreenshotViewer
          page={data.pages[0]!}
          findings={data.findings}
          highlightedFindingId={highlightedFindingId}
          onHoverFinding={setHighlightedFindingId}
          onSelectFinding={setDrawerFinding}
        />
      )}

      <FilterBar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        viewports={viewports}
        selectedViewport={selectedViewport}
        onSelectViewport={setSelectedViewport}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalFindings={data.findings.length}
        filteredFindings={filteredFindings.length}
      />

      <main>
        {filteredFindings.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            <h3>No findings match the selected filters</h3>
            <p style={{ fontSize: "13px", marginTop: "6px" }}>Try resetting your category or severity filters.</p>
          </div>
        ) : (
          filteredFindings.map((finding, idx) => (
            <FindingCard
              key={finding.id || idx}
              finding={finding}
              index={idx}
              isHighlighted={highlightedFindingId === finding.id}
              onHover={setHighlightedFindingId}
              onSelect={setDrawerFinding}
            />
          ))
        )}
      </main>

      <FindingDrawer
        finding={drawerFinding}
        onClose={() => setDrawerFinding(undefined)}
      />
    </div>
  );
};
