import { randomUUID } from "node:crypto";
import { shoppingRouteAgent } from "../trigger/compose-shopping-route";

const chatId = `smoke-${randomUUID()}`;
const handle = await shoppingRouteAgent.trigger({
  chatId,
  trigger: "submit-message",
  message: {
    id: `message-${randomUUID()}`,
    role: "user",
    parts: [{ type: "text", text: "Compare a compact vintage-first route with a luxury-first route before 19:30 dinner. Use the available tool data." }],
  },
});

process.stdout.write(JSON.stringify({ ok: true, submitted: true, runId: handle.id, chatId }) + "\n");
