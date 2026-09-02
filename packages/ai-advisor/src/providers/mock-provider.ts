import type {
  AdvisorFix,
  AdvisorRecommendation,
  AdvisorReport,
  AnalysisResult,
  Finding,
} from "@frontend-experience-analyzer/core";
import type { AIProvider } from "./provider.js";

export class MockHeuristicProvider implements AIProvider {
  name = "mock-heuristic";

  async generateReport(analysis: AnalysisResult): Promise<AdvisorReport> {
    const findings = analysis.findings;
    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;

    // UX Maturity Calculation (0 - 100)
    let uxMaturityScore = 100;
    uxMaturityScore -= criticalCount * 25;
    uxMaturityScore -= highCount * 8;
    uxMaturityScore -= mediumCount * 3;
    uxMaturityScore = Math.max(10, Math.min(100, uxMaturityScore));

    const executiveSummary = generateExecutiveSummary(analysis, uxMaturityScore, criticalCount, highCount);
    const recommendations = synthesizeRecommendations(findings);
    const topQuickWins = recommendations.slice(0, 3);

    return {
      executiveSummary,
      uxMaturityScore,
      topQuickWins,
      recommendations,
    };
  }
}

function generateExecutiveSummary(
  analysis: AnalysisResult,
  score: number,
  criticalCount: number,
  highCount: number
): string {
  const grade = score >= 85 ? "Grade A (Strong UX)" : score >= 70 ? "Grade B (Moderate Friction)" : score >= 50 ? "Grade C (Substantial UX Debt)" : "Grade D (Critical Usability Failures)";
  return `The automated Frontend Experience Analysis evaluated ${analysis.pages.length} page viewports across accessibility, responsive layout, and interaction behavior. The application received an overall UX Maturity Rating of ${score}/100 (${grade}). Key focus areas include resolving ${criticalCount} blocker issues and ${highCount} high-priority accessibility/layout defects to improve user conversion and accessibility compliance.`;
}

function synthesizeRecommendations(findings: Finding[]): AdvisorRecommendation[] {
  const recs: AdvisorRecommendation[] = [];

  // 1. Accessibility quick wins
  const imgAltFindings = findings.filter((f) => f.ruleId === "image-alt");
  if (imgAltFindings.length > 0) {
    recs.push({
      priority: 1,
      title: "Add Descriptive Alt Attributes to Informative Images",
      category: "accessibility",
      impact: "high",
      effort: "low",
      rationale: `${imgAltFindings.length} images are missing alternative text, preventing screen reader users from understanding essential visual context (WCAG 1.1.1).`,
      relatedFindingIds: imgAltFindings.map((f) => f.id),
      suggestedFix: {
        title: "Add descriptive alt attributes",
        description: "Specify a meaningful alt attribute for informative images or alt='' for decorative assets.",
        language: "html",
        beforeCode: `<img src="/images/hero-banner.png">\n<img src="/icons/star.svg">`,
        afterCode: `<img src="/images/hero-banner.png" alt="Annual Developer Conference keynote speaker">\n<img src="/icons/star.svg" alt="" aria-hidden="true">`,
      },
    });
  }

  // 2. Touch target & spacing fixes
  const targetFindings = findings.filter((f) => f.ruleId === "target-size" || f.ruleId === "touch-target-spacing");
  if (targetFindings.length > 0) {
    recs.push({
      priority: 2,
      title: "Expand Touch Targets to Meet Minimum 44x44px Guidelines",
      category: "responsive",
      impact: "high",
      effort: "low",
      rationale: "Interactive controls smaller than 24px cause tap mistakes and user frustration on mobile devices (WCAG 2.5.5 / 2.5.8).",
      relatedFindingIds: targetFindings.map((f) => f.id),
      suggestedFix: {
        title: "Add min-width / min-height and touch padding",
        description: "Ensure buttons and icon toggles have adequate tap area.",
        language: "css",
        beforeCode: `.icon-button {\n  width: 18px;\n  height: 18px;\n  padding: 0;\n}`,
        afterCode: `.icon-button {\n  min-width: 44px;\n  min-height: 44px;\n  padding: 10px;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n}`,
      },
    });
  }

  // 3. Modal keyboard & Escape trap fix
  const modalFindings = findings.filter((f) => f.ruleId === "modal-escape-close" || f.ruleId === "focus-lost");
  if (modalFindings.length > 0) {
    recs.push({
      priority: 3,
      title: "Implement Keyboard Dismissal & Focus Return on Modal Dialogs",
      category: "interaction",
      impact: "critical",
      effort: "medium",
      rationale: "Modal dialogs that cannot be dismissed via Escape key or lose focus on close trap keyboard navigators (WCAG 2.1.2).",
      relatedFindingIds: modalFindings.map((f) => f.id),
      suggestedFix: {
        title: "Escape key listener hook in React",
        description: "Handle Escape key press and restore focus to the trigger element on close.",
        language: "tsx",
        beforeCode: `function Modal({ isOpen, onClose, children }) {\n  if (!isOpen) return null;\n  return <div className="modal">{children}</div>;\n}`,
        afterCode: `function Modal({ isOpen, onClose, triggerRef, children }) {\n  useEffect(() => {\n    const onKeyDown = (e: KeyboardEvent) => {\n      if (e.key === "Escape") {\n        onClose();\n        triggerRef?.current?.focus();\n      }\n    };\n    window.addEventListener("keydown", onKeyDown);\n    return () => window.removeEventListener("keydown", onKeyDown);\n  }, [isOpen, onClose, triggerRef]);\n\n  if (!isOpen) return null;\n  return <div role="dialog" aria-modal="true" className="modal">{children}</div>;\n}`,
      },
    });
  }

  // 4. Responsive layout clipping
  const layoutFindings = findings.filter((f) => f.ruleId === "clipped-text" || f.ruleId === "fixed-width-layout");
  if (layoutFindings.length > 0) {
    recs.push({
      priority: 4,
      title: "Replace Fixed Widths and Hidden Overflow with Responsive Fluid Containers",
      category: "responsive",
      impact: "high",
      effort: "medium",
      rationale: "Fixed pixel dimensions cause horizontal scroll and text truncation on smaller viewport sizes.",
      relatedFindingIds: layoutFindings.map((f) => f.id),
      suggestedFix: {
        title: "Use max-width and min-height instead of fixed bounds",
        description: "Allow layout containers to expand vertically to accommodate localized or wrapped text.",
        language: "css",
        beforeCode: `.card-container {\n  width: 800px;\n  height: 60px;\n  overflow: hidden;\n}`,
        afterCode: `.card-container {\n  width: 100%;\n  max-width: 800px;\n  min-height: 60px;\n  overflow: visible;\n}`,
      },
    });
  }

  // Fallback generic recommendation if no specific rules matched
  if (recs.length === 0) {
    recs.push({
      priority: 1,
      title: "Maintain Clean Frontend Hygiene and Automated Regression Checks",
      category: "quality",
      impact: "low",
      effort: "low",
      rationale: "No critical rule violations were flagged in this scan. Continue scanning on pull requests to prevent regressions.",
      relatedFindingIds: [],
    });
  }

  return recs;
}
