import assert from "node:assert/strict";
import test from "node:test";
import { assessResearchOutput, buildResearchPrompt } from "../src/runtime/research-experiment";

test("research prompt requests renderable evidence without invented image URLs", () => {
  const prompt = buildResearchPrompt("live", "Plan Tokyo shopping", undefined);
  assert.match(prompt, /map links/i);
  assert.match(prompt, /Never invent image URLs/i);
  assert.match(prompt, /citations/i);
});

test("experiment assessment distinguishes linked visual evidence from prose", () => {
  const assessment = assessResearchOutput({
    text: "Option A has ¥12,000 items, a review warning, and https://maps.google.com/example",
    sources: [{ url: "https://example.com/store" }],
    toolCalls: 1,
  });
  assert.equal(assessment.hasPrices, true);
  assert.equal(assessment.hasWarnings, true);
  assert.equal(assessment.hasMapLinks, true);
  assert.equal(assessment.sourceCount, 1);
  assert.equal(assessment.withinSearchBudget, true);
});
