import { travelResponseSchema, type TravelResponse } from "../contracts/travel-response";
import { demoPlaces } from "../data/demo-places";
import { FASHION_PRIMARY_ROUTE_COPY } from "../data/fashion-copy";
import { fashionRouteOrder } from "./fashion-route-order";

type DemoFallbackOptions = {
  requestId?: string;
  baseRevision?: number;
};

export function buildFashionDemoFallback(
  question: string,
  options: DemoFallbackOptions = {},
): TravelResponse {
  const rows = demoPlaces.filter((row) => row.regionId === "tokyo-fashion");
  const availablePlaceIds = rows.map((row) => row.placeId);
  const fabricFirst = fashionRouteOrder("vintage-first", availablePlaceIds);
  const distinctiveFirst = fashionRouteOrder("luxury-first", availablePlaceIds);
  const shortRoute = fashionRouteOrder("short-route", availablePlaceIds);
  const baseRevision = options.baseRevision ?? 0;
  const revision = baseRevision + 1;

  return travelResponseSchema.parse({
    id: `preview-tokyo-fashion-v${revision}`,
    version: revision,
    kind: "route_compare",
    question,
    constraints: [
      { id: "clothing-size", label: "Clothing size", value: "US 6–8", hard: true },
      { id: "fit", label: "Fit", value: "comfortable now; no wishful tailoring", hard: true },
      { id: "area", label: "Area", value: "Omotesando → Shibuya", hard: true },
      { id: "visual", label: "Show", value: "styles + map pins", hard: false },
    ],
    verdict: FASHION_PRIMARY_ROUTE_COPY.verdict,
    world: {
      regionId: "tokyo-fashion",
      viewport: { latitude: 35.666, longitude: 139.708, zoom: 14 },
      pins: rows.map((row) => ({
        id: `pin-${row.placeId}`, placeId: row.placeId, label: row.name, area: row.area,
        latitude: row.latitude, longitude: row.longitude, kind: row.category,
        publicDemoAllowed: row.publicDemoAllowed, mapsUrl: row.mapsUrl,
        media: row.media?.map((asset) => ({ assetId: asset.assetId, title: asset.title, sourceUrl: asset.sourceUrl, localAssetRef: asset.localAssetRef, priceJpy: asset.priceJpy })),
      })),
      routes: [
        { id: "route-fabric-first", branchId: "vintage-first", placeIds: fabricFirst },
        { id: "route-distinctive-first", branchId: "luxury-first", placeIds: distinctiveFirst },
        { id: "route-short", branchId: "short-route", placeIds: shortRoute },
      ],
    },
    branches: [
      { id: "vintage-first", label: FASHION_PRIMARY_ROUTE_COPY.label, summary: FASHION_PRIMARY_ROUTE_COPY.summary, placeIds: fabricFirst, recommended: true },
      { id: "luxury-first", label: "Start with one standout piece", summary: "Mame, CFCL and TOGA in one westbound sequence.", placeIds: distinctiveFirst, recommended: false },
      { id: "short-route", label: "Keep the route short", summary: "ATON → Mame → CFCL, with 2- and 7-minute walks.", placeIds: shortRoute, recommended: false },
    ],
    selectedBranchId: "vintage-first",
    evidence: rows.map((row) => ({
      id: `evidence-${row.placeId}`, placeId: row.placeId, sourceUrl: row.sourceUrl,
      sourceType: row.sourceType, capturedAt: row.capturedAt, privacy: row.privacy, summary: row.summary,
      provenance: row.provenance,
    })),
    actions: [
      { type: "select_branch", label: "Choose relaxed layers first", targetId: "vintage-first" },
      { type: "switch_branch", label: "Choose distinctive first", targetId: "luxury-first" },
      { type: "switch_branch", label: "Choose the shorter route", targetId: "short-route" },
      { type: "compare", label: "Compare the three routes" },
      { type: "change_constraint", label: "Keep it to three stores", prompt: "Keep this route to three stores." },
      { type: "change_constraint", label: "No walk over 10 minutes", prompt: "Keep every walk between stores at or under 10 minutes." },
      { type: "change_constraint", label: "I’m 30 minutes late", prompt: "I’m 30 minutes late. Keep three stores and no walk longer than 12 minutes." },
      { type: "exclude_place", label: "Remove a store" },
      { type: "open_evidence", label: "Open fit note" },
    ],
    interaction: {
      mode: baseRevision > 0 ? "patch" : "replace",
      requestId: options.requestId ?? "initial-preview",
      baseRevision,
      revision,
      summary: baseRevision > 0
        ? "Restored the current-fashion route while live data refreshes."
        : "Built the initial five-store visual route.",
      appliedActions: ["Show fit-aware stores", "Map the route", "Attach official product references"],
    },
    provenance: {
      generatedAt: "2026-07-21T00:00:00.000Z",
      dataFreshness: "approved demo snapshot; stock and sizing require in-store confirmation",
      privacy: "public_demo",
    },
    technicalTrace: {
      runId: "preview-tokyo-fashion-v1", agent: "compose-shopping-route", queryId: "approved-demo-fallback",
      returnedNodeCount: rows.length, provenanceState: "public_demo", durationMs: 0,
    },
  });
}
