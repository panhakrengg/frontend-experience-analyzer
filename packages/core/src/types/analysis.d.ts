import type { Finding } from "./finding";
import type { PageSnapshot } from "./page";
export interface AnalysisResult {
    target: string;
    startedAt: string;
    completedAt: string;
    pages: PageSnapshot[];
    findings: Finding[];
}
//# sourceMappingURL=analysis.d.ts.map