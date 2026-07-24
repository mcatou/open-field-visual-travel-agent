CREATE TABLE IF NOT EXISTS places
(
  place_id String, region_id LowCardinality(String), name String, area String,
  category LowCardinality(String), latitude Float64, longitude Float64,
  preference_score Float32, source_type LowCardinality(String), source_url String,
  captured_at DateTime64(3, 'UTC'), privacy LowCardinality(String), summary String,
  maps_url String, public_demo_allowed Bool, price_status LowCardinality(String),
  price_currency LowCardinality(String), price_min Nullable(UInt32), price_max Nullable(UInt32),
  price_basis String, captured_item_count UInt16, inventory_scope String,
  source_exhausted Bool, selected_image_count UInt16, available_image_count UInt16,
  hackathon_threshold_met Bool, source_exhaustion_note String,
  provenance_json String, unresolved_review_flags_json String,
  runtime_enabled Bool, demo_approved Bool
)
ENGINE = ReplacingMergeTree(captured_at)
ORDER BY (region_id, category, place_id);

CREATE TABLE IF NOT EXISTS media_assets
(
  asset_id String, place_id String, display_order UInt16, title String,
  semantic_label String, source_label String, source_url String,
  local_asset_ref String, price_jpy Nullable(UInt32), evidence_level LowCardinality(String),
  publicability LowCardinality(String), privacy LowCardinality(String), public_demo_allowed Bool
)
ENGINE = ReplacingMergeTree
ORDER BY (place_id, display_order, asset_id);

CREATE TABLE IF NOT EXISTS place_review_flags
(
  flag_id String, place_id String, severity LowCardinality(String), user_facing_label String,
  detail String, blocks_public_approval Bool, resolved Bool, public_demo_allowed Bool
)
ENGINE = ReplacingMergeTree
ORDER BY (place_id, flag_id);

CREATE TABLE IF NOT EXISTS response_runs
(
  response_id UUID, version UInt16, kind LowCardinality(String), manifest_json String,
  generated_at DateTime64(3, 'UTC'), privacy LowCardinality(String), query_id String,
  returned_node_count UInt16, duration_ms UInt32
)
ENGINE = MergeTree
ORDER BY (generated_at, response_id);

CREATE TABLE IF NOT EXISTS response_events
(
  event_id UUID, response_id UUID, parent_response_id Nullable(UUID),
  action LowCardinality(String), target_id Nullable(String), occurred_at DateTime64(3, 'UTC')
)
ENGINE = MergeTree
ORDER BY (response_id, occurred_at, event_id);
