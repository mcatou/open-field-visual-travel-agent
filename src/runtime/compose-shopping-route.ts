import { randomUUID } from "node:crypto";
import { travelResponseSchema, type TravelResponse } from "../contracts/travel-response";
import type { DemoPlace } from "../data/demo-places";
import { getFashionWalkingLeg } from "../data/fashion-walking-legs";
import { fashionRouteOrder } from "./fashion-route-order";
import { FASHION_PRIMARY_ROUTE_COPY } from "../data/fashion-copy";

export type ShoppingRouteRequest = {
  question: string;
  dinnerTime: string;
  regionId?: string;
  mode?: "replace" | "patch" | "clarify";
  requestId?: string;
  baseRevision?: number;
  selectedBranchId?: string;
  excludedPlaceIds?: string[];
  maxStops?: number;
  maxWalkingMinutes?: number;
  timeLostMinutes?: number;
  clarificationQuestion?: string;
  clarificationOptions?: string[];
};
export type PlaceQuery = { rows: DemoPlace[]; queryId: string; durationMs: number };
export interface ShoppingRepository {
  findShoppingPlaces(input: ShoppingRouteRequest): Promise<PlaceQuery>;
  recordResponse?(response: TravelResponse): Promise<void>;
}

function longestWalkBoundedSegment(placeIds: string[], maxWalkingMinutes?: number) {
  if (!maxWalkingMinutes || placeIds.length < 2) return placeIds;
  let best: string[] = placeIds.slice(0, 1);
  for (let start = 0; start < placeIds.length; start += 1) {
    const candidate = [placeIds[start]];
    for (let index = start + 1; index < placeIds.length; index += 1) {
      const leg = getFashionWalkingLeg(placeIds[index - 1], placeIds[index]);
      if (!leg || leg.minutes > maxWalkingMinutes) break;
      candidate.push(placeIds[index]);
    }
    if (candidate.length > best.length) best = candidate;
  }
  return best;
}

function summarizeFashionUpdate(input: ShoppingRouteRequest, selectedCount: number) {
  if (input.mode === "clarify") return input.clarificationQuestion ?? "Choose how the route should change.";
  if (input.maxStops && input.maxWalkingMinutes) {
    return `Kept ${selectedCount} stops with each checked walk at or under ${input.maxWalkingMinutes} minutes.`;
  }
  if (input.maxStops) return `Kept the route to ${selectedCount} stops.`;
  if (input.timeLostMinutes) return `Reworked the route after losing ${input.timeLostMinutes} minutes.`;
  if (input.excludedPlaceIds?.length) return `Removed ${input.excludedPlaceIds.length} requested stop${input.excludedPlaceIds.length === 1 ? "" : "s"} without resetting the route.`;
  return input.mode === "patch" ? "Updated the current route in place." : "Built the initial visual route.";
}

