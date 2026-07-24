import assert from "node:assert/strict";
import test from "node:test";
import { resolveDemoWorkflow } from "../src/runtime/demo-workflow";
import { fashionRouteOrder } from "../src/runtime/fashion-route-order";

test("recognized Loom prompts use immediate visual workflows", () => {
  assert.deepEqual(
    resolveDemoWorkflow(
      "I’m going to Omotesando and Shibuya. I’m a US size 6–8. What should I look for, and can you show me the styles and stores on a map?",
      "tokyo-fashion",
    ),
    { kind: "load_route", route: "fashion" },
  );
  assert.deepEqual(
    resolveDemoWorkflow(
      "Show me vintage shopping around Omotesando and Shibuya.",
      "tokyo-fashion",
    ),
    { kind: "load_route", route: "vintage" },
  );
});

test("quick-action prompts immediately select a visible route branch", () => {
  assert.deepEqual(
    resolveDemoWorkflow("Keep this route to three stores.", "tokyo-fashion"),
    {
      kind: "select_path",
      path: "fused",
      notice: "Showing the shorter three-store route.",
    },
  );
  assert.deepEqual(
    resolveDemoWorkflow(
      "Keep every walk between stores at or under 10 minutes.",
      "tokyo-fashion",
    ),
    {
      kind: "select_path",
      path: "fused",
      notice: "Showing the shorter three-store route.",
    },
  );
  assert.deepEqual(
    resolveDemoWorkflow(
      "Focus this route on Japanese designers and archive pieces.",
      "tokyo-vintage",
    ),
    {
      kind: "select_path",
      path: "luxury",
      notice: "Showing the route with the strongest Japanese-designer focus.",
    },
  );
});

test("unrecognized questions remain available to the live agent", () => {
  assert.equal(
    resolveDemoWorkflow("Can you compare two restaurants?", "tokyo-fashion"),
    null,
  );
});

test("the quick-action route uses only checked sub-10-minute walking legs", () => {
  assert.deepEqual(
    fashionRouteOrder("short-route", [
      "fashion-auralee-tokyo",
      "fashion-aton-aoyama",
      "fashion-mame-aoyama",
      "fashion-cfcl-omotesando",
      "fashion-shibuya-parco",
    ]),
    [
      "fashion-aton-aoyama",
      "fashion-mame-aoyama",
      "fashion-cfcl-omotesando",
    ],
  );
});
