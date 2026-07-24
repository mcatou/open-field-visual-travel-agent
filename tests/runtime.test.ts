import assert from "node:assert/strict";
import test from "node:test";
import { travelResponseSchema } from "../src/contracts/travel-response";
import { demoPlaces } from "../src/data/demo-places";
import { composeShoppingRoute } from "../src/runtime/compose-shopping-route";
import { generateSeedRows } from "../scripts/generate-clickhouse-seed";
import { buildFashionDemoFallback } from "../src/runtime/fashion-demo-fallback";

test("composeShoppingRoute returns a typed response with stable cross-linked IDs", async () => {
  let persisted = false;
  const tokyoPlaces = demoPlaces.filter((row) => (row.regionId ?? "tokyo") === "tokyo");
  const response = await composeShoppingRoute({ question: "Vintage and luxury before dinner", dinnerTime: "19:30" }, {
    async findShoppingPlaces() { return { rows: tokyoPlaces, queryId: "query-test", durationMs: 7 }; },
    async recordResponse(value) { persisted = value.id.length > 0; },
  });
  assert.equal(travelResponseSchema.safeParse(response).success, true);
  assert.equal(response.branches.length, 2);
  assert.equal(response.technicalTrace.returnedNodeCount, tokyoPlaces.length);
  assert.equal(response.technicalTrace.queryId, "query-test");
  assert.ok(response.world.routes.every((route) => route.placeIds.every((id) => response.world.pins.some((pin) => pin.placeId === id))));
  assert.equal(persisted, true);
});

test("composeShoppingRoute rejects a result without the protected dinner anchor", async () => {
  await assert.rejects(() => composeShoppingRoute({ question: "shop", dinnerTime: "19:30" }, {
    async findShoppingPlaces() { return { rows: demoPlaces.filter((row) => row.category !== "fixed"), queryId: "q", durationMs: 0 }; },
  }), /fixed dinner anchor/);
});

test("fit-aware fashion route preserves clothing size and real store branches", async () => {
  const fashionPlaces = demoPlaces.filter((row) => row.regionId === "tokyo-fashion");
  const response = await composeShoppingRoute({ question: "Omotesando and Shibuya clothing route, US 6-8", dinnerTime: "19:30", regionId: "tokyo-fashion" }, {
    async findShoppingPlaces() { return { rows: fashionPlaces, queryId: "fashion-query", durationMs: 5 }; },
  });
  assert.equal(response.constraints.find((item) => item.id === "clothing-size")?.value, "US 6–8");
  assert.equal(response.world.pins.length, 5);
  assert.ok(response.world.pins.every((pin) => pin.mapsUrl && pin.area));
  assert.deepEqual(response.branches.map((branch) => branch.label), ["Relaxed shirts and layers first", "Start with one standout piece", "Keep the route short"]);
  assert.deepEqual(response.branches[0].placeIds, [
    "fashion-auralee-tokyo",
    "fashion-aton-aoyama",
    "fashion-mame-aoyama",
    "fashion-cfcl-omotesando",
    "fashion-shibuya-parco",
  ]);
  assert.doesNotMatch(JSON.stringify(response), /dinner anchor|shoe size/i);
});

test("seed generator emits only approved public-demo rows", () => {
  const rows = generateSeedRows();
  assert.equal(rows.length, demoPlaces.length);
  assert.ok(rows.every((row) => row.demo_approved && ["fixture", "official"].includes(row.source_type) && row.privacy === "public_demo"));
  assert.ok(rows.filter((row) => row.source_type === "official").every((row) => row.source_url.startsWith("https://") && row.maps_url.startsWith("https://")));
  assert.doesNotMatch(JSON.stringify(rows), /password|secret|api[_-]?key/i);
});

test("fashion demo fallback renders the requested flow immediately when the live agent stalls", () => {
  const question = "I’m going to Omotesando/Shibuya. I’m US 6-8. What should I look for, and can you show the styles and stores on a map?";
  const response = buildFashionDemoFallback(question);
  assert.equal(response.question, question);
  assert.equal(response.technicalTrace.queryId, "approved-demo-fallback");
  assert.equal(response.world.pins.length, 5);
  assert.deepEqual(response.branches.map((branch) => branch.label), ["Relaxed shirts and layers first", "Start with one standout piece", "Keep the route short"]);
  assert.deepEqual(response.branches[0].placeIds, [
    "fashion-auralee-tokyo",
    "fashion-aton-aoyama",
    "fashion-mame-aoyama",
    "fashion-cfcl-omotesando",
    "fashion-shibuya-parco",
  ]);
  assert.ok(response.world.pins.some((pin) => pin.label === "CFCL OMOTESANDO"));
  assert.equal(response.interaction.mode, "replace");
  assert.equal(response.interaction.revision, 1);
  assert.equal(travelResponseSchema.safeParse(response).success, true);
});

test("fashion follow-up can return a revisioned three-stop route with short walking legs", async () => {
  const fashionPlaces = demoPlaces.filter((row) => row.regionId === "tokyo-fashion");
  const response = await composeShoppingRoute({
    question: "I’m 30 minutes late. Keep three stores and no walk longer than 12 minutes.",
    dinnerTime: "19:30",
    regionId: "tokyo-fashion",
    mode: "patch",
    requestId: "request-compact-route",
    baseRevision: 1,
    selectedBranchId: "vintage-first",
    maxStops: 3,
    maxWalkingMinutes: 12,
    timeLostMinutes: 30,
  }, {
    async findShoppingPlaces() { return { rows: fashionPlaces, queryId: "fashion-followup-query", durationMs: 5 }; },
  });

  assert.equal(response.interaction.mode, "patch");
  assert.equal(response.interaction.requestId, "request-compact-route");
  assert.equal(response.interaction.baseRevision, 1);
  assert.equal(response.interaction.revision, 2);
  assert.deepEqual(response.branches.find((branch) => branch.id === "vintage-first")?.placeIds, [
    "fashion-aton-aoyama",
    "fashion-mame-aoyama",
    "fashion-cfcl-omotesando",
  ]);
  assert.equal(response.constraints.find((item) => item.id === "max-stops")?.value, "3");
  assert.equal(response.constraints.find((item) => item.id === "walking-limit")?.value, "12 min between stops");
  assert.match(response.interaction.summary, /three|3/i);
});

test("ambiguous follow-up preserves the plan and returns clickable clarification choices", async () => {
  const fashionPlaces = demoPlaces.filter((row) => row.regionId === "tokyo-fashion");
  const response = await composeShoppingRoute({
    question: "Replace the expensive one.",
    dinnerTime: "19:30",
    regionId: "tokyo-fashion",
    mode: "clarify",
    requestId: "request-clarify",
    baseRevision: 4,
    selectedBranchId: "vintage-first",
    clarificationQuestion: "What should “the expensive one” mean?",
    clarificationOptions: [
      "Replace the store with the highest sample price",
      "Keep the stores and show lower-priced pieces",
      "Set a maximum item budget",
    ],
  }, {
    async findShoppingPlaces() { return { rows: fashionPlaces, queryId: "fashion-clarify-query", durationMs: 5 }; },
  });

  assert.equal(response.kind, "clarification_choice");
  assert.equal(response.interaction.mode, "clarify");
  assert.equal(response.interaction.revision, 5);
  assert.equal(response.interaction.clarification?.options.length, 3);
  assert.equal(response.branches.find((branch) => branch.id === "vintage-first")?.placeIds.length, 5);
});
