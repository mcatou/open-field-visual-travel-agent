import assert from "node:assert/strict";
import test from "node:test";
import {
  AIRPORT_CONTINUATION,
  GRAND_SEIKO_MODEL,
  GINZA_STORE_WALK_LEGS,
  GINZA_STORES,
  ROUTE_LEGS,
  SEIKO_TRANSIT_NODES,
  WATCH_PURCHASE_MINUTES,
  buildSeikoTransitPlan,
  type SeikoTransitScenario,
} from "../src/runtime/seiko-transit-flow";

test("uses the confirmed Sakura-Wakaba reference and Japanese price", () => {
  assert.equal(GRAND_SEIKO_MODEL.reference, "SBGH343");
  assert.equal(GRAND_SEIKO_MODEL.priceYen, 1_056_000);
  assert.equal(GRAND_SEIKO_MODEL.caseAndBracelet, "Bright titanium");
  assert.match(GRAND_SEIKO_MODEL.dial, /light green/i);
});

test("unknown stock protects the Tokyo Station deadline", () => {
  const plan = buildSeikoTransitPlan({
    selectedStoreId: "wako",
    stock: "unknown",
    lostMinutes: 0,
    disruption: "none",
  });

  assert.equal(plan.mode, "protect_train");
  assert.equal(plan.recommendedRouteId, "metro-direct");
  assert.match(plan.verdict, /call first/i);
  assert.ok(plan.steps.every((step) => step.kind !== "shop"));
  assert.ok(plan.steps.some((step) => step.nodeId === "tokyo-station"));
});

test("confirmed branch stock opens only the selected store detour", () => {
  const plan = buildSeikoTransitPlan({
    selectedStoreId: "wako",
    stock: "confirmed",
    lostMinutes: 0,
    disruption: "none",
  });

  assert.equal(plan.mode, "shop_then_train");
  assert.equal(plan.recommendedRouteId, "shop-wako");
  assert.ok(plan.steps.some((step) => step.nodeId === "wako"));
  assert.ok(plan.steps.every((step) => step.nodeId !== "namiki"));
  assert.equal(plan.steps.find((step) => step.id === "purchase")?.minutes, 20);
  assert.ok(plan.steps.some((step) => /bracelet sizing and paperwork/i.test(step.detail)));
});

test("watch purchase time and airport continuation preserve the real downstream constraint", () => {
  assert.equal(WATCH_PURCHASE_MINUTES, 20);
  assert.equal(AIRPORT_CONTINUATION.targetAirport, "Narita International Airport");
  assert.equal(AIRPORT_CONTINUATION.airline, "ANA");
  assert.equal(AIRPORT_CONTINUATION.destination, "San Francisco");
  assert.equal(AIRPORT_CONTINUATION.naritaExpressFastestMinutes, 53);
  assert.equal(AIRPORT_CONTINUATION.internationalCheckinDeadlineMinutes, 60);
  assert.equal(AIRPORT_CONTINUATION.luggageStorageLocation, "unknown");
});

test("stock failure and lost time collapse the shopping detour", () => {
  const scenarios: SeikoTransitScenario[] = [
    { selectedStoreId: "namiki", stock: "unavailable", lostMinutes: 0, disruption: "none" },
    { selectedStoreId: "boutique-ginza", stock: "confirmed", lostMinutes: 15, disruption: "none" },
  ];

  for (const scenario of scenarios) {
    const plan = buildSeikoTransitPlan(scenario);
    assert.equal(plan.mode, "protect_train");
    assert.equal(plan.recommendedRouteId, "metro-direct");
    assert.ok(plan.steps.every((step) => step.kind !== "shop"));
  }
});

test("a Marunouchi disruption keeps JR and walking backups visible", () => {
  const plan = buildSeikoTransitPlan({
    selectedStoreId: "wako",
    stock: "unknown",
    lostMinutes: 0,
    disruption: "marunouchi",
  });

  assert.equal(plan.recommendedRouteId, "jr-direct");
  assert.ok(plan.alternatives.includes("walk-direct"));
  assert.ok(plan.alternatives.includes("metro-direct"));
});

test("store cards preserve official hours and discount caveats", () => {
  assert.equal(GINZA_STORES.find((store) => store.id === "wako")?.hours, "11:00–19:00");
  assert.match(GINZA_STORES.find((store) => store.id === "wako")?.benefit ?? "", /next day/i);
  assert.equal(GINZA_STORES.find((store) => store.id === "matsuya-ginza")?.hours, "11:00–20:00");
  assert.ok(GINZA_STORES.every((store) => /stock/i.test(store.stockNote)));
});

test("map nodes and routed legs retain precise coordinates and routed geometry", () => {
  assert.ok(SEIKO_TRANSIT_NODES.every((node) => node.latitude > 35.66 && node.latitude < 35.69));
  assert.ok(SEIKO_TRANSIT_NODES.every((node) => node.longitude > 139.75 && node.longitude < 139.78));
  assert.ok(ROUTE_LEGS.every((leg) => leg.encodedShape.length > 20));
  assert.ok(ROUTE_LEGS.some((leg) => leg.source === "Valhalla / OpenStreetMap"));
  assert.ok(ROUTE_LEGS.some((leg) => leg.displayMinutes === 3));
});

test("the Ginza store sequence keeps every numbered shop connected with walking times", () => {
  assert.deepEqual(
    GINZA_STORE_WALK_LEGS.map((leg) => [leg.fromId, leg.toId, leg.displayMinutes]),
    [
      ["matsuya-ginza", "mitsukoshi", 2],
      ["matsuya-ginza", "wako", 3],
      ["wako", "namiki", 4],
      ["namiki", "boutique-ginza", 4],
      ["boutique-ginza", "nisshindo", 1],
    ],
  );
  const mitsukoshi = SEIKO_TRANSIT_NODES.find((node) => node.id === "mitsukoshi");
  assert.equal(mitsukoshi?.latitude, 35.6713);
  assert.equal(mitsukoshi?.longitude, 139.7658);
  assert.ok(GINZA_STORE_WALK_LEGS.every((leg) => leg.encodedShape.length > 20));
});
