import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { JourneyConfig, JourneySummary } from "@frontend-experience-analyzer/core";
import { calculateFrictionScore } from "@frontend-experience-analyzer/browser";

describe("Phase 6 User Journey Testing", () => {
  describe("calculateFrictionScore", () => {
    it("returns 100 for perfect, fast journey with no errors", () => {
      const summary: JourneySummary = {
        totalSteps: 5,
        passedSteps: 5,
        failedSteps: 0,
        consoleErrorCount: 0,
        networkFailureCount: 0,
      };
      const score = calculateFrictionScore(summary, 2500);
      assert.equal(score, 100);
    });

    it("penalizes friction score for console errors and network failures", () => {
      const summary: JourneySummary = {
        totalSteps: 5,
        passedSteps: 5,
        failedSteps: 0,
        consoleErrorCount: 2, // -10 points
        networkFailureCount: 1, // -10 points
      };
      const score = calculateFrictionScore(summary, 3000);
      assert.equal(score, 80);
    });

    it("heavily penalizes score when steps fail", () => {
      const summary: JourneySummary = {
        totalSteps: 5,
        passedSteps: 3,
        failedSteps: 2,
        consoleErrorCount: 1,
        networkFailureCount: 1,
      };
      const score = calculateFrictionScore(summary, 4000);
      assert.ok(score < 50);
    });

    it("applies slight latency penalty for excessively slow journeys", () => {
      const summary: JourneySummary = {
        totalSteps: 5,
        passedSteps: 5,
        failedSteps: 0,
        consoleErrorCount: 0,
        networkFailureCount: 0,
      };
      const score = calculateFrictionScore(summary, 12000); // 6s over baseline
      assert.ok(score < 100 && score >= 85);
    });
  });

  describe("JourneyConfig structure", () => {
    it("validates journey definition schema", () => {
      const config: JourneyConfig = {
        name: "Test Checkout",
        description: "E-commerce checkout journey",
        viewport: "mobile",
        steps: [
          { name: "Open product", action: "goto", target: "http://localhost:4000/item" },
          { name: "Add to cart", action: "click", target: "button.add-cart" },
          { name: "Assert item in cart", action: "assert-text", target: ".cart-count", value: "1" },
        ],
      };

      assert.equal(config.steps.length, 3);
      assert.equal(config.steps[0]?.action, "goto");
      assert.equal(config.steps[1]?.action, "click");
      assert.equal(config.steps[2]?.action, "assert-text");
    });
  });
});
