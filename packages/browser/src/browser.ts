import type { Browser, Page } from "playwright";

export interface BrowserSessionOptions {
  headless?: boolean;
}

export class BrowserSession {
  private browser?: Browser;

  constructor(private readonly options: BrowserSessionOptions = {}) {}

  async newPage(): Promise<Page> {
    try {
      const { chromium } = await import("playwright");
      this.browser ??= await chromium.launch({ headless: this.options.headless ?? true });
      return this.browser.newPage();
    } catch (err) {
      throw new Error(
        "Playwright is required for browser runtime scanning. Please install it with 'npm install -g playwright' or 'npx playwright install'."
      );
    }
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
  }
}
