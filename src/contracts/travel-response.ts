import { z } from "zod";

export const responseKindSchema = z.enum([
  "trip_shape_tree", "route_compare", "place_evidence", "plan_diagnosis",
  "trip_story", "clarification_choice",
]);

export const constraintSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  hard: z.boolean(),
});

export const pinSchema = z.object({
  id: z.string().min(1), placeId: z.string().min(1), label: z.string().min(1),
  area: z.string().min(1).optional(),
  latitude: z.number(), longitude: z.number(), kind: z.string().min(1),
  publicDemoAllowed: z.boolean(), mapsUrl: z.string().url().optional(),
  media: z.array(z.object({ assetId: z.string(), title: z.string(), sourceUrl: z.string().url(), localAssetRef: z.string().optional(), priceJpy: z.number().int().nonnegative().optional() })).optional(),
  price: z.object({ status: z.string(), currency: z.literal("JPY"), min: z.number().nonnegative().optional(), max: z.number().nonnegative().optional(), basis: z.string(), capturedItemCount: z.number().int().nonnegative(), inventoryScope: z.string() }).optional(),
  sourceExhaustion: z.object({ exhausted: z.boolean(), selectedImageCount: z.number().int().nonnegative(), availableImageCount: z.number().int().nonnegative(), hackathonThresholdMet: z.boolean(), displayNote: z.string() }).optional(),
  unresolvedReviewFlags: z.array(z.object({ flagId: z.string(), severity: z.string(), userFacingLabel: z.string(), detail: z.string(), blocksPublicApproval: z.boolean() })).optional(),
  details: z.object({
    hours: z.object({
      value: z.string(), sourceLabel: z.string(), sourceUrl: z.string().url(),
      sourceType: z.enum(["official", "editorial", "directory"]), capturedAt: z.string().datetime(),
    }).optional(),
    brands: z.object({
      value: z.string(), items: z.array(z.string().min(1)).min(1),
      sourceLabel: z.string(), sourceUrl: z.string().url(),
      sourceType: z.enum(["official", "editorial", "directory"]), capturedAt: z.string().datetime(),
    }).optional(),
    priceNote: z.string().min(1).optional(),
    shopperTip: z.object({
      value: z.string(), sourceLabel: z.string(), sourceUrl: z.string().url(),
      sourceType: z.enum(["official", "editorial", "directory"]), capturedAt: z.string().datetime(),
    }).optional(),
  }).optional(),
});

export const routeSchema = z.object({
  id: z.string().min(1), branchId: z.string().min(1), placeIds: z.array(z.string()).min(1),
});

export const branchSchema = z.object({
  id: z.string().min(1), label: z.string().min(1), summary: z.string().min(1),
  placeIds: z.array(z.string()).min(1), recommended: z.boolean(),
});

export const evidenceRefSchema = z.object({
  id: z.string().min(1), placeId: z.string().min(1), sourceUrl: z.string().url().optional(),
  sourceType: z.enum(["fixture", "official", "editorial", "user_note"]),
  capturedAt: z.string().datetime(), privacy: z.enum(["public_demo", "internal_only"]),
  summary: z.string().min(1), provenance: z.record(z.string(), z.unknown()).optional(),
});

export const actionDescriptorSchema = z.object({
  type: z.enum(["select_branch", "lock_place", "exclude_place", "change_constraint", "focus_region", "open_evidence", "compare", "undo", "switch_branch"]),
  label: z.string().min(1), targetId: z.string().optional(),
  prompt: z.string().min(1).max(240).optional(),
});

export const technicalTraceSchema = z.object({
  runId: z.string().min(1), agent: z.literal("compose-shopping-route"),
  queryId: z.string().min(1), returnedNodeCount: z.number().int().nonnegative(),
  provenanceState: z.enum(["fixture", "internal_only", "public_demo"]),
  durationMs: z.number().int().nonnegative(),
});

