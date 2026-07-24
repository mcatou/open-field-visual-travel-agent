import assert from "node:assert/strict";
import test from "node:test";
import { parseChatSessionRequest } from "../src/runtime/chat-session-boundary";

const validClientData = {
  protocolVersion: 1,
  requestId: "session-atlas-1234567890",
  baseRevision: 1,
  regionId: "tokyo-fashion",
  selectedBranchId: "vintage-first",
  removedPlaceIds: [],
  constraints: [
    { id: "fit", value: "US 6-8" },
    { id: "area", value: "Omotesando and Shibuya" },
  ],
};

test("chat session request accepts an opaque chat id with validated preload context", () => {
  assert.deepEqual(parseChatSessionRequest({
    chatId: "atlas-1234567890",
    clientData: validClientData,
  }), {
    chatId: "atlas-1234567890",
    clientData: validClientData,
  });
});

test("chat session request rejects missing context, malformed ids, and unexpected fields", () => {
  assert.throws(() => parseChatSessionRequest({ chatId: "atlas-1234567890" }));
  assert.throws(() => parseChatSessionRequest({ chatId: "../bad", clientData: validClientData }));
  assert.throws(() => parseChatSessionRequest({
    chatId: "atlas-1234567890",
    clientData: validClientData,
    accessCode: "unexpected",
  }));
});
