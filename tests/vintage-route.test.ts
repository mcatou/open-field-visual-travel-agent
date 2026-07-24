import assert from "node:assert/strict";
import test from "node:test";
import { travelResponseSchema } from "../src/contracts/travel-response";
import { demoPlaces } from "../src/data/demo-places";
import { composeShoppingRoute } from "../src/runtime/compose-shopping-route";
import { buildVintageDemoFallback } from "../src/runtime/vintage-demo-fallback";
import { regionForShoppingQuestion } from "../trigger/compose-shopping-route";

const VINTAGE_QUERY = "Can you add vintage shopping around Omotesando and Shibuya, with prices, brands and practical tips? Show me a vintage-only route and a mixed fashion day.";

test("a pasted vintage query selects the vintage dataset even from an existing fashion session", () => {
  assert.equal(regionForShoppingQuestion(VINTAGE_QUERY, "tokyo-fashion"), "tokyo-vintage");
  assert.equal(regionForShoppingQuestion("Keep this route to three stores", "tokyo-vintage"), "tokyo-vintage");
  assert.equal(regionForShoppingQuestion("Omotesando clothing for US 6-8", "tokyo-fashion"), "tokyo-fashion");
  assert.equal(regionForShoppingQuestion("I’m US 6-8. Show current fashion around Omotesando.", "tokyo-vintage"), "tokyo-fashion");
});

test("approved vintage rows have precise map, price, brand, and attributed tip data", () => {
  const vintagePlaces = demoPlaces.filter((row) => row.regionId === "tokyo-vintage");
  assert.equal(vintagePlaces.length, 6);
  assert.ok(vintagePlaces.every((row) => row.latitude > 35 && row.longitude > 139));
  assert.ok(vintagePlaces.every((row) => row.mapsUrl?.startsWith("https://www.google.com/maps/")));
  assert.ok(vintagePlaces.every((row) => row.details?.brands?.items.length));
  assert.ok(vintagePlaces.every((row) => row.details?.hours));
  assert.ok(vintagePlaces.every((row) => row.details?.shopperTip?.sourceUrl.startsWith("https://")));
  assert.ok(vintagePlaces.filter((row) => row.placeId !== "vintage-10tow-shibuya").every((row) => (row.media?.length ?? 0) >= 3));
});

test("vintage response offers a standalone route and a mixed fashion day", async () => {
  const rows = demoPlaces.filter((row) => row.regionId === "tokyo-vintage" || row.regionId === "tokyo-fashion");
  const response = await composeShoppingRoute({
    question: VINTAGE_QUERY,
    dinnerTime: "19:30",
    regionId: "tokyo-vintage",
  }, {
    async findShoppingPlaces() {
      return { rows, queryId: "vintage-query", durationMs: 7 };
    },
  });

  assert.equal(travelResponseSchema.safeParse(response).success, true);
  assert.equal(response.world.regionId, "tokyo-vintage");
  assert.deepEqual(response.branches.map((branch) => branch.label), [
    "Make it a vintage-only route",
    "Mix vintage into the fashion day",
    "Stay in the Harajuku cluster",
  ]);
  assert.ok(response.branches[0].placeIds.every((id) => id.startsWith("vintage-")));
  assert.ok(response.branches[1].placeIds.some((id) => id.startsWith("fashion-")));
  assert.ok(response.branches[1].placeIds.some((id) => id.startsWith("vintage-")));
  assert.ok(response.world.pins.some((pin) => pin.details?.shopperTip?.sourceType === "editorial"));
  assert.doesNotMatch(JSON.stringify(response), /dinner anchor|fixture/i);
});

test("vintage demo action can render a complete route before the live refresh finishes", () => {
  const response = buildVintageDemoFallback(VINTAGE_QUERY, {
    requestId: "request-vintage-demo",
    baseRevision: 4,
  });

  assert.equal(travelResponseSchema.safeParse(response).success, true);
  assert.equal(response.question, VINTAGE_QUERY);
  assert.equal(response.world.regionId, "tokyo-vintage");
  assert.equal(response.interaction.requestId, "request-vintage-demo");
  assert.equal(response.interaction.baseRevision, 4);
  assert.equal(response.interaction.revision, 5);
  assert.equal(response.branches[0].placeIds.length, 6);
  assert.ok(response.branches[0].placeIds.every((id) => id.startsWith("vintage-")));
  assert.ok(response.branches[1].placeIds.some((id) => id.startsWith("fashion-")));
  assert.ok(response.world.pins.every((pin) => pin.mapsUrl));
  assert.ok(response.world.pins.some((pin) => pin.details?.shopperTip?.sourceType === "editorial"));
});
