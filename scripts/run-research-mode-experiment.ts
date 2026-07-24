import { mkdir, writeFile } from "node:fs/promises";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ClickHouseShoppingRepository, createClickHouseClientFromEnv } from "../src/clickhouse/client";
import { composeShoppingRoute } from "../src/runtime/compose-shopping-route";
import { assessResearchOutput, buildResearchPrompt, experimentQuestion, type ResearchMode } from "../src/runtime/research-experiment";
import { loadUsageBudgets, logUsage } from "../src/runtime/usage-budget";

const budgets = loadUsageBudgets();
const model = process.env.OPENAI_RESEARCH_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-5-mini";

const curated = await composeShoppingRoute(
  { question: experimentQuestion, dinnerTime: "19:30", regionId: "tokyo" },
  new ClickHouseShoppingRepository(createClickHouseClientFromEnv(), budgets),
);
const publicHybridContext = {
  branches: curated.branches.map(({ id, label, placeIds }) => ({ id, label, placeIds })),
  stops: curated.world.pins
    .filter((pin) => pin.publicDemoAllowed)
    .map(({ placeId, label, kind, mapsUrl, price }) => ({ placeId, label, kind, mapsUrl, price })),
};

type ModeResult = {
  mode: ResearchMode;
  text: string;
  sources: Array<{ url?: string; title?: string }>;
  usage: unknown;
  toolCalls: number;
  assessment: ReturnType<typeof assessResearchOutput>;
};

async function runWebMode(mode: "live" | "hybrid"): Promise<ModeResult> {
  const started = Date.now();
  const result = await generateText({
    model: openai.responses(model),
    prompt: buildResearchPrompt(mode, experimentQuestion, mode === "hybrid" ? publicHybridContext : undefined),
    tools: {
      web_search: openai.tools.webSearch({
        searchContextSize: "low",
        userLocation: { type: "approximate", country: "JP", city: "Tokyo", timezone: "Asia/Tokyo" },
      }),
    },
    toolChoice: { type: "tool", toolName: "web_search" },
    maxOutputTokens: budgets.openAiOutputTokensPerRun,
    providerOptions: { openai: { maxToolCalls: budgets.openAiWebSearchesPerRun, reasoningEffort: "low", textVerbosity: "low", store: false } },
  });
  const sources = result.steps.flatMap((step) => step.sources).flatMap((source) => source.sourceType === "url" ? [{ url: source.url, title: source.title }] : []);
  const toolCalls = result.steps.flatMap((step) => step.toolCalls).filter((call) => call.toolName === "web_search").length;
  logUsage({ provider: "openai", operation: `research-experiment-${mode}`, model, durationMs: Date.now() - started, webSearchLimit: budgets.openAiWebSearchesPerRun, toolCalls, outputTokenLimit: budgets.openAiOutputTokensPerRun, usage: result.totalUsage });
  return { mode, text: result.text, sources, usage: result.totalUsage, toolCalls, assessment: assessResearchOutput({ text: result.text, sources, toolCalls, searchBudget: budgets.openAiWebSearchesPerRun }) };
}

const curatedText = JSON.stringify(curated);
const results: ModeResult[] = [{
  mode: "curated",
  text: curatedText,
  sources: curated.evidence.flatMap((item) => item.sourceUrl ? [{ url: item.sourceUrl }] : []),
  usage: { inputTokens: 0, outputTokens: 0 },
  toolCalls: 0,
  assessment: assessResearchOutput({ text: curatedText, sources: curated.evidence.map((item) => ({ url: item.sourceUrl })), toolCalls: 0, searchBudget: budgets.openAiWebSearchesPerRun }),
}];

for (const mode of ["live", "hybrid"] as const) results.push(await runWebMode(mode));

const output = {
  generatedAt: new Date().toISOString(),
  question: experimentQuestion,
  limits: budgets,
  note: "Web-derived claims and image candidates remain unapproved until human review.",
  results,
};
await mkdir("outputs", { recursive: true });
const outputPath = `outputs/research-mode-experiment-${new Date().toISOString().replaceAll(":", "-")}.json`;
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.info(JSON.stringify({ event: "research_experiment_complete", outputPath, modes: results.map(({ mode, assessment, usage }) => ({ mode, assessment, usage })) }));
