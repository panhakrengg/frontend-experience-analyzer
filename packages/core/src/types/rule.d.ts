import type { ElementReference } from "./element.js";
import type { Evidence, FindingCategory, FindingSeverity, StandardReference, SuggestedFix } from "./finding.js";
import type { PageSnapshot } from "./page.js";
export interface RuleFindingInput {
    title?: string;
    description?: string;
    element?: ElementReference;
    evidence?: Evidence[];
    standards?: StandardReference[];
    wcag?: string[];
    recommendation?: string;
    suggestedFix?: SuggestedFix;
    confidence?: number;
    severity?: FindingSeverity;
    category?: FindingCategory;
}
export interface RuleContext {
    snapshot: PageSnapshot;
}
export interface RuleDefinition {
    id: string;
    name: string;
    category: FindingCategory;
    defaultSeverity: FindingSeverity;
    description: string;
    recommendation: string;
    standards?: StandardReference[];
    wcag?: string[];
    evaluate: (context: RuleContext) => RuleFindingInput[] | Promise<RuleFindingInput[]>;
}
//# sourceMappingURL=rule.d.ts.map