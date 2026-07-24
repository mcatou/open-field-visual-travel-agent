import { z } from "zod";
import type { TravelResponse } from "../contracts/travel-response";

export type FollowupMapMode = "plan" | "route" | "place";

export type FollowupViewState = {
  selectedBranchId: string;
  removedPlaceIds: string[];
  selectedPlaceId: string;
  mapMode: FollowupMapMode;
  mapExpanded: boolean;
  evidenceOpen: boolean;
  panelOpen: boolean;
};

export const followupClientDataSchema = z.object({
  protocolVersion: z.literal(1),
  requestId: z.string().min(12).max(80).regex(/^[a-zA-Z0-9_-]+$/),
  baseRevision: z.number().int().nonnegative(),
  regionId: z.literal("tokyo-fashion"),
  selectedBranchId: z.string().min(1).max(80),
  removedPlaceIds: z.array(z.string().min(1).max(100)).max(20),
  constraints: z.array(z.object({
    id: z.string().min(1).max(80),
    value: z.string().min(1).max(160),
  }).strict()).max(12),
}).strict();

export type FollowupClientData = z.infer<typeof followupClientDataSchema>;

type FollowupClientDataInput = {
  requestId: string;
  response: TravelResponse;
  selectedBranchId: string;
  removedPlaceIds: string[];
};

export function buildFollowupClientData(input: FollowupClientDataInput): FollowupClientData {
  const activeBranch = input.response.branches.find((branch) => branch.id === input.selectedBranchId)
    ?? input.response.branches[0];
  return followupClientDataSchema.parse({
    protocolVersion: 1,
    requestId: input.requestId,
    baseRevision: input.response.interaction.revision,
    regionId: input.response.world.regionId,
    selectedBranchId: activeBranch.id,
    removedPlaceIds: [...new Set(input.removedPlaceIds)],
    constraints: input.response.constraints.map(({ id, value }) => ({ id, value })),
  });
}

export function shouldAcceptFollowupResponse(
  pendingRequestId: string | null,
  currentRevision: number,
  incoming: TravelResponse,
) {
  return Boolean(
    pendingRequestId
    && incoming.interaction.requestId === pendingRequestId
    && incoming.interaction.baseRevision === currentRevision
    && incoming.interaction.revision > currentRevision,
  );
}

export function reconcileFollowupViewState(
  current: FollowupViewState,
  incoming: TravelResponse,
): FollowupViewState {
  const selectedBranch = incoming.branches.find((branch) => branch.id === incoming.selectedBranchId)
    ?? incoming.branches.find((branch) => branch.id === current.selectedBranchId)
    ?? incoming.branches[0];
  const knownPlaceIds = new Set(incoming.world.pins.map((pin) => pin.placeId));
  const selectedStillActive = selectedBranch.placeIds.includes(current.selectedPlaceId);
  const selectedPlaceId = selectedStillActive ? current.selectedPlaceId : selectedBranch.placeIds[0];
  const invalidatedPlaceFocus = current.mapMode === "place" && !selectedStillActive;

  return {
    selectedBranchId: selectedBranch.id,
    removedPlaceIds: current.removedPlaceIds.filter((id) => knownPlaceIds.has(id)),
    selectedPlaceId,
    mapMode: invalidatedPlaceFocus ? "route" : current.mapMode,
    mapExpanded: current.mapExpanded,
    evidenceOpen: invalidatedPlaceFocus ? false : current.evidenceOpen,
    panelOpen: current.panelOpen,
  };
}
