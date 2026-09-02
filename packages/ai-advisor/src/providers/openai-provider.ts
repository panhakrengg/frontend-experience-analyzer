import type { AdvisorReport, AnalysisResult } from "@frontend-experience-analyzer/core";
import { MockHeuristicProvider } from "./mock-provider.js";
import type { AIProvider } from "./provider.js";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private apiKey?: string;
  private model: string;

  constructor(options: { apiKey?: string; model?: string } = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.model = options.model ?? "gpt-4o-mini";
  }

  async generateReport(analysis: AnalysisResult): Promise<AdvisorReport> {
    if (!this.apiKey) {
      const fallback = new MockHeuristicProvider();
      return fallback.generateReport(analysis);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: "You are a Principal UX & Web Accessibility Architect. Analyze scan findings and return a structured JSON AdvisorReport.",
            },
            {
              role: "user",
              content: JSON.stringify(analysis.findings.slice(0, 15)),
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return JSON.parse(content) as AdvisorReport;
      }
      throw new Error("Empty response from OpenAI API");
    } catch {
      const fallback = new MockHeuristicProvider();
      return fallback.generateReport(analysis);
    }
  }
}
