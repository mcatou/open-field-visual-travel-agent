import assert from "node:assert/strict";
import test from "node:test";
import { demoPlaces } from "../src/data/demo-places";
import { buildFashionDemoFallback } from "../src/runtime/fashion-demo-fallback";

const expected = new Map([
  ["fashion-auralee-tokyo", [35.6611583, 139.7164106]],
  ["fashion-aton-aoyama", [35.6647671, 139.7111198]],
  ["fashion-mame-aoyama", [35.6653842, 139.7104318]],
  ["fashion-cfcl-omotesando", [35.6673861, 139.7069111]],
  ["fashion-shibuya-parco", [35.661999, 139.6989521]],
]);

test("fashion map rows preserve the five verified Google Maps coordinates", () => {
  for (const [placeId, coordinates] of expected) {
    const place = demoPlaces.find((row) => row.placeId === placeId);
    assert.ok(place, `missing ${placeId}`);
    assert.deepEqual([place.latitude, place.longitude], coordinates, placeId);
  }
});

test("fashion coordinates are distinct and remain inside the Aoyama to Shibuya viewport", () => {
  const rows = demoPlaces.filter((row) => expected.has(row.placeId));
  const points = new Set(rows.map((row) => `${row.latitude},${row.longitude}`));
  assert.equal(rows.length, 5);
  assert.equal(points.size, 5);
  for (const row of rows) {
    assert.ok(row.latitude >= 35.66 && row.latitude <= 35.669, row.placeId);
    assert.ok(row.longitude >= 139.698 && row.longitude <= 139.717, row.placeId);
  }
});

test("the default shopping sequence moves coherently west toward Shibuya", () => {
  const response = buildFashionDemoFallback("Map the shopping route");
  const route = response.branches[0].placeIds.map((placeId) => {
    const place = demoPlaces.find((row) => row.placeId === placeId);
    assert.ok(place, placeId);
    return place;
  });
  assert.deepEqual(route.map((place) => place.placeId), [
    "fashion-auralee-tokyo",
    "fashion-aton-aoyama",
    "fashion-mame-aoyama",
    "fashion-cfcl-omotesando",
    "fashion-shibuya-parco",
  ]);
  for (let index = 1; index < route.length; index += 1) {
    assert.ok(route[index].longitude < route[index - 1].longitude, `${route[index - 1].placeId} → ${route[index].placeId}`);
  }
});
