import type { AnalysisResult, Finding } from "@frontend-experience-analyzer/core";

function mapSeverityToSarifLevel(severity: string): "error" | "warning" | "note" {
  switch (severity) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    default:
      return "note";
  }
}

export function formatSarif(analysis: AnalysisResult): string {
  const rulesMap = new Map<string, any>();

  for (const f of analysis.findings) {
    const ruleId = f.ruleId ?? "custom-rule";
    if (!rulesMap.has(ruleId)) {
      rulesMap.set(ruleId, {
        id: ruleId,
        name: f.title,
        shortDescription: { text: f.title },
        fullDescription: { text: f.description },
        help: { text: f.recommendation ?? f.description },
        properties: {
          category: f.category,
          precision: "high",
        },
      });
    }
  }

  const results = analysis.findings.map((f: Finding) => {
    const ruleId = f.ruleId ?? "custom-rule";
    const uri = f.sourceLocation?.file ?? (f.pageUrl ? f.pageUrl.replace(/^https?:\/\//, "") : "index.html");
    const line = f.sourceLocation?.line ?? 1;

    return {
      ruleId,
      level: mapSeverityToSarifLevel(f.severity),
      message: {
        text: `${f.title}: ${f.description}`,
      },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri,
            },
            region: {
              startLine: line,
              startColumn: f.sourceLocation?.column ?? 1,
            },
          },
        },
      ],
    };
  });

  const sarif = {
    $schema: "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Frontend Experience Analyzer",
            semanticVersion: "1.0.0",
            informationUri: "https://github.com/frontend-experience-analyzer",
            rules: Array.from(rulesMap.values()),
          },
        },
        results,
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
