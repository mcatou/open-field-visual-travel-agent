import assert from "node:assert/strict";
import test from "node:test";
import { buildFashionDemoFallback } from "../src/runtime/fashion-demo-fallback";
import { buildVintageDemoFallback } from "../src/runtime/vintage-demo-fallback";
import {
  buildScopeClarification,
  buildFollowupClientData,
  followupClientDataSchema,
  shouldClarifyShoppingScope,
  reconcileFollowupViewState,
  shouldAcceptFollowupResponse,
  type FollowupViewState,
} from "../src/runtime/travel-followup";

test("follow-up client metadata is strict, bounded, and contains no private runtime values", () => {
  const response = buildFashionDemoFallback("Initial fashion route");
  const metadata = buildFollowupClientData({
    requestId: "request-123456",
    response,
    selectedBranchId: "vintage-first",
    removedPlaceIds: ["fashion-mame-aoyama"],
  });

  assert.equal(metadata.requestId, "request-123456");
  assert.equal(metadata.baseRevision, 1);
  assert.equal(metadata.regionId, "tokyo-fashion");
  assert.equal(metadata.selectedBranchId, "vintage-first");
  assert.deepEqual(metadata.removedPlaceIds, ["fashion-mame-aoyama"]);
  assert.equal(followupClientDataSchema.safeParse(metadata).success, true);
  assert.doesNotMatch(JSON.stringify(metadata), /api[_-]?key|connection string|token/i);
  assert.equal(followupClientDataSchema.safeParse({ ...metadata, unexpected: true }).success, false);
});

test("follow-up metadata remains valid after switching to the vintage route", () => {
  const response = buildVintageDemoFallback("Add vintage shopping");
  const metadata = buildFollowupClientData({
    requestId: "request-vintage-123",
    response,
    selectedBranchId: "luxury-first",
    removedPlaceIds: [],
  });

  assert.equal(metadata.regionId, "tokyo-vintage");
  assert.equal(metadata.selectedBranchId, "luxury-first");
  assert.equal(followupClientDataSchema.safeParse(metadata).success, true);
});

test("a valid plan update preserves unrelated map, pane, and removal state", () => {
  const response = buildFashionDemoFallback("Updated route");
  response.interaction = {
    mode: "patch",
    requestId: "request-123456",
    baseRevision: 1,
    revision: 2,
    summary: "Kept three compact stops.",
    appliedActions: ["Limit route to three stops"],
  };
  response.selectedBranchId = "short-route";

  const current: FollowupViewState = {
    selectedBranchId: "vintage-first",
    removedPlaceIds: ["fashion-mame-aoyama"],
    selectedPlaceId: "fashion-aton-aoyama",
    mapMode: "place",
    mapExpanded: true,
    evidenceOpen: true,
    panelOpen: true,
  };

  const next = reconcileFollowupViewState(current, response);
  assert.equal(next.selectedBranchId, "short-route");
  assert.deepEqual(next.removedPlaceIds, ["fashion-mame-aoyama"]);
  assert.equal(next.selectedPlaceId, "fashion-aton-aoyama");
  assert.equal(next.mapMode, "place");
  assert.equal(next.mapExpanded, true);
  assert.equal(next.evidenceOpen, true);
  assert.equal(next.panelOpen, true);
});

test("a removed selected place falls back safely without leaving stale evidence open", () => {
  const response = buildFashionDemoFallback("Updated route");
  response.branches = response.branches.map((branch) => branch.id === "vintage-first"
    ? { ...branch, placeIds: branch.placeIds.filter((id) => id !== "fashion-mame-aoyama") }
    : branch);
  response.selectedBranchId = "vintage-first";

  const next = reconcileFollowupViewState({
    selectedBranchId: "vintage-first",
    removedPlaceIds: [],
    selectedPlaceId: "fashion-mame-aoyama",
    mapMode: "place",
    mapExpanded: false,
    evidenceOpen: true,
    panelOpen: true,
  }, response);

  assert.equal(next.selectedPlaceId, "fashion-auralee-tokyo");
  assert.equal(next.mapMode, "route");
  assert.equal(next.evidenceOpen, false);
});

test("stale and unrelated agent responses cannot overwrite the current visual plan", () => {
  const response = buildFashionDemoFallback("Updated route");
  response.interaction = {
    mode: "patch",
    requestId: "request-123456",
    baseRevision: 1,
    revision: 2,
    summary: "Updated",
    appliedActions: [],
  };
  assert.equal(shouldAcceptFollowupResponse("request-123456", 1, response), true);
  assert.equal(shouldAcceptFollowupResponse("another-request", 1, response), false);
  assert.equal(shouldAcceptFollowupResponse("request-123456", 2, response), false);
});

test("unsupported questions become a bounded clarification without changing the route", () => {
  const response = buildVintageDemoFallback("Vintage route");

  assert.equal(shouldClarifyShoppingScope("Can you book a restaurant for dinner tonight?"), true);
  assert.equal(shouldClarifyShoppingScope("Keep the cheaper vintage stores"), false);
  assert.equal(shouldClarifyShoppingScope("No walk over 10 minutes"), false);
  assert.equal(shouldClarifyShoppingScope("Keep walks under 10 minutes"), false);

  const clarification = buildScopeClarification(
    response,
    "Can you book a restaurant for dinner tonight?",
    "request-scope-123",
  );

  assert.equal(clarification.kind, "clarification_choice");
  assert.equal(clarification.interaction.mode, "clarify");
  assert.equal(clarification.interaction.baseRevision, response.interaction.revision);
  assert.deepEqual(clarification.world, response.world);
  assert.deepEqual(clarification.branches, response.branches);
  assert.deepEqual(clarification.interaction.clarification?.options, [
    "Show a vintage-only route",
    "Mix fashion and vintage",
    "Keep walks under 10 minutes",
  ]);
});
