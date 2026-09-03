import type { AdvisorReport, AnalysisResult } from "@frontend-experience-analyzer/core";
import { MockHeuristicProvider } from "./mock-provider.js";
import type { AIProvider } from "./provider.js";

export class GeminiProvider implements AIProvider {
  name = "gemini";
  private apiKey?: string;
  private model: string;

  constructor(options: { apiKey?: string; model?: string } = {}) {
    this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY;
    this.model = options.model ?? "gemini-2.0-flash";
  }

  async generateReport(analysis: AnalysisResult): Promise<AdvisorReport> {
    if (!this.apiKey) {
      // Fallback seamlessly to deterministic heuristic provider if no key provided
      const fallback = new MockHeuristicProvider();
      return fallback.generateReport(analysis);
    }

    try {
      const prompt = buildAdvisorPrompt(analysis);
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-goog-api-key": this.apiKey,
      };
      if (this.apiKey.startsWith("AQ.")) {
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API HTTP ${response.status} (${response.statusText}): ${errText}`);
      }

      const data = await response.json();
      const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (jsonText) {
        console.log(`✨ Successfully generated AI UX analysis via Google Gemini (${this.model})`);
        return JSON.parse(jsonText) as AdvisorReport;
      }
      throw new Error("Empty response from Gemini API");
    } catch (err) {
      console.warn(`⚠️  Gemini API warning: ${err instanceof Error ? err.message : String(err)}`);
      console.log(`ℹ️  Falling back to offline deterministic heuristic AI provider.`);
      const fallback = new MockHeuristicProvider();
      return fallback.generateReport(analysis);
    }
  }
}

function buildAdvisorPrompt(analysis: AnalysisResult): string {
  return `You are a Principal Frontend Architect and UX Expert. Analyze the following automated Frontend Experience Analyzer findings and output an AdvisorReport JSON object with:
- executiveSummary (string)
- uxMaturityScore (number between 0 and 100)
- topQuickWins (array of AdvisorRecommendation with suggestedFix code diffs)
- recommendations (array of AdvisorRecommendation)

Analysis Data:
Target: ${analysis.target}
Findings Count: ${analysis.findings.length}
Findings Sample:
${JSON.stringify(analysis.findings.slice(0, 15), null, 2)}
`;
}
