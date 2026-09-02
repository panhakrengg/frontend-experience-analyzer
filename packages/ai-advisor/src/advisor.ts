import type { AdvisorReport, AnalysisResult } from "@frontend-experience-analyzer/core";
import { GeminiProvider } from "./providers/gemini-provider.js";
import { MockHeuristicProvider } from "./providers/mock-provider.js";
import { OpenAIProvider } from "./providers/openai-provider.js";
import type { AIProvider } from "./providers/provider.js";

export interface AIAdvisorOptions {
  provider?: "gemini" | "openai" | "mock" | AIProvider;
  apiKey?: string;
  model?: string;
}

export class AIAdvisor {
  private provider: AIProvider;

  constructor(options: AIAdvisorOptions = {}) {
    if (typeof options.provider === "object" && options.provider !== null) {
      this.provider = options.provider;
    } else if (options.provider === "gemini") {
      this.provider = new GeminiProvider({ apiKey: options.apiKey, model: options.model });
    } else if (options.provider === "openai") {
      this.provider = new OpenAIProvider({ apiKey: options.apiKey, model: options.model });
    } else {
      this.provider = new MockHeuristicProvider();
    }
  }

  async advise(analysis: AnalysisResult): Promise<AdvisorReport> {
    return this.provider.generateReport(analysis);
  }
}
