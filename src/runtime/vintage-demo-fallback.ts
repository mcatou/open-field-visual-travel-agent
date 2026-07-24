import { travelResponseSchema, type TravelResponse } from "../contracts/travel-response";
import { demoPlaces } from "../data/demo-places";

type DemoFallbackOptions = {
  requestId?: string;
  baseRevision?: number;
};

const VINTAGE_ONLY = [
  "vintage-amore-omotesando",
  "vintage-qoo-omotesando",
  "vintage-ragtag-harajuku",
  "vintage-paradise-jingumae",
  "vintage-kinji-harajuku",
  "vintage-10tow-shibuya",
];

const MIXED_DAY = [
  "fashion-auralee-tokyo",
  "fashion-mame-aoyama",
  "vintage-qoo-omotesando",
  "vintage-ragtag-harajuku",
  "vintage-10tow-shibuya",
];

const HARAJUKU_CLUSTER = [
  "vintage-qoo-omotesando",
  "vintage-ragtag-harajuku",
  "vintage-paradise-jingumae",
  "vintage-kinji-harajuku",
];

export function buildVintageDemoFallback(
  question: string,
  options: DemoFallbackOptions = {},
): TravelResponse {
  const rows = demoPlaces.filter(
    (row) => row.regionId === "tokyo-vintage" || row.regionId === "tokyo-fashion",
  );
  const available = new Set(rows.map((row) => row.placeId));
  const availableOnly = (ids: string[]) => ids.filter((id) => available.has(id));
  const vintageOnly = availableOnly(VINTAGE_ONLY);
  const mixedDay = availableOnly(MIXED_DAY);
  const harajukuCluster = availableOnly(HARAJUKU_CLUSTER);
  const baseRevision = options.baseRevision ?? 0;
  const revision = baseRevision + 1;

  return travelResponseSchema.parse({
    id: `preview-tokyo-vintage-v${revision}`,
    version: revision,
    kind: "route_compare",
    question,
    constraints: [
      { id: "area", label: "Area", value: "Omotesando · Harajuku · Shibuya", hard: true },
      { id: "shopping-mix", label: "Compare", value: "vintage-only or mixed day", hard: false },
      { id: "evidence", label: "Show", value: "prices · brands · sourced tips", hard: true },
    ],
    verdict: "Start in Omotesando, browse Harajuku, then decide if 10tow is worth the longer walk to Shibuya.",
    world: {
      regionId: "tokyo-vintage",
      viewport: { latitude: 35.6658, longitude: 139.7045, zoom: 14 },
      pins: rows.map((row) => ({
        id: `pin-${row.placeId}`,
        placeId: row.placeId,
        label: row.name,
        area: row.area,
        latitude: row.latitude,
        longitude: row.longitude,
        kind: row.category,
        publicDemoAllowed: row.publicDemoAllowed,
        mapsUrl: row.mapsUrl,
        media: row.media?.map((asset) => ({
          assetId: asset.assetId,
          title: asset.title,
          sourceUrl: asset.sourceUrl,
          localAssetRef: asset.localAssetRef,
          priceJpy: asset.priceJpy,
        })),
        price: row.price,
        details: row.details,
        unresolvedReviewFlags: row.unresolvedReviewFlags,
      })),
      routes: [
        { id: "route-vintage-only", branchId: "vintage-first", placeIds: vintageOnly },
        { id: "route-mixed-day", branchId: "luxury-first", placeIds: mixedDay },
        { id: "route-harajuku-cluster", branchId: "short-route", placeIds: harajukuCluster },
      ],
    },
    branches: [
      {
        id: "vintage-first",
        label: "Make it a vintage-only route",
        summary: "Six stores, from luxury resale to broad-price browsing and Japanese archive.",
        placeIds: vintageOnly,
        recommended: true,
      },
      {
        id: "luxury-first",
        label: "Mix vintage into the fashion day",
        summary: "AURALEE and Mame, then QOO, RAGTAG and 10tow as you move west.",
        placeIds: mixedDay,
        recommended: false,
      },
      {
        id: "short-route",
        label: "Stay in the Harajuku cluster",
        summary: "Four nearby stores; skip the longer Shibuya finish.",
        placeIds: harajukuCluster,
        recommended: false,
      },
    ],
    selectedBranchId: "vintage-first",
    evidence: rows.map((row) => ({
      id: `evidence-${row.placeId}`,
      placeId: row.placeId,
      sourceUrl: row.sourceUrl,
      sourceType: row.sourceType,
      capturedAt: row.capturedAt,
      privacy: row.privacy,
      summary: row.summary,
      provenance: row.provenance,
    })),
    actions: [
      { type: "select_branch", label: "Show the vintage-only route", targetId: "vintage-first" },
      { type: "switch_branch", label: "Mix it into the fashion day", targetId: "luxury-first" },
      { type: "switch_branch", label: "Keep only the Harajuku cluster", targetId: "short-route" },
      { type: "compare", label: "Compare the three versions" },
      {
        type: "change_constraint",
        label: "Keep the cheaper stops",
        prompt: "Keep the stores with the lower recent online price examples.",
      },
      {
        type: "change_constraint",
        label: "Focus on Japanese designers",
        prompt: "Focus this route on Japanese designers and archive pieces.",
      },
    ],
    interaction: {
      mode: baseRevision > 0 ? "patch" : "replace",
      requestId: options.requestId ?? "initial-vintage-preview",
      baseRevision,
      revision,
      summary: "Built vintage-only and mixed-day routes.",
      appliedActions: [
        "Show approved vintage stores",
        "Attach price and brand examples",
        "Map the route",
      ],
    },
    provenance: {
      generatedAt: "2026-07-23T00:00:00.000Z",
      dataFreshness: "approved demo snapshot; hours, prices, and stock need a same-day check",
      privacy: "public_demo",
    },
    technicalTrace: {
      runId: `preview-tokyo-vintage-v${revision}`,
      agent: "compose-shopping-route",
      queryId: "approved-vintage-demo-fallback",
      returnedNodeCount: rows.length,
      provenanceState: "public_demo",
      durationMs: 0,
    },
  });
}
