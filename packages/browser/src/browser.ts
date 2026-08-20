import { chromium, type Browser, type Page } from "playwright";

export interface BrowserSessionOptions {
  headless?: boolean;
}

export class BrowserSession {
  private browser?: Browser;

  constructor(private readonly options: BrowserSessionOptions = {}) {}

  async newPage(): Promise<Page> {
    this.browser ??= await chromium.launch({ headless: this.options.headless ?? true });
    return this.browser.newPage();
  }

  async close(): Promise<void> {
    await this.browser?.close();
    this.browser = undefined;
  }
}
