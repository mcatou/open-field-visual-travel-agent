import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFashionRouteMapsUrl,
  fashionWalkingLegs,
  getFashionWalkingLeg,
} from "../src/data/fashion-walking-legs";

const route = [
  "fashion-auralee-tokyo",
  "fashion-aton-aoyama",
  "fashion-mame-aoyama",
  "fashion-cfcl-omotesando",
  "fashion-shibuya-parco",
];

test("covers every possible westbound pair so route removals keep a walking estimate", () => {
  assert.equal(fashionWalkingLegs.filter((leg) => leg.fromId.startsWith("fashion-") && leg.toId.startsWith("fashion-")).length, 10);
  for (let from = 0; from < route.length - 1; from += 1) {
    for (let to = from + 1; to < route.length; to += 1) {
      const leg = getFashionWalkingLeg(route[from], route[to]);
      assert.ok(leg, `${route[from]} → ${route[to]}`);
      assert.ok(leg.minutes > 0);
      assert.match(leg.distance, /^(?:\d+ m|\d+\.\d+ km)$/);
      assert.match(leg.sourceUrl, /^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&/);
      assert.match(leg.sourceUrl, /travelmode=walking$/);
      assert.equal(leg.capturedAt, "2026-07-23");
      assert.equal(leg.sourceSupports, "Google Maps displayed walking duration and distance for this store pair.");
      assert.equal(leg.sourceDoesNotSupport, "The demo's dotted straight connector is not the pedestrian route geometry.");
    }
  }
});

test("preserves the checked default-route walking times", () => {
  assert.deepEqual(
    route.slice(0, -1).map((fromId, index) => getFashionWalkingLeg(fromId, route[index + 1])?.minutes),
    [13, 2, 7, 18],
  );
});

test("builds the external walking route from only the currently visible stops", () => {
  const url = buildFashionRouteMapsUrl([
    "fashion-auralee-tokyo",
    "fashion-cfcl-omotesando",
    "fashion-shibuya-parco",
  ]);

  assert.match(url, /origin=AURALEE\+TOKYO/);
  assert.match(url, /destination=TOGA%2C\+Shibuya\+PARCO/);
  assert.match(url, /waypoints=CFCL\+OMOTESANDO/);
  assert.doesNotMatch(url, /ATON/);
  assert.doesNotMatch(url, /Mame/);
  assert.match(url, /travelmode=walking$/);
});
