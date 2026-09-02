export interface WebVitals {
  lcp?: number; // ms
  cls?: number; // unitless score
  fcp?: number; // ms
  ttfb?: number; // ms
  inp?: number; // ms
}

export interface ResourceBreakdown {
  jsBytes: number;
  cssBytes: number;
  imageBytes: number;
  fontBytes: number;
  totalBytes: number;
  requestCount: number;
}

export interface PerformanceMetrics {
  webVitals: WebVitals;
  resourceBreakdown: ResourceBreakdown;
}

export interface SecurityMetrics {
  hasCsp: boolean;
  isHttps: boolean;
  mixedContentCount: number;
  insecureLinksCount: number;
}
