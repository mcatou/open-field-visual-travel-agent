import { readFile } from "node:fs/promises";
import { createClickHouseClientFromEnv, ClickHouseShoppingRepository } from "../src/clickhouse/client";
import { composeShoppingRoute } from "../src/runtime/compose-shopping-route";
import { generateSeedRows } from "./generate-clickhouse-seed";

const client = createClickHouseClientFromEnv();

try {
  const schema = await readFile(new URL("../clickhouse/schema.sql", import.meta.url), "utf8");
  const statements = schema.split(/;\s*(?:\n|$)/).map((statement) => statement.trim()).filter(Boolean);
  for (const statement of statements) await client.command({ query: statement });

  const rows = generateSeedRows();
  await client.insert({ table: "places", format: "JSONEachRow", values: rows });

  const response = await composeShoppingRoute(
    { question: "Compare vintage and luxury before dinner", dinnerTime: "19:30", regionId: "tokyo" },
    new ClickHouseShoppingRepository(client),
  );
  const fashionResponse = await composeShoppingRoute(
    { question: "Omotesando and Shibuya clothing route for US 6-8", dinnerTime: "19:30", regionId: "tokyo-fashion" },
    new ClickHouseShoppingRepository(client),
  );
  const vintageResponse = await composeShoppingRoute(
    { question: "Vintage shopping around Omotesando and Shibuya", dinnerTime: "19:30", regionId: "tokyo-vintage" },
    new ClickHouseShoppingRepository(client),
  );

  process.stdout.write(JSON.stringify({
    ok: true,
    schemaStatements: statements.length,
    insertedFixtureRows: rows.length,
    responseKind: response.kind,
    returnedNodes: response.technicalTrace.returnedNodeCount,
    fashionNodes: fashionResponse.technicalTrace.returnedNodeCount,
    fashionConstraint: fashionResponse.constraints.find((item) => item.id === "clothing-size")?.value,
    vintageNodes: vintageResponse.technicalTrace.returnedNodeCount,
    vintageBranches: vintageResponse.branches.map((branch) => branch.label),
    privacy: response.provenance.privacy,
  }) + "\n");
} finally {
  await client.close();
}
