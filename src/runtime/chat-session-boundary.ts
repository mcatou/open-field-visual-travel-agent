import { z } from "zod";
import { followupClientDataSchema } from "./travel-followup";

const requestSchema = z.object({
  chatId: z.string().min(12).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  clientData: followupClientDataSchema,
}).strict();

export function parseChatSessionRequest(input: unknown) {
  return requestSchema.parse(input);
}
