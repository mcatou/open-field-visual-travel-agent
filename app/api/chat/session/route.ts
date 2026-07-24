import { chat } from "@trigger.dev/sdk/ai";
import { parseChatSessionRequest } from "../../../../src/runtime/chat-session-boundary";

const startSession = chat.createStartSessionAction("compose-shopping-route", {
  tokenTTL: "20m",
  triggerConfig: { maxAttempts: 1, maxDuration: 90, idleTimeoutInSeconds: 120 },
});

export async function POST(request: Request) {
  try {
    const input = parseChatSessionRequest(await request.json());
    const session = await startSession({ chatId: input.chatId, clientData: input.clientData });
    return Response.json({ publicAccessToken: session.publicAccessToken, runId: session.runId });
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const safeMessage = rawMessage
      .replace(/https?:\/\/\S+/g, "[url]")
      .replace(/[A-Za-z0-9_-]{32,}/g, "[redacted]")
      .slice(0, 240);
    console.error("[chat-session] start failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: safeMessage,
    });
    const message = rawMessage.includes("chatId") ? "Invalid chat session request" : "Unable to start chat session";
    return Response.json({ error: message }, { status: 400 });
  }
}
