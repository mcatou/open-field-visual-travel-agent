import assert from "node:assert/strict";
import test from "node:test";
import { buildFashionDemoFallback } from "../src/runtime/fashion-demo-fallback";
import {
  dispatchVisualAction,
  visualResponseCatalogPromptSection,
  visualResponseCatalogSchema,
} from "../src/contracts/visual-response-catalog";

test("the model-facing component reference is generated from the validated visual catalog", () => {
  const parsed = visualResponseCatalogSchema.parse({
    route_compare: {
      component: "TravelRouteCanvas",
      description: "Persistent route, map, product media, evidence, and controls.",
      actionTypes: ["select_branch", "exclude_place", "change_constraint", "open_evidence", "compare"],
    },
    clarification_choice: {
      component: "ClarificationChoice",
      description: "Two to four precise choices without replacing the current route.",
      actionTypes: ["change_constraint"],
    },
  });

  const promptReference = visualResponseCatalogPromptSection(parsed);
  assert.match(promptReference, /TravelRouteCanvas/);
  assert.match(promptReference, /ClarificationChoice/);
  assert.match(promptReference, /change_constraint/);
});

test("typed response actions dispatch to local UI state or a bounded agent follow-up", () => {
  const response = buildFashionDemoFallback("Shopping route");
  const branchAction = response.actions.find((action) => action.type === "switch_branch");
  const constraintAction = response.actions.find((action) => action.type === "change_constraint");

  assert.ok(branchAction);
  assert.deepEqual(dispatchVisualAction(branchAction), {
    kind: "select_branch",
    branchId: branchAction.targetId,
  });

  assert.ok(constraintAction);
  assert.deepEqual(dispatchVisualAction(constraintAction), {
    kind: "agent_followup",
    prompt: constraintAction.prompt,
  });
});
