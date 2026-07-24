import { createClient, type ClickHouseClient } from "@clickhouse/client";
import type { TravelResponse } from "../contracts/travel-response";
import { demoPlaces, type DemoPlace } from "../data/demo-places";
import type { PlaceQuery, ShoppingRepository, ShoppingRouteRequest } from "../runtime/compose-shopping-route";
import { loadUsageBudgets, logUsage, UsageBudgetExceededError, type UsageBudgets } from "../runtime/usage-budget";

export function createClickHouseClientFromEnv(env = process.env): ClickHouseClient {
  const url = env.CLICKHOUSE_URL;
  if (!url) throw new Error("CLICKHOUSE_URL is required");
  return createClient({ url, username: env.CLICKHOUSE_USERNAME, password: env.CLICKHOUSE_PASSWORD, database: env.CLICKHOUSE_DATABASE ?? "default" });
}

export function normalizeClickHousePlace(row: DemoPlace & { sourceUrl?: string | null; mapsUrl?: string | null }): DemoPlace {
  return {
    ...row,
    sourceUrl: row.sourceUrl ?? undefined,
    mapsUrl: row.mapsUrl ?? undefined,
  };
}

export function attachApprovedFashionMedia(rows: DemoPlace[], regionId?: string): DemoPlace[] {
  if (regionId !== "tokyo-fashion" && regionId !== "tokyo-vintage") return rows;
  const allowedRegions = regionId === "tokyo-vintage"
    ? new Set(["tokyo-vintage", "tokyo-fashion"])
    : new Set(["tokyo-fashion"]);
  const registry = new Map(
    demoPlaces
      .filter((place) => place.regionId && allowedRegions.has(place.regionId) && place.publicDemoAllowed)
      .map((place) => [place.placeId, place]),
  );
  return rows.map((row) => {
    const approved = registry.get(row.placeId);
    if (!approved) return row;
    return {
      ...row,
      media: approved.media,
      price: approved.price,
      details: approved.details,
      sourceExhaustion: approved.sourceExhaustion,
      unresolvedReviewFlags: approved.unresolvedReviewFlags,
      provenance: {
        ...(row.provenance ?? {}),
        mediaSource: "approved public-demo asset registry",
        mediaPlaceId: approved.placeId,
      },
    };
  });
}

export class ClickHouseShoppingRepository implements ShoppingRepository {
  private queryCount = 0;

  constructor(
    private readonly client: ClickHouseClient,
    private readonly budgets: UsageBudgets = loadUsageBudgets(),
  ) {}

  async findShoppingPlaces(input: ShoppingRouteRequest): Promise<PlaceQuery> {
    this.queryCount += 1;
    if (this.queryCount > this.budgets.clickHouseQueriesPerRun) {
      throw new UsageBudgetExceededError(`ClickHouse query budget exceeded: ${this.queryCount}/${this.budgets.clickHouseQueriesPerRun}`);
    }
    const started = Date.now();
    const queryId = crypto.randomUUID();
    const result = await this.client.query({
      query: `SELECT place_id AS placeId, name, area, category, latitude, longitude, preference_score AS preferenceScore, source_type AS sourceType, nullIf(source_url, '') AS sourceUrl, nullIf(maps_url, '') AS mapsUrl, formatDateTime(captured_at, '%FT%T.000Z', 'UTC') AS capturedAt, privacy, public_demo_allowed AS publicDemoAllowed, summary FROM places FINAL WHERE runtime_enabled = true AND public_demo_allowed = true AND privacy = 'public_demo' AND (region_id = {region:String} OR ({region:String} = 'tokyo-vintage' AND region_id = 'tokyo-fashion')) ORDER BY preference_score DESC LIMIT {rowLimit:UInt32}`,
      query_params: { region: input.regionId ?? "tokyo", rowLimit: this.budgets.clickHouseRowsPerQuery },
      format: "JSONEachRow",
      query_id: queryId,
      clickhouse_settings: {
        readonly: "2",
        max_result_rows: String(this.budgets.clickHouseRowsPerQuery),
        result_overflow_mode: "break",
        max_execution_time: 15,
      },
    });
    const queriedRows = (await result.json<DemoPlace & { sourceUrl?: string | null; mapsUrl?: string | null }>()).map(normalizeClickHousePlace);
    const rows = attachApprovedFashionMedia(queriedRows, input.regionId);
    const durationMs = Date.now() - started;
    logUsage({ provider: "clickhouse", operation: "findShoppingPlaces", queryId, queryCount: this.queryCount, returnedRows: rows.length, rowLimit: this.budgets.clickHouseRowsPerQuery, durationMs });
    return { rows, queryId, durationMs };
  }

  async recordResponse(response: TravelResponse): Promise<void> {
    await this.client.insert({ table: "response_runs", format: "JSONEachRow", values: [{ response_id: response.id, version: response.version, kind: response.kind, manifest_json: JSON.stringify(response), generated_at: response.provenance.generatedAt, privacy: response.provenance.privacy, query_id: response.technicalTrace.queryId, returned_node_count: response.technicalTrace.returnedNodeCount, duration_ms: response.technicalTrace.durationMs }] });
  }
}
