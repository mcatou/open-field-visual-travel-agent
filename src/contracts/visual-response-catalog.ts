import { z } from "zod";
import {
  actionDescriptorSchema,
  type ActionDescriptor,
} from "./travel-response";

const catalogEntrySchema = z.object({
  component: z.enum(["TravelRouteCanvas", "ClarificationChoice"]),
  description: z.string().min(1).max(240),
  actionTypes: z.array(actionDescriptorSchema.shape.type).min(1),
}).strict();

export const visualResponseCatalogSchema = z.object({
  route_compare: catalogEntrySchema,
  clarification_choice: catalogEntrySchema,
}).strict();

export type VisualResponseCatalog = z.infer<typeof visualResponseCatalogSchema>;

export const VISUAL_RESPONSE_CATALOG: VisualResponseCatalog = visualResponseCatalogSchema.parse({
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

export function visualResponseCatalogPromptSection(
  catalog: VisualResponseCatalog = VISUAL_RESPONSE_CATALOG,
) {
  return Object.entries(catalog)
    .map(([kind, entry]) => [
      `- ${kind} renders as ${entry.component}.`,
      entry.description,
      `Allowed actions: ${entry.actionTypes.join(", ")}.`,
    ].join(" "))
    .join("\n");
}

export type VisualActionDispatch =
  | { kind: "select_branch"; branchId: string }
  | { kind: "agent_followup"; prompt: string }
  | { kind: "open_compare" }
  | { kind: "open_evidence"; placeId: string }
  | { kind: "toggle_place"; placeId: string }
  | { kind: "unsupported" };

export function dispatchVisualAction(action: ActionDescriptor): VisualActionDispatch {
  if ((action.type === "select_branch" || action.type === "switch_branch") && action.targetId) {
    return { kind: "select_branch", branchId: action.targetId };
  }
  if (action.type === "change_constraint" && action.prompt) {
    return { kind: "agent_followup", prompt: action.prompt };
  }
  if (action.type === "compare") return { kind: "open_compare" };
  if (action.type === "open_evidence" && action.targetId) {
    return { kind: "open_evidence", placeId: action.targetId };
  }
  if (action.type === "exclude_place" && action.targetId) {
    return { kind: "toggle_place", placeId: action.targetId };
  }
  return { kind: "unsupported" };
}
