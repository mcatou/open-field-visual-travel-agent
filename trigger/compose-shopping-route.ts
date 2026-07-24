import { chat } from "@trigger.dev/sdk/ai";
import { openai } from "@ai-sdk/openai";
import { stepCountIs, streamText, tool } from "ai";
import { z } from "zod";
import { ClickHouseShoppingRepository, createClickHouseClientFromEnv } from "../src/clickhouse/client";
import { composeShoppingRoute } from "../src/runtime/compose-shopping-route";
import { followupClientDataSchema, type FollowupClientData } from "../src/runtime/travel-followup";
import { visualResponseCatalogPromptSection } from "../src/contracts/visual-response-catalog";
import { loadUsageBudgets, logUsage } from "../src/runtime/usage-budget";

const usageBudgets = loadUsageBudgets();

export function regionForShoppingQuestion(question: string, currentRegionId?: string) {
  if (/vintage|thrift|secondhand|second-hand|archive shopping|古着/i.test(question)) return "tokyo-vintage";
  if (/current fashion|ready-to-wear|us\s*6\s*[-–]\s*8/i.test(question)) return "tokyo-fashion";
  if (currentRegionId === "tokyo-vintage") return "tokyo-vintage";
  if (currentRegionId) return currentRegionId;
  return /omotesando|shibuya|harajuku|us\s*6\s*[-–]\s*8/i.test(question) ? "tokyo-fashion" : "tokyo";
}

function createComposeShoppingRouteTool(clientData?: FollowupClientData) {
  return tool({
    description: "Query approved ClickHouse travel rows and return a revisioned visual-plan patch or clarification.",
    inputSchema: z.object({
      question: z.string().min(1),
      dinnerTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      mode: z.enum(["replace", "patch", "clarify"]).default("patch"),
      excludedPlaceIds: z.array(z.string()).max(8).default([]),
      maxStops: z.number().int().min(1).max(5).optional(),
      maxWalkingMinutes: z.number().int().min(1).max(60).optional(),
      timeLostMinutes: z.number().int().min(1).max(240).optional(),
      clarificationQuestion: z.string().optional(),
      clarificationOptions: z.array(z.string()).min(2).max(4).optional(),
    }),
    execute: async (input) => {
      const clickHouseClient = createClickHouseClientFromEnv();
      try {
        return await composeShoppingRoute(
          {
            ...input,
            dinnerTime: input.dinnerTime ?? "19:30",
            regionId: regionForShoppingQuestion(input.question, clientData?.regionId),
            requestId: clientData?.requestId,
            baseRevision: clientData?.baseRevision ?? 0,
            selectedBranchId: clientData?.selectedBranchId,
            excludedPlaceIds: [...new Set([...(clientData?.removedPlaceIds ?? []), ...input.excludedPlaceIds])],
          },
          new ClickHouseShoppingRepository(clickHouseClient),
        );
      } finally {
        await clickHouseClient.close();
      }
    },
  });
}

export const shoppingRouteAgent = chat.agent({
  id: "compose-shopping-route",
  clientDataSchema: followupClientDataSchema,
  tools: ({ clientData }) => ({ composeShoppingRoute: createComposeShoppingRouteTool(clientData) }),
  run: async ({ messages, tools, signal }) => streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-5-mini"), messages, abortSignal: signal,
    system: [
      "You compose visual Tokyo shopping routes. Always call composeShoppingRoute; never answer with a prose-only plan.",
      "The server securely supplies the current plan revision, region, branch, and existing removals. Do not ask the user to repeat them.",
      "Use mode patch for a follow-up that can be applied. Extract explicit limits such as maxStops, maxWalkingMinutes, timeLostMinutes, and newly excluded place IDs.",
      "If a reference such as 'the expensive one' has multiple plausible meanings, use mode clarify and provide 2-4 short, specific clarificationOptions instead of guessing.",
      "The supported scope is Tokyo current-fashion and vintage-shopping routes, store selection, stop count, walking limits, time lost, and removing a named store.",
      "If the request is outside that scope or cannot be represented by the tool fields, call composeShoppingRoute with mode clarify. Keep the existing route and offer 2-4 useful in-scope choices; do not disguise an unsupported request as a route update.",
      "Pass the user's visible message alone as question.",
      "A phrase such as US 6-8 means women's clothing size unless the user explicitly says shoes.",
      "Never add dinner or other fixed plans the user did not state. Never invent places or evidence. After the tool result, return at most one short sentence.",
      "The validated visual response catalog is:",
      visualResponseCatalogPromptSection(),
    ].join(" "),
    ...chat.toStreamTextOptions({ tools }),
    maxOutputTokens: usageBudgets.openAiOutputTokensPerRun,
    stopWhen: stepCountIs(usageBudgets.triggerStepsPerRun),
    onFinish: ({ usage, finishReason, steps }) => logUsage({
      provider: "openai",
      operation: "compose-shopping-route",
      finishReason,
      steps: steps.length,
      stepLimit: usageBudgets.triggerStepsPerRun,
      outputTokenLimit: usageBudgets.openAiOutputTokensPerRun,
      usage,
    }),
  }),
});