export async function composeShoppingRoute(input: ShoppingRouteRequest, repository: ShoppingRepository): Promise<TravelResponse> {
  const result = await repository.findShoppingPlaces(input);
  const vintageMode = input.regionId === "tokyo-vintage";
  const fashionMode = input.regionId === "tokyo-fashion";
  const byCategory = (category: DemoPlace["category"]) => result.rows.filter((row) => row.category === category).map((row) => row.placeId);
  if (vintageMode) {
    if (result.rows.length === 0) throw new Error("A vintage route requires approved store candidates");
    const available = new Set(result.rows.map((row) => row.placeId));
    const availableOnly = (ids: string[]) => ids.filter((id) => available.has(id));
    const vintageOnly = availableOnly([
      "vintage-amore-omotesando",
      "vintage-qoo-omotesando",
      "vintage-ragtag-harajuku",
      "vintage-paradise-jingumae",
      "vintage-kinji-harajuku",
      "vintage-10tow-shibuya",
    ]);
    const mixedDay = availableOnly([
      "fashion-auralee-tokyo",
      "fashion-mame-aoyama",
      "vintage-qoo-omotesando",
      "vintage-ragtag-harajuku",
      "vintage-10tow-shibuya",
    ]);
    const harajukuCluster = availableOnly([
      "vintage-qoo-omotesando",
      "vintage-ragtag-harajuku",
      "vintage-paradise-jingumae",
      "vintage-kinji-harajuku",
    ]);
    if (!vintageOnly.length || !mixedDay.length || !harajukuCluster.length) {
      throw new Error("The vintage route requires both approved vintage and fashion candidates");
    }
    const branchIds = new Set(["vintage-first", "luxury-first", "short-route"]);
    const selectedBranchId = input.selectedBranchId && branchIds.has(input.selectedBranchId)
      ? input.selectedBranchId
      : "vintage-first";
    const interactionMode = input.mode ?? ((input.baseRevision ?? 0) > 0 ? "patch" : "replace");
    const response = travelResponseSchema.parse({
      id: randomUUID(),
      version: (input.baseRevision ?? 0) + 1,
      kind: interactionMode === "clarify" ? "clarification_choice" : "route_compare",
      question: input.question,
      constraints: [
        { id: "area", label: "Area", value: "Omotesando · Harajuku · Shibuya", hard: true },
        { id: "shopping-mix", label: "Compare", value: "vintage-only or mixed day", hard: false },
        { id: "evidence", label: "Show", value: "prices · brands · sourced tips", hard: true },
      ],
      verdict: "Start in Omotesando, browse Harajuku, then decide if 10tow is worth the longer walk to Shibuya.",
      world: {
        regionId: "tokyo-vintage",
        viewport: { latitude: 35.6658, longitude: 139.7045, zoom: 14 },
        pins: result.rows.map((row) => ({
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
        { id: "vintage-first", label: "Make it a vintage-only route", summary: "Six stops from Chanel and luxury resale to broad-price browsing and Japanese archive.", placeIds: vintageOnly, recommended: true },
        { id: "luxury-first", label: "Mix vintage into the fashion day", summary: "AURALEE and Mame, then QOO, RAGTAG and 10tow as you move west.", placeIds: mixedDay, recommended: false },
        { id: "short-route", label: "Stay in the Harajuku cluster", summary: "Four nearby stores; skip the longer Shibuya finish.", placeIds: harajukuCluster, recommended: false },
      ],
      selectedBranchId,
      evidence: result.rows.map((row) => ({
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
        { type: "change_constraint", label: "Keep the cheaper stops", prompt: "Keep the stores with the lower recent online price examples." },
        { type: "change_constraint", label: "Focus on Japanese designers", prompt: "Focus this route on Japanese designers and archive pieces." },
      ],
      interaction: {
        mode: interactionMode,
        requestId: input.requestId ?? `server-${randomUUID()}`,
        baseRevision: input.baseRevision ?? 0,
        revision: (input.baseRevision ?? 0) + 1,
        summary: interactionMode === "patch" ? "Updated the vintage route in place." : "Built vintage-only and mixed-day routes.",
        appliedActions: [],
        clarification: interactionMode === "clarify" ? {
          question: input.clarificationQuestion ?? "Which vintage direction should I use?",
          options: input.clarificationOptions?.slice(0, 4) ?? [
            "Vintage-only route",
            "Mixed fashion and vintage day",
          ],
        } : undefined,
      },
      provenance: {
        generatedAt: new Date().toISOString(),
        dataFreshness: "official store and inventory snapshot plus separately labeled editorial tips; hours, prices, and stock need a same-day check",
        privacy: "public_demo",
      },
      technicalTrace: {
        runId: randomUUID(),
        agent: "compose-shopping-route",
        queryId: result.queryId,
        returnedNodeCount: result.rows.length,
        provenanceState: "public_demo",
        durationMs: result.durationMs,
      },
    });
    await repository.recordResponse?.(response);
    return response;
  }
  if (fashionMode) {
    const availablePlaceIds = result.rows.map((row) => row.placeId);
    const excluded = new Set(input.excludedPlaceIds ?? []);
    const effectiveMaxStops = input.maxStops ?? (input.timeLostMinutes && input.timeLostMinutes > 0 ? 3 : undefined);
    const constrain = (placeIds: string[]) => {
      const filtered = placeIds.filter((placeId) => !excluded.has(placeId));
      const walkBounded = longestWalkBoundedSegment(filtered, input.maxWalkingMinutes);
      const limited = effectiveMaxStops ? walkBounded.slice(0, effectiveMaxStops) : walkBounded;
      return limited.length ? limited : placeIds.slice(0, 1);
    };
    const fabricFirst = constrain(fashionRouteOrder("vintage-first", availablePlaceIds));
    const distinctiveFirst = constrain(fashionRouteOrder("luxury-first", availablePlaceIds));
    const shortRoute = constrain(fashionRouteOrder("short-route", availablePlaceIds));
    if (result.rows.length === 0) throw new Error("A fashion route requires approved store candidates");
    const branchIds = new Set(["vintage-first", "luxury-first", "short-route"]);
    const selectedBranchId = input.selectedBranchId && branchIds.has(input.selectedBranchId)
      ? input.selectedBranchId
      : "vintage-first";
    const selectedPlaceIds = selectedBranchId === "luxury-first"
      ? distinctiveFirst
      : selectedBranchId === "short-route"
        ? shortRoute
        : fabricFirst;
    const interactionMode = input.mode ?? ((input.baseRevision ?? 0) > 0 ? "patch" : "replace");
    const interactionSummary = summarizeFashionUpdate({ ...input, maxStops: effectiveMaxStops }, selectedPlaceIds.length);
    const appliedActions = [
      ...(effectiveMaxStops ? [`Limit route to ${effectiveMaxStops} stops`] : []),
      ...(input.maxWalkingMinutes ? [`Keep checked walks at or under ${input.maxWalkingMinutes} minutes`] : []),
      ...(input.timeLostMinutes ? [`Account for ${input.timeLostMinutes} minutes lost`] : []),
      ...(input.excludedPlaceIds ?? []).map((placeId) => `Exclude ${placeId}`),
    ];
    const extraConstraints = [
      ...(effectiveMaxStops ? [{ id: "max-stops", label: "Route length", value: String(effectiveMaxStops), hard: true }] : []),
      ...(input.maxWalkingMinutes ? [{ id: "walking-limit", label: "Walking limit", value: `${input.maxWalkingMinutes} min between stops`, hard: true }] : []),
      ...(input.timeLostMinutes ? [{ id: "time-lost", label: "Time lost", value: `${input.timeLostMinutes} min`, hard: true }] : []),
    ];
    const response = travelResponseSchema.parse({
      id: randomUUID(), version: (input.baseRevision ?? 0) + 1, kind: interactionMode === "clarify" ? "clarification_choice" : "route_compare", question: input.question,
      constraints: [
        { id: "clothing-size", label: "Clothing size", value: "US 6–8", hard: true },
        { id: "fit", label: "Fit", value: "comfortable now; no wishful tailoring", hard: true },
        { id: "area", label: "Area", value: "Omotesando → Shibuya", hard: true },
        { id: "visual", label: "Show", value: "styles + map pins", hard: false },
        ...extraConstraints,
      ],
      verdict: interactionMode === "replace"
        ? FASHION_PRIMARY_ROUTE_COPY.verdict
        : interactionSummary,
      world: {
        regionId: "tokyo-fashion", viewport: { latitude: 35.666, longitude: 139.708, zoom: 14 },
        pins: result.rows.map((row) => ({ id: `pin-${row.placeId}`, placeId: row.placeId, label: row.name, area: row.area, latitude: row.latitude, longitude: row.longitude, kind: row.category, publicDemoAllowed: row.publicDemoAllowed, mapsUrl: row.mapsUrl, media: row.media?.map((asset) => ({ assetId: asset.assetId, title: asset.title, sourceUrl: asset.sourceUrl, localAssetRef: asset.localAssetRef, priceJpy: asset.priceJpy })) })),
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
      ], selectedBranchId,
      evidence: result.rows.map((row) => ({ id: `evidence-${row.placeId}`, placeId: row.placeId, sourceUrl: row.sourceUrl, sourceType: row.sourceType, capturedAt: row.capturedAt, privacy: row.privacy, summary: row.summary })),
      actions: [
        { type: "select_branch", label: "Choose relaxed layers first", targetId: "vintage-first" },
        { type: "switch_branch", label: "Choose distinctive first", targetId: "luxury-first" },
        { type: "switch_branch", label: "Choose the shorter route", targetId: "short-route" },
        { type: "compare", label: "Compare the three routes" },
        { type: "change_constraint", label: "Keep it to three stores", prompt: "Keep this route to three stores." },
        { type: "change_constraint", label: "No walk over 10 minutes", prompt: "Keep every walk between stores at or under 10 minutes." },
        { type: "change_constraint", label: "I’m 30 minutes late", prompt: "I’m 30 minutes late. Keep three stores and no walk longer than 12 minutes." },
        { type: "exclude_place", label: "Remove a store" }, { type: "open_evidence", label: "Open fit note" },
      ],
      interaction: {
        mode: interactionMode,
        requestId: input.requestId ?? `server-${randomUUID()}`,
        baseRevision: input.baseRevision ?? 0,
        revision: (input.baseRevision ?? 0) + 1,
        summary: interactionSummary,
        appliedActions,
        clarification: interactionMode === "clarify" ? {
          question: input.clarificationQuestion ?? "What should change?",
          options: input.clarificationOptions?.slice(0, 4) ?? [
            "Change the route length",
            "Change the walking limit",
          ],
        } : undefined,
      },
      provenance: { generatedAt: new Date().toISOString(), dataFreshness: "official store-location snapshot; stock and sizing require in-store confirmation", privacy: "public_demo" },
      technicalTrace: { runId: randomUUID(), agent: "compose-shopping-route", queryId: result.queryId, returnedNodeCount: result.rows.length, provenanceState: "public_demo", durationMs: result.durationMs },
    });
    await repository.recordResponse?.(response); return response;
  }
  const dinner = byCategory("fixed");
  const vintageFirst = [...byCategory("vintage"), ...byCategory("pause"), ...byCategory("luxury"), ...dinner];
  const luxuryFirst = [...byCategory("luxury"), ...byCategory("pause"), ...byCategory("vintage"), ...dinner];
  if (result.rows.length === 0 || dinner.length === 0) throw new Error("A shopping route requires candidates and a fixed dinner anchor");

  const response = travelResponseSchema.parse({
    id: randomUUID(), version: 1, kind: "route_compare", question: input.question,
    constraints: [
      { id: "shopping-mix", label: "Shopping mix", value: "vintage + luxury", hard: false },
      { id: "dinner", label: "Dinner", value: `${input.dinnerTime} Omotesando`, hard: true },
    ],
    verdict: "Begin with discovery, keep the afternoon compact, and protect the dinner anchor.",
    world: {
      regionId: input.regionId ?? "tokyo",
      viewport: { latitude: 35.665, longitude: 139.7, zoom: 12 },
      pins: result.rows.map((row) => ({ id: `pin-${row.placeId}`, placeId: row.placeId, label: row.name, area: row.area, latitude: row.latitude, longitude: row.longitude, kind: row.category, publicDemoAllowed: row.publicDemoAllowed, mapsUrl: row.mapsUrl, media: row.media?.map((asset) => ({ assetId: asset.assetId, title: asset.title, sourceUrl: asset.sourceUrl, localAssetRef: asset.localAssetRef, priceJpy: asset.priceJpy })), price: row.price, sourceExhaustion: row.sourceExhaustion, unresolvedReviewFlags: row.unresolvedReviewFlags })),
      routes: [
        { id: "route-vintage-first", branchId: "vintage-first", placeIds: vintageFirst },
        { id: "route-luxury-first", branchId: "luxury-first", placeIds: luxuryFirst },
      ],
    },
    branches: [
      { id: "vintage-first", label: "Vintage first", summary: "Discovery first, then a designed landing.", placeIds: vintageFirst, recommended: true },
      { id: "luxury-first", label: "Luxury first", summary: "Tighter geography with less surprise.", placeIds: luxuryFirst, recommended: false },
    ],
    selectedBranchId: "vintage-first",
    evidence: result.rows.map((row) => ({ id: `evidence-${row.placeId}`, placeId: row.placeId, sourceUrl: row.sourceUrl, sourceType: row.sourceType, capturedAt: row.capturedAt, privacy: row.privacy, summary: row.summary, provenance: row.provenance })),
    actions: [
      { type: "select_branch", label: "Choose vintage first", targetId: "vintage-first" },
      { type: "switch_branch", label: "Choose luxury first", targetId: "luxury-first" },
      { type: "exclude_place", label: "Remove a stop" },
      { type: "open_evidence", label: "Open evidence" },
    ],
    interaction: {
      mode: input.mode ?? "replace",
      requestId: input.requestId ?? `server-${randomUUID()}`,
      baseRevision: input.baseRevision ?? 0,
      revision: (input.baseRevision ?? 0) + 1,
      summary: input.mode === "patch" ? "Updated the route in place." : "Built the initial visual route.",
      appliedActions: [],
    },
    provenance: { generatedAt: new Date().toISOString(), dataFreshness: "source snapshot; time-sensitive facts require refresh", privacy: result.rows.some((row) => row.privacy === "internal_only") ? "internal_only" : "public_demo" },
    technicalTrace: { runId: randomUUID(), agent: "compose-shopping-route", queryId: result.queryId, returnedNodeCount: result.rows.length, provenanceState: result.rows.some((row) => row.privacy === "internal_only") ? "internal_only" : result.rows.every((row) => row.sourceType === "fixture") ? "fixture" : "public_demo", durationMs: result.durationMs },
  });
  await repository.recordResponse?.(response);
  return response;
}
