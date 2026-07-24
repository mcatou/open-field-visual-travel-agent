import assert from "node:assert/strict";
import test from "node:test";
import { demoPlaces } from "../src/data/demo-places";
import { fashionStoreCovers } from "../src/data/fashion-store-covers";

const fashionStoreIds = [
  "fashion-auralee-tokyo",
  "fashion-aton-aoyama",
  "fashion-mame-aoyama",
  "fashion-cfcl-omotesando",
  "fashion-shibuya-parco",
] as const;

test("gives every fashion stop a sourced boutique cover separate from product samples", () => {
  assert.deepEqual(Object.keys(fashionStoreCovers).filter((id) => id.startsWith("fashion-")), [...fashionStoreIds]);
  for (const placeId of fashionStoreIds) {
    const cover = fashionStoreCovers[placeId];
    assert.match(cover.src, /^https:\/\//);
    assert.match(cover.sourceUrl, /^https:\/\//);
    assert.match(cover.title, /boutique|store/i);
    assert.equal(cover.role, "store_cover");
    assert.match(cover.capturedAt, /^2026-07-23T/);
  }
});

test("replaces AURALEE editorial images with five priced retail-ready items", () => {
  const auralee = demoPlaces.find((place) => place.placeId === "fashion-auralee-tokyo");
  assert.ok(auralee);
  assert.equal(auralee.media?.length, 5);
  for (const item of auralee.media ?? []) {
    assert.match(item.sourceUrl, /^https:\/\/auralee\.jp\/item\/detail\//);
    assert.match(item.localAssetRef ?? "", /^https:\/\/auralee\.jp\/photo\//);
    assert.ok((item.priceJpy ?? 0) > 0);
    assert.doesNotMatch(item.sourceLabel, /lookbook|editorial/i);
  }
});
