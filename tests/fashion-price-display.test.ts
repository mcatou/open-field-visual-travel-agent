import assert from "node:assert/strict";
import test from "node:test";
import {
  FASHION_FX_SNAPSHOT,
  formatApproxUsd,
  formatJpy,
  formatMediaPrice,
} from "../src/data/fashion-price-display";

test("formats exact yen and explicitly approximate US-dollar prices", () => {
  assert.equal(formatJpy(52_800), "¥52,800");
  assert.equal(formatApproxUsd(52_800), "≈$323");
  assert.deepEqual(formatMediaPrice(52_800), {
    jpy: "¥52,800",
    usd: "≈$323",
    status: "listed",
  });
});

test("does not invent a price for editorial-only images", () => {
  assert.deepEqual(formatMediaPrice(undefined), {
    jpy: "Price not listed",
    usd: "Editorial reference",
    status: "unlisted",
  });
});

test("keeps the conversion snapshot attributable and time-bounded", () => {
  assert.equal(FASHION_FX_SNAPSHOT.jpyPerUsd, 163.315);
  assert.equal(FASHION_FX_SNAPSHOT.capturedAt, "2026-07-23T17:00:00+09:00");
  assert.match(FASHION_FX_SNAPSHOT.sourceUrl, /boj\.or\.jp/);
  assert.match(FASHION_FX_SNAPSHOT.supports, /midpoint/i);
  assert.match(FASHION_FX_SNAPSHOT.doesNotSupport, /checkout|future/i);
});
