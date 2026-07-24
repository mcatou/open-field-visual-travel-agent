import { demoPlaces } from "../src/data/demo-places";

export function generateSeedRows() {
  return demoPlaces.map((place) => ({
    place_id: place.placeId, region_id: place.regionId ?? "tokyo", name: place.name, area: place.area,
    category: place.category, latitude: place.latitude, longitude: place.longitude,
    preference_score: place.preferenceScore, source_type: place.sourceType,
    source_url: place.sourceUrl ?? "", captured_at: place.capturedAt,
    privacy: place.privacy, summary: place.summary, maps_url: place.mapsUrl ?? "",
    public_demo_allowed: place.publicDemoAllowed, price_status: place.price?.status ?? "unresolved",
    price_currency: place.price?.currency ?? "JPY", price_min: place.price?.min ?? null,
    price_max: place.price?.max ?? null, price_basis: place.price?.basis ?? "Fixture; no price claim.",
    captured_item_count: place.price?.capturedItemCount ?? 0, inventory_scope: place.price?.inventoryScope ?? "No inventory claim.",
    source_exhausted: place.sourceExhaustion?.exhausted ?? false,
    selected_image_count: place.sourceExhaustion?.selectedImageCount ?? 0,
    available_image_count: place.sourceExhaustion?.availableImageCount ?? 0,
    hackathon_threshold_met: place.sourceExhaustion?.hackathonThresholdMet ?? false,
    source_exhaustion_note: place.sourceExhaustion?.displayNote ?? "Fixture row.",
    provenance_json: JSON.stringify(place.provenance ?? { sourceType: "fixture" }),
    unresolved_review_flags_json: JSON.stringify(place.unresolvedReviewFlags ?? []),
    runtime_enabled: true, demo_approved: true,
  }));
}

if (import.meta.url === new URL(process.argv[1]!, "file:").href) {
  for (const row of generateSeedRows()) process.stdout.write(`${JSON.stringify(row)}\n`);
}