export const planInteractionSchema = z.object({
  mode: z.enum(["replace", "patch", "clarify"]),
  requestId: z.string().min(8).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  baseRevision: z.number().int().nonnegative(),
  revision: z.number().int().positive(),
  summary: z.string().min(1).max(180),
  appliedActions: z.array(z.string().min(1).max(100)).max(8),
  clarification: z.object({
    question: z.string().min(1).max(180),
    options: z.array(z.string().min(1).max(240)).min(2).max(4),
  }).optional(),
}).default({
  mode: "replace",
  requestId: "legacy-response",
  baseRevision: 0,
  revision: 1,
  summary: "Built the initial visual route.",
  appliedActions: [],
}).superRefine((interaction, context) => {
  if (interaction.revision !== interaction.baseRevision + 1) {
    context.addIssue({
      code: "custom",
      path: ["revision"],
      message: "revision must equal baseRevision + 1",
    });
  }
  if (interaction.mode === "clarify" && !interaction.clarification) {
    context.addIssue({
      code: "custom",
      path: ["clarification"],
      message: "clarification choices are required for clarify mode",
    });
  }
});

export const travelResponseSchema = z.object({
  id: z.string().min(1), version: z.number().int().positive(), kind: responseKindSchema,
  question: z.string().min(1), constraints: z.array(constraintSchema), verdict: z.string().min(1),
  world: z.object({
    regionId: z.string().min(1),
    viewport: z.object({ latitude: z.number(), longitude: z.number(), zoom: z.number().positive() }),
    pins: z.array(pinSchema), routes: z.array(routeSchema),
  }),
  branches: z.array(branchSchema).min(1).max(3), selectedBranchId: z.string().optional(),
  evidence: z.array(evidenceRefSchema), actions: z.array(actionDescriptorSchema),
  interaction: planInteractionSchema,
  provenance: z.object({ generatedAt: z.string().datetime(), dataFreshness: z.string().min(1), privacy: z.enum(["public_demo", "internal_only"]) }),
  technicalTrace: technicalTraceSchema,
}).superRefine((response, context) => {
  const pinPlaceIds = new Set(response.world.pins.map((pin) => pin.placeId));
  const branchIds = new Set(response.branches.map((branch) => branch.id));
  if (response.selectedBranchId && !branchIds.has(response.selectedBranchId)) {
    context.addIssue({ code: "custom", path: ["selectedBranchId"], message: "selected branch must exist" });
  }
  response.branches.forEach((branch, branchIndex) => branch.placeIds.forEach((placeId, placeIndex) => {
    if (!pinPlaceIds.has(placeId)) {
      context.addIssue({
        code: "custom",
        path: ["branches", branchIndex, "placeIds", placeIndex],
        message: "branch place must have a matching pin",
      });
    }
  }));
  response.world.routes.forEach((route, routeIndex) => {
    if (!branchIds.has(route.branchId)) {
      context.addIssue({ code: "custom", path: ["world", "routes", routeIndex, "branchId"], message: "route branch must exist" });
    }
    route.placeIds.forEach((placeId, placeIndex) => {
      if (!pinPlaceIds.has(placeId)) {
        context.addIssue({
          code: "custom",
          path: ["world", "routes", routeIndex, "placeIds", placeIndex],
          message: "route place must have a matching pin",
        });
      }
    });
  });
  response.evidence.forEach((evidence, evidenceIndex) => {
    if (!pinPlaceIds.has(evidence.placeId)) {
      context.addIssue({ code: "custom", path: ["evidence", evidenceIndex, "placeId"], message: "evidence place must have a matching pin" });
    }
  });
});

export type TravelResponse = z.infer<typeof travelResponseSchema>;
export type TechnicalTrace = z.infer<typeof technicalTraceSchema>;
export type PlanInteraction = z.infer<typeof planInteractionSchema>;
export type ActionDescriptor = z.infer<typeof actionDescriptorSchema>;
