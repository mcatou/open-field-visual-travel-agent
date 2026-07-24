import assert from "node:assert/strict";
import test from "node:test";
import { loadUsageBudgets, UsageBudgetExceededError } from "../src/runtime/usage-budget";
import { attachApprovedFashionMedia, normalizeClickHousePlace } from "../src/clickhouse/client";
import { demoPlaces } from "../src/data/demo-places";
import { readFileSync } from "node:fs";

test("usage budgets use conservative defaults", () => {
  const budgets = loadUsageBudgets({});
  assert.deepEqual(budgets, {
    clickHouseQueriesPerRun: 2,
    clickHouseRowsPerQuery: 12,
    openAiOutputTokensPerRun: 900,
    openAiWebSearchesPerRun: 1,
    triggerStepsPerRun: 3,
  });
});

test("usage budgets accept bounded positive integers", () => {
  const budgets = loadUsageBudgets({
    CLICKHOUSE_MAX_QUERIES_PER_RUN: "1",
    CLICKHOUSE_MAX_ROWS_PER_QUERY: "8",
    OPENAI_MAX_OUTPUT_TOKENS_PER_RUN: "600",
    OPENAI_MAX_WEB_SEARCHES_PER_RUN: "2",
    TRIGGER_MAX_STEPS_PER_RUN: "2",
  });
  assert.equal(budgets.clickHouseQueriesPerRun, 1);
  assert.equal(budgets.clickHouseRowsPerQuery, 8);
  assert.equal(budgets.openAiOutputTokensPerRun, 600);
  assert.equal(budgets.openAiWebSearchesPerRun, 2);
  assert.equal(budgets.triggerStepsPerRun, 2);
});

test("usage budgets reject invalid or dangerously large values", () => {
  assert.throws(
    () => loadUsageBudgets({ OPENAI_MAX_OUTPUT_TOKENS_PER_RUN: "50000" }),
    UsageBudgetExceededError,
  );
  assert.throws(
    () => loadUsageBudgets({ CLICKHOUSE_MAX_QUERIES_PER_RUN: "0" }),
    UsageBudgetExceededError,
  );
  assert.throws(
    () => loadUsageBudgets({ OPENAI_MAX_WEB_SEARCHES_PER_RUN: "4" }),
    UsageBudgetExceededError,
  );
});

test("ClickHouse null optionals are omitted at the response boundary", () => {
  const normalized = normalizeClickHousePlace({ ...demoPlaces[0], sourceUrl: null, mapsUrl: null } as unknown as Parameters<typeof normalizeClickHousePlace>[0]);
  assert.equal(normalized.sourceUrl, undefined);
  assert.equal(normalized.mapsUrl, undefined);
});

test("runtime ClickHouse query is restricted to approved public-demo rows", () => {
  const source = readFileSync(new URL("../src/clickhouse/client.ts", import.meta.url), "utf8");
  assert.match(source, /public_demo_allowed = true/);
  assert.match(source, /privacy = 'public_demo'/);
  assert.match(source, /FROM places FINAL/);
});

test("live ClickHouse fashion rows are enriched only from the approved public-demo media registry", () => {
  const fashionRow = demoPlaces.find((row) => row.placeId === "fashion-auralee-tokyo");
  assert.ok(fashionRow);
  const [enriched] = attachApprovedFashionMedia([{ ...fashionRow, media: undefined }], "tokyo-fashion");
  assert.equal(enriched.media?.length, 5);
  assert.equal(enriched.provenance?.mediaSource, "approved public-demo asset registry");
  assert.equal(attachApprovedFashionMedia([{ ...fashionRow, media: undefined }], "tokyo")[0].media, undefined);
});
