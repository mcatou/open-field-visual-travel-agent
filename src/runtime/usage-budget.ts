export type UsageBudgets = {
  clickHouseQueriesPerRun: number;
  clickHouseRowsPerQuery: number;
  openAiOutputTokensPerRun: number;
  openAiWebSearchesPerRun: number;
  triggerStepsPerRun: number;
};

export class UsageBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageBudgetExceededError";
  }
}

const LIMITS = {
  clickHouseQueriesPerRun: { env: "CLICKHOUSE_MAX_QUERIES_PER_RUN", fallback: 2, ceiling: 10 },
  clickHouseRowsPerQuery: { env: "CLICKHOUSE_MAX_ROWS_PER_QUERY", fallback: 12, ceiling: 100 },
  openAiOutputTokensPerRun: { env: "OPENAI_MAX_OUTPUT_TOKENS_PER_RUN", fallback: 900, ceiling: 4_000 },
  openAiWebSearchesPerRun: { env: "OPENAI_MAX_WEB_SEARCHES_PER_RUN", fallback: 1, ceiling: 3 },
  triggerStepsPerRun: { env: "TRIGGER_MAX_STEPS_PER_RUN", fallback: 3, ceiling: 8 },
} as const;

function positiveInteger(env: Record<string, string | undefined>, name: string, fallback: number, ceiling: number): number {
  const raw = env[name];
  const value = raw === undefined || raw === "" ? fallback : Number(raw);
  if (!Number.isSafeInteger(value) || value < 1 || value > ceiling) {
    throw new UsageBudgetExceededError(`${name} must be an integer between 1 and ${ceiling}`);
  }
  return value;
}

export function loadUsageBudgets(env: Record<string, string | undefined> = process.env): UsageBudgets {
  return {
    clickHouseQueriesPerRun: positiveInteger(env, LIMITS.clickHouseQueriesPerRun.env, LIMITS.clickHouseQueriesPerRun.fallback, LIMITS.clickHouseQueriesPerRun.ceiling),
    clickHouseRowsPerQuery: positiveInteger(env, LIMITS.clickHouseRowsPerQuery.env, LIMITS.clickHouseRowsPerQuery.fallback, LIMITS.clickHouseRowsPerQuery.ceiling),
    openAiOutputTokensPerRun: positiveInteger(env, LIMITS.openAiOutputTokensPerRun.env, LIMITS.openAiOutputTokensPerRun.fallback, LIMITS.openAiOutputTokensPerRun.ceiling),
    openAiWebSearchesPerRun: positiveInteger(env, LIMITS.openAiWebSearchesPerRun.env, LIMITS.openAiWebSearchesPerRun.fallback, LIMITS.openAiWebSearchesPerRun.ceiling),
    triggerStepsPerRun: positiveInteger(env, LIMITS.triggerStepsPerRun.env, LIMITS.triggerStepsPerRun.fallback, LIMITS.triggerStepsPerRun.ceiling),
  };
}

export function logUsage(event: Record<string, unknown>): void {
  console.info(JSON.stringify({ event: "api_usage", at: new Date().toISOString(), ...event }));
}
