import type {
  Finding,
  FindingCategory,
  PageSnapshot,
  RuleContext,
  RuleDefinition,
  RuleFindingInput,
} from "@frontend-experience-analyzer/core";
import { BUILTIN_RULES } from "@frontend-experience-analyzer/rules";
import { generateFindingId } from "./id.js";

export interface RulesEngineOptions {
  rules?: RuleDefinition[];
  includeRules?: string[];
  excludeRules?: string[];
  includeCategories?: FindingCategory[];
  excludeCategories?: FindingCategory[];
}

export class RulesEngine {
  private rules = new Map<string, RuleDefinition>();
  private includeRules?: Set<string>;
  private excludeRules?: Set<string>;
  private includeCategories?: Set<FindingCategory>;
  private excludeCategories?: Set<FindingCategory>;

  constructor(options: RulesEngineOptions = {}) {
    const initialRules = options.rules ?? BUILTIN_RULES;
    for (const rule of initialRules) {
      this.registerRule(rule);
    }

    if (options.includeRules?.length) {
      this.includeRules = new Set(options.includeRules.map((id) => id.trim().toLowerCase()));
    }
    if (options.excludeRules?.length) {
      this.excludeRules = new Set(options.excludeRules.map((id) => id.trim().toLowerCase()));
    }
    if (options.includeCategories?.length) {
      this.includeCategories = new Set(options.includeCategories);
    }
    if (options.excludeCategories?.length) {
      this.excludeCategories = new Set(options.excludeCategories);
    }
  }

  registerRule(rule: RuleDefinition): this {
    this.rules.set(rule.id.toLowerCase(), rule);
    return this;
  }

  registerRules(rules: RuleDefinition[]): this {
    for (const rule of rules) {
      this.registerRule(rule);
    }
    return this;
  }

  getRules(): RuleDefinition[] {
    return Array.from(this.rules.values());
  }

  getActiveRules(): RuleDefinition[] {
    return this.getRules().filter((rule) => this.isRuleActive(rule));
  }

  private isRuleActive(rule: RuleDefinition): boolean {
    const ruleId = rule.id.toLowerCase();
    const category = rule.category;

    if (this.excludeRules?.has(ruleId)) return false;
    if (this.excludeCategories?.has(category)) return false;

    if (this.includeRules && !this.includeRules.has(ruleId)) return false;
    if (this.includeCategories && !this.includeCategories.has(category)) return false;

    return true;
  }

  async run(snapshot: PageSnapshot): Promise<Finding[]> {
    const context: RuleContext = { snapshot };
    const findings: Finding[] = [];
    const seenFindingIds = new Set<string>();

    for (const rule of this.getActiveRules()) {
      try {
        const rawFindings = await rule.evaluate(context);
        for (const raw of rawFindings) {
          const finding = this.normalizeFinding(rule, snapshot, raw);
          if (!seenFindingIds.has(finding.id)) {
            seenFindingIds.add(finding.id);
            findings.push(finding);
          }
        }
      } catch (error) {
        console.error(`Rule "${rule.id}" failed on ${snapshot.url}:`, error);
      }
    }

    return findings;
  }

  async runAll(snapshots: PageSnapshot[]): Promise<Finding[]> {
    const allFindings: Finding[] = [];
    for (const snapshot of snapshots) {
      const pageFindings = await this.run(snapshot);
      allFindings.push(...pageFindings);
    }
    return allFindings;
  }

  private normalizeFinding(
    rule: RuleDefinition,
    snapshot: PageSnapshot,
    input: RuleFindingInput,
  ): Finding {
    const category = input.category ?? rule.category;
    const severity = input.severity ?? rule.defaultSeverity;
    const id = generateFindingId(rule.id, category, snapshot.url, input.element);

    return {
      id,
      ruleId: rule.id,
      pageUrl: snapshot.url,
      category,
      severity,
      title: input.title ?? rule.name,
      description: input.description ?? rule.description,
      element: input.element,
      evidence: input.evidence ?? [],
      standards: input.standards ?? rule.standards,
      wcag: input.wcag ?? rule.wcag,
      recommendation: input.recommendation ?? rule.recommendation,
      suggestedFix: input.suggestedFix,
      confidence: input.confidence ?? 1.0,
    };
  }
}
