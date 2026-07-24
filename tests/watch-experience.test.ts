import assert from "node:assert/strict";
import test from "node:test";

import {
  buildWatchExperience,
  rankVisualSections,
} from "../src/runtime/open-field-experience";

test("ranks decisive, actionable content above optional logistics", () => {
  const ranked = rankVisualSections([
    {
      id: "transport",
      role: "route",
      userRelevance: 2,
      actionability: 3,
      evidence: 4,
      urgency: 1,
      complexity: 3,
      optional: true,
    },
    {
      id: "visitor-savings",
      role: "answer",
      userRelevance: 5,
      actionability: 5,
      evidence: 4,
      urgency: 3,
      complexity: 1,
    },
    {
      id: "stores",
      role: "comparison",
      userRelevance: 5,
      actionability: 4,
      evidence: 5,
      urgency: 2,
      complexity: 2,
    },
  ]);

  assert.deepEqual(ranked.map((section) => section.id), [
    "visitor-savings",
    "stores",
    "transport",
  ]);
});

test("builds the watch response around visitor value and possible stock", () => {
  const experience = buildWatchExperience();

  assert.deepEqual(experience.sections.map((section) => section.id), [
    "visitor-savings",
    "store-search",
    "model",
    "tokyo-station-route",
    "airport-contingency",
  ]);
  assert.equal(experience.primaryBenefit.storeId, "mitsukoshi");
  assert.match(experience.primaryBenefit.headline, /5% visitor app coupon/i);
  assert.match(experience.primaryBenefit.body, /confirm.*Grand Seiko/i);
  assert.match(experience.secondaryBenefit.body, /next day/i);
  assert.match(experience.secondaryBenefit.body, /not.*this purchase/i);
  assert.equal(experience.transport.defaultOpen, false);
  assert.equal(experience.airport.defaultOpen, false);
  assert.doesNotMatch(
    JSON.stringify(experience),
    /minutes used|remaining buffer|time elapsed/i,
  );
});

test("keeps sourced benefit links attached to the claims they support", () => {
  const experience = buildWatchExperience();

  assert.match(experience.primaryBenefit.sourceUrl, /^https:\/\//);
  assert.match(experience.secondaryBenefit.sourceUrl, /^https:\/\//);
  assert.ok(experience.storeCards.every((store) => /^https:\/\//.test(store.storeUrl)));
  assert.ok(experience.storeCards.every((store) => /^https:\/\//.test(store.mapsUrl)));
});
