export type ResearchMode = "curated" | "live" | "hybrid";

export const experimentQuestion = "Build a four-hour Tokyo vintage and luxury shopping plan before a 19:30 dinner. Show two route options, product/store images, approximate prices, review warnings, source links and map links.";

export function buildResearchPrompt(mode: ResearchMode, question: string, curatedContext?: unknown): string {
  const context = curatedContext === undefined ? "No curated records are supplied." : `Curated records:\n${JSON.stringify(curatedContext)}`;
  return `${question}\n\nMode: ${mode}. ${context}\nReturn compact, UI-ready content for two route branches. For each stop include name, area, approximate price with freshness status, review warning, source citations, map links, and an image candidate only when a source provides a verifiable direct page or image URL. Never invent image URLs. Mark unresolved facts explicitly. Prefer primary store pages and current Google Maps/listing evidence. Keep prose short because cards, route nodes, citations, and actions will render the answer.`;
}

export type ResearchAssessmentInput = {
  text: string;
  sources: Array<{ url?: string }>;
  toolCalls: number;
  searchBudget?: number;
};

export function assessResearchOutput(input: ResearchAssessmentInput) {
  return {
    hasTwoRoutes: /route\s*(a|1)|vintage first/i.test(input.text) && /route\s*(b|2)|luxury first/i.test(input.text),
    hasPrices: /¥|JPY|price/i.test(input.text),
    hasWarnings: /warn|review|unresolved|verify/i.test(input.text),
    hasMapLinks: /maps\.google\.(com|co\.jp)|google\.(com|co\.jp)\/maps|maps\.app\.goo\.gl/i.test(input.text),
    hasImageCandidates: /image/i.test(input.text) && /https?:\/\//i.test(input.text),
    sourceCount: input.sources.filter((source) => Boolean(source.url)).length,
    toolCalls: input.toolCalls,
    withinSearchBudget: input.toolCalls <= (input.searchBudget ?? 1),
  };
}
