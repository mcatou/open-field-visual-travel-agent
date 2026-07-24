"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { TriggerChatTransport } from "@trigger.dev/sdk/chat";
import { travelResponseSchema, type TravelResponse } from "../src/contracts/travel-response";
import {
  dispatchVisualAction,
  type VisualActionDispatch,
} from "../src/contracts/visual-response-catalog";
import { buildFashionDemoFallback } from "../src/runtime/fashion-demo-fallback";
import { buildVintageDemoFallback } from "../src/runtime/vintage-demo-fallback";
import { resolveDemoWorkflow } from "../src/runtime/demo-workflow";
import {
  buildFollowupClientData,
  followupClientDataSchema,
  reconcileFollowupViewState,
  shouldAcceptFollowupResponse,
  type FollowupClientData,
} from "../src/runtime/travel-followup";
import { buildFashionRouteMapsUrl } from "../src/data/fashion-walking-legs";
import { FASHION_FX_SNAPSHOT, formatMediaPrice } from "../src/data/fashion-price-display";
import { fashionStoreCovers } from "../src/data/fashion-store-covers";
import { fashionMaterialNoteFor } from "../src/data/fashion-copy";
import { RouteMap, type RouteMapStop } from "./route-map";
import "./atlas-flow.css";

type PathId = "vintage" | "luxury" | "fused";
type MapMode = "plan" | "route" | "place";
type MediaItem = { src: string; title: string; sourceUrl: string; priceJpy?: number; role: "store_cover" | "product" };
type StoreFact = {
  value: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceType: "official" | "editorial" | "directory";
};
type Stop = {
  id: string;
  name: string;
  area: string;
  time: string;
  kind: string;
  reason: string;
  materialsNote?: string;
  image: string;
  cover: MediaItem;
  media: MediaItem[];
  source: string;
  website: string;
  maps: string;
  latitude: number;
  longitude: number;
  details?: {
    hours?: StoreFact;
    brands?: StoreFact & { items: string[] };
    priceNote?: string;
    shopperTip?: StoreFact;
  };
  reviewFlags?: string[];
};

const DEFAULT_FASHION_PROMPT = "I’m going to Omotesando/Shibuya. I’m US 6-8. What should I look for, and can you show the styles and stores on a map?";
const INITIAL_FASHION_RESPONSE = buildFashionDemoFallback(DEFAULT_FASHION_PROMPT);

function extractTravelResponse(messages: unknown[]): TravelResponse | undefined {
  for (const message of [...messages].reverse()) {
    const parts = (message as { parts?: unknown[] }).parts ?? [];
    for (const part of [...parts].reverse()) {
      const candidate = part as { type?: string; toolName?: string; output?: unknown; result?: unknown };
      const isComposer = candidate.type === "tool-composeShoppingRoute" || (candidate.type === "dynamic-tool" && candidate.toolName === "composeShoppingRoute");
      if (!isComposer) continue;
      const parsed = travelResponseSchema.safeParse(candidate.output ?? candidate.result);
      if (parsed.success) return parsed.data;
    }
  }
}

function routeTime(index: number) {
  return ["10:00", "11:30", "13:00", "15:00", "17:00"][index] ?? `${10 + index}:00`;
}

function pathForBranchId(branchId: string): PathId {
  if (branchId === "luxury-first") return "luxury";
  if (branchId === "short-route") return "fused";
  return "vintage";
}

function liveStopsFrom(response: TravelResponse): Record<string, Stop> {
  return Object.fromEntries(response.world.pins.map((pin, index) => {
    const evidence = response.evidence.find((item) => item.placeId === pin.placeId);
    const media = (pin.media ?? []).map((item) => ({
      src: item.localAssetRef ?? item.sourceUrl,
      title: item.title,
      sourceUrl: item.sourceUrl,
      priceJpy: item.priceJpy,
      role: "product" as const,
    }));
    const fallback = "/tokyo-design-v1.png";
    const usableMedia = media.length ? media : [{ src: fallback, title: pin.label, sourceUrl: evidence?.sourceUrl ?? pin.mapsUrl ?? "https://www.google.com/maps", role: "product" as const }];
    const sourcedCover = fashionStoreCovers[pin.placeId];
    const cover: MediaItem = sourcedCover ?? { ...usableMedia[0], role: "store_cover" };
    const productMedia = usableMedia.filter((item) => item.src !== cover.src);
    return [pin.placeId, {
      id: pin.placeId,
      name: pin.label,
      area: pin.area ?? pin.kind,
      time: routeTime(index),
      kind: pin.kind.replace("_", " ").toUpperCase(),
      reason: evidence?.summary ?? "A useful stop for this route.",
      materialsNote: fashionMaterialNoteFor(pin.placeId),
      image: cover.src,
      cover,
      media: productMedia.length ? productMedia : usableMedia,
      source: pin.details?.shopperTip ? "Official store facts + labeled editorial tips" : "Official store and product references",
      website: evidence?.sourceUrl ?? usableMedia[0].sourceUrl,
      maps: pin.mapsUrl ?? evidence?.sourceUrl ?? "https://www.google.com/maps",
      latitude: pin.latitude,
      longitude: pin.longitude,
      details: pin.details,
      reviewFlags: pin.unresolvedReviewFlags?.map((flag) => flag.userFacingLabel),
    } satisfies Stop];
  }));
}

function StopCard({ stop, removed, selected, onOpen, onMap, onToggle }: {
  stop: Stop;
  removed: boolean;
  selected: boolean;
  onOpen: () => void;
  onMap: () => void;
  onToggle: () => void;
}) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const carousel = [stop.cover, ...stop.media];
  const media = carousel[mediaIndex] ?? carousel[0];
  const move = (delta: number) => setMediaIndex((current) => (current + delta + carousel.length) % carousel.length);

  return <article data-stop-id={stop.id} className={`stop-card ${removed ? "removed" : ""} ${selected ? "selected" : ""}`}>
    <div className="stop-photo" style={{ backgroundImage: `url(${media.src})` }}>
      <button className="photo-open" onClick={onOpen} aria-label={`Open ${stop.name} evidence`}><b>↗</b></button>
      {carousel.length > 1 && <div className="photo-controls">
        <button onClick={() => move(-1)} aria-label={`Previous ${stop.name} item`}>‹</button>
        <a href={media.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${media.title}`}>{mediaIndex + 1}/{carousel.length}</a>
        <button onClick={() => move(1)} aria-label={`Next ${stop.name} item`}>›</button>
      </div>}
      <small>{media.title}</small>
    </div>
    <div className="stop-copy">
      <small>{stop.kind} · {stop.area}</small>
      <strong>{stop.name}</strong>
      <p>{stop.reason}</p>
      <div>
        <button onClick={onOpen}>WHY THIS</button>
        <button className="map-action" onClick={onMap}>MAP</button>
        <button onClick={onToggle}>{removed ? "RESTORE" : "REMOVE"}</button>
      </div>
    </div>
  </article>;
}

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [path, setPath] = useState<PathId>("vintage");
  const [removed, setRemoved] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("fashion-auralee-tokyo");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidenceMediaIndex, setEvidenceMediaIndex] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapMode, setMapMode] = useState<MapMode>("plan");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mapViewRevision, setMapViewRevision] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [planResponse, setPlanResponse] = useState<TravelResponse>(INITIAL_FASHION_RESPONSE);
  const [, setPlanOrigin] = useState<"preview" | "live" | "last-good">("preview");
  const [requestPending, setRequestPending] = useState(false);
  const [composerNotice, setComposerNotice] = useState("Route ready. Ask to change a store, route, area, or fit priority.");
  const requestTimeoutRef = useRef<number | null>(null);
  const pendingRequestIdRef = useRef<string | null>(null);
  const pendingBaseRevisionRef = useRef<number | null>(null);
  const pendingOptimisticRef = useRef(false);
  const responsePanelRef = useRef<HTMLElement>(null);
  const chatId = useMemo(() => `atlas-${crypto.randomUUID()}`, []);
  const sessionClientData = useMemo(() => buildFollowupClientData({
    requestId: `session-${chatId}`,
    response: INITIAL_FASHION_RESPONSE,
    selectedBranchId: INITIAL_FASHION_RESPONSE.selectedBranchId ?? INITIAL_FASHION_RESPONSE.branches[0].id,
    removedPlaceIds: [],
  }), [chatId]);
  const transport = useMemo(() => new TriggerChatTransport({
    task: "compose-shopping-route",
    clientData: sessionClientData,
    accessToken: async () => startLiveSession(chatId, sessionClientData),
    startSession: async ({ clientData }) => ({
      publicAccessToken: await startLiveSession(
        chatId,
        followupClientDataSchema.parse(clientData),
      ),
    }),
  }), [chatId, sessionClientData]);
  const { messages, sendMessage, status, error, clearError, stop } = useChat({ id: chatId, transport });
  const agentResponse = useMemo(() => extractTravelResponse(messages), [messages]);
  const liveResponse = planResponse;
  const liveStops = useMemo(() => liveStopsFrom(liveResponse), [liveResponse]);
  const primaryBranch = liveResponse.branches.find((item) => item.id === "vintage-first") ?? liveResponse.branches[0];
  const secondaryBranch = liveResponse.branches.find((item) => item.id === "luxury-first") ?? liveResponse.branches[1];
  const shortBranch = liveResponse.branches.find((item) => item.id === "short-route") ?? liveResponse.branches[2];
  const activeBranch = path === "luxury" ? secondaryBranch : path === "fused" ? shortBranch : primaryBranch;
  const activeStops = useMemo(() => activeBranch.placeIds.map((id, index) => ({ ...liveStops[id], time: routeTime(index) })).filter((item): item is Stop => Boolean(item.id)), [activeBranch, liveStops]);
  const selected = liveStops[selectedId] ?? activeStops[0];
  const selectedCarousel = [selected.cover, ...selected.media];
  const evidenceMedia = selectedCarousel[evidenceMediaIndex] ?? selectedCarousel[0];
  const visibleStops = activeStops.filter((stop) => !removed.includes(stop.id));
  const visibleRouteMapsUrl = useMemo(
    () => buildFashionRouteMapsUrl(visibleStops.map((stop) => stop.id)),
    [visibleStops],
  );
  const isVintagePlan = liveResponse.world.regionId === "tokyo-vintage";
  const routeLead = isVintagePlan
    ? path === "luxury"
      ? "Fashion + vintage · Aoyama → Harajuku → Shibuya"
      : path === "fused"
        ? "Harajuku vintage cluster"
        : "Vintage route · Omotesando → Harajuku → Shibuya"
    : activeBranch.summary;
  const vintageOverview = path === "luxury"
    ? `${visibleStops.length} stores · current fashion and vintage`
    : path === "fused"
      ? `${visibleStops.length} stores · compact walking cluster`
      : `${visibleStops.length} stores · luxury resale to Japanese archive`;
  const mapStops = useMemo<RouteMapStop[]>(() => activeStops.map((stop) => ({
    id: stop.id,
    name: stop.name,
    area: stop.area,
    latitude: stop.latitude,
    longitude: stop.longitude,
    image: stop.image,
    removed: removed.includes(stop.id),
  })), [activeStops, removed]);

  const finishRequest = useCallback(() => {
    if (requestTimeoutRef.current !== null) window.clearTimeout(requestTimeoutRef.current);
    requestTimeoutRef.current = null;
    setRequestPending(false);
  }, []);

  useEffect(() => {
    const pendingRequestId = pendingRequestIdRef.current;
    const pendingBaseRevision = pendingBaseRevisionRef.current;
    if (!agentResponse || !shouldAcceptFollowupResponse(
      pendingRequestId,
      pendingBaseRevision ?? planResponse.interaction.revision,
      agentResponse,
    )) return;

    const nextView = reconcileFollowupViewState({
      selectedBranchId: activeBranch.id,
      removedPlaceIds: removed,
      selectedPlaceId: selectedId,
      mapMode,
      mapExpanded,
      evidenceOpen,
      panelOpen,
    }, agentResponse);

    setPlanResponse(agentResponse);
    setPlanOrigin("live");
    setPath(pathForBranchId(nextView.selectedBranchId));
    setRemoved(nextView.removedPlaceIds);
    setSelectedId(nextView.selectedPlaceId);
    setMapMode(nextView.mapMode);
    setMapExpanded(nextView.mapExpanded);
    setEvidenceOpen(nextView.evidenceOpen);
    setPanelOpen(nextView.panelOpen);
    setMapViewRevision((current) => current + 1);
    setComposerNotice(agentResponse.interaction.mode === "clarify"
      ? "One detail needs your choice; the current route stayed in place."
      : "Route ready.");
    pendingRequestIdRef.current = null;
    pendingBaseRevisionRef.current = null;
    pendingOptimisticRef.current = false;
    finishRequest();
  }, [
    activeBranch.id,
    agentResponse,
    evidenceOpen,
    finishRequest,
    mapExpanded,
    mapMode,
    panelOpen,
    planResponse.interaction.revision,
    removed,
    selectedId,
  ]);

  useEffect(() => () => {
    if (requestTimeoutRef.current !== null) window.clearTimeout(requestTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!error || !requestPending) return;
    const failureTimer = window.setTimeout(() => {
      pendingRequestIdRef.current = null;
      pendingBaseRevisionRef.current = null;
      const usedImmediateRoute = pendingOptimisticRef.current;
      pendingOptimisticRef.current = false;
      setPlanOrigin((current) => current === "preview" ? "preview" : "last-good");
      setComposerNotice(usedImmediateRoute
        ? "The visual route is ready from the approved demo snapshot; the live refresh could not connect."
        : "The live update could not connect. Your current visual route is unchanged; you can retry.");
      finishRequest();
    }, 0);
    return () => window.clearTimeout(failureTimer);
  }, [error, finishRequest, requestPending]);

  useEffect(() => {
    if (mapMode !== "place") return;
    responsePanelRef.current?.querySelector<HTMLElement>(`[data-stop-id="${selectedId}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [mapMode, mapViewRevision, selectedId]);

  function choosePath(next: PathId) {
    const branch = next === "luxury" ? secondaryBranch : next === "fused" ? shortBranch : primaryBranch;
    setPath(next);
    setRemoved([]);
    setSelectedId(branch.placeIds[0]);
    setEvidenceOpen(false);
  }

  function togglePlace(id: string) {
    const isRemoving = !removed.includes(id);
    setRemoved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

    if (isRemoving && selectedId === id) {
      const fallbackId = activeBranch.placeIds.find(
        (placeId) => placeId !== id && !removed.includes(placeId),
      );
      if (fallbackId) setSelectedId(fallbackId);
      setEvidenceOpen(false);
      if (mapMode === "place") setMapMode("route");
      setMapViewRevision((current) => current + 1);
    }
  }

  function openEvidence(id: string) {
    setSelectedId(id);
    setEvidenceMediaIndex(0);
    setEvidenceOpen(true);
  }

  function moveEvidenceMedia(delta: number) {
    setEvidenceMediaIndex((current) => (current + delta + selectedCarousel.length) % selectedCarousel.length);
  }

  const focusMap = useCallback((id?: string) => {
    if (id) {
      setSelectedId(id);
      setEvidenceMediaIndex(0);
    }
    setEvidenceOpen(Boolean(id));
    setMapExpanded(false);
    setMapMode(id ? "place" : "route");
    setMapViewRevision((current) => current + 1);
    setPanelOpen(true);
  }, []);

  const selectMapStop = useCallback((id: string) => {
    setSelectedId(id);
    setEvidenceMediaIndex(0);
    setEvidenceOpen(true);
    setMapMode("place");
    setMapViewRevision((current) => current + 1);
    setPanelOpen(true);
  }, []);

  const backToPlan = useCallback(() => {
    setMapMode("plan");
    setMapExpanded(false);
    setPanelOpen(true);
  }, []);

  const expandMap = useCallback(() => {
    setMapExpanded(true);
  }, []);

  function showWholeRoute() {
    setEvidenceOpen(false);
    setMapMode("route");
    setMapViewRevision((current) => current + 1);
    setPanelOpen(true);
  }

  function submitFollowup(text: string) {
    if (requestPending || status === "submitted" || status === "streaming") return;
    if (!text.trim()) {
      setComposerNotice("Type a shopping question or change first.");
      return;
    }
    const visibleQuestion = text.trim();
    setHasStarted(true);
    setPanelOpen(true);
    clearError();
    const requestId = `request-${crypto.randomUUID()}`;
    const metadata = buildFollowupClientData({
      requestId,
      response: liveResponse,
      selectedBranchId: activeBranch.id,
      removedPlaceIds: removed,
    });
    const baseRevision = liveResponse.interaction.revision;
    const demoWorkflow = resolveDemoWorkflow(visibleQuestion, liveResponse.world.regionId);
    if (demoWorkflow?.kind === "select_path") {
      choosePath(demoWorkflow.path);
      setPrompt("");
      setComposerNotice(demoWorkflow.notice);
      return;
    }
    const demoRoute = demoWorkflow?.kind === "load_route" ? demoWorkflow.route : null;
    if (demoRoute === "vintage") {
      const immediateResponse = buildVintageDemoFallback(visibleQuestion, { requestId, baseRevision });
      setPlanResponse(immediateResponse);
      setPlanOrigin("preview");
      setPath("vintage");
      setRemoved([]);
      setSelectedId(immediateResponse.branches[0].placeIds[0]);
      setEvidenceOpen(false);
      setPanelOpen(true);
      setMapMode("plan");
      setMapExpanded(false);
      setMapViewRevision((current) => current + 1);
    } else if (demoRoute === "fashion") {
      const immediateResponse = buildFashionDemoFallback(visibleQuestion, { requestId, baseRevision });
      setPlanResponse(immediateResponse);
      setPlanOrigin("preview");
      setPath("vintage");
      setRemoved([]);
      setSelectedId(immediateResponse.branches[0].placeIds[0]);
      setEvidenceOpen(false);
      setPanelOpen(true);
      setMapMode("plan");
      setMapExpanded(false);
      setMapViewRevision((current) => current + 1);
    }
    if (demoRoute) {
      pendingRequestIdRef.current = null;
      pendingBaseRevisionRef.current = null;
      pendingOptimisticRef.current = false;
      setRequestPending(false);
      setPrompt("");
      setComposerNotice("Route ready.");
      return;
    }
    setPlanOrigin((current) => current === "preview" ? "preview" : "last-good");
    pendingRequestIdRef.current = requestId;
    pendingBaseRevisionRef.current = baseRevision;
    pendingOptimisticRef.current = false;
    setRequestPending(true);
    if (requestTimeoutRef.current !== null) window.clearTimeout(requestTimeoutRef.current);
    requestTimeoutRef.current = window.setTimeout(() => {
      if (pendingRequestIdRef.current !== requestId) return;
      pendingRequestIdRef.current = null;
      pendingBaseRevisionRef.current = null;
      const usedImmediateRoute = pendingOptimisticRef.current;
      pendingOptimisticRef.current = false;
      setComposerNotice(usedImmediateRoute
        ? "The visual route is ready from the approved demo snapshot. The live refresh timed out, so you can keep exploring or retry."
        : "The live update timed out. Your current visual route is unchanged; you can retry.");
      void stop();
      finishRequest();
    }, 15000);
    setPrompt("");
    setComposerNotice(demoRoute
      ? `${demoRoute === "vintage" ? "Vintage" : "Current-fashion"} route loaded. Checking the live data in the background…`
      : `Applying “${visibleQuestion}” without rebuilding the interface…`);
    void sendMessage({ text: visibleQuestion }, { metadata }).catch(() => {
      if (pendingRequestIdRef.current !== requestId) return;
      pendingRequestIdRef.current = null;
      pendingBaseRevisionRef.current = null;
      const usedImmediateRoute = pendingOptimisticRef.current;
      pendingOptimisticRef.current = false;
      setPlanOrigin((current) => current === "preview" ? "preview" : "last-good");
      setComposerNotice(usedImmediateRoute
        ? "The visual route is ready from the approved demo snapshot; the live refresh did not go through."
        : "The live update did not go through. Your last valid visual route is unchanged.");
      finishRequest();
    });
  }

  function submitLivePrompt() {
    submitFollowup(prompt);
  }

  function runVisualAction(action: VisualActionDispatch) {
    if (action.kind === "select_branch") {
      choosePath(pathForBranchId(action.branchId));
      return;
    }
    if (action.kind === "agent_followup") {
      submitFollowup(action.prompt);
      return;
    }
    if (action.kind === "open_evidence") {
      openEvidence(action.placeId);
      return;
    }
    if (action.kind === "toggle_place") togglePlace(action.placeId);
  }

  return <main className={`game-world atlas-app ${hasStarted ? "is-active" : "is-landing"} ${panelOpen ? "panel-open" : "panel-closed"} ${mapMode === "plan" ? "plan-focus" : "map-focus"} ${mapExpanded ? "map-expanded" : "map-balanced"} map-mode-${mapMode}`}>
    <RouteMap stops={hasStarted ? mapStops : []} selectedId={selectedId} mode={mapMode} viewRevision={mapViewRevision} onSelect={selectMapStop} onExplore={expandMap} />
    <div className="map-shade" aria-hidden="true" />

    <header className="atlas-header">
      <div className="atlas-brand"><strong>OPEN FIELD</strong><span>VISUAL TRAVEL PLANNER</span></div>
      <div className="atlas-location"><i />{hasStarted ? "TOKYO · OMOTESANDO TO SHIBUYA" : "TOKYO"}</div>
      <details className="atlas-menu">
        <summary>EXPLORE</summary>
        <nav aria-label="Other Open Field views">
          <a href="/hotel-weather" target="_blank" rel="noreferrer">HOTEL + WEATHER</a>
          <a href="/seiko-transit" target="_blank" rel="noreferrer">WATCH + AIRPORT</a>
          <a href="/map-lab">MAP NOTES</a>
        </nav>
      </details>
    </header>

    {mapMode !== "plan" && <aside className="split-map-detail map-info-rail" aria-label="Selected shop details" aria-live="polite">
      <header>
        <span>{mapMode === "place" ? "SELECTED SHOP" : "ROUTE ON MAP"}</span>
        <button onClick={backToPlan}>HIDE MAP</button>
      </header>
      <div className="split-map-detail-body">
        <div>
          <small>{mapMode === "place" ? `STOP ${String(Math.max(0, activeStops.findIndex((stop) => stop.id === selected.id)) + 1).padStart(2, "0")} · ${selected.area}` : `${visibleStops.length} ACTIVE STOPS · ${activeBranch.label}`}</small>
          <h2>{mapMode === "place" ? selected.name : "Aoyama to Shibuya"}</h2>
          <p>{mapMode === "place" ? selected.reason : "The numbered pins and dotted line show the order. Each pill is a Google Maps walking estimate checked July 23; the dotted line itself is not walking geometry."}</p>
          {mapMode === "place" && <em>{selected.latitude.toFixed(7)}, {selected.longitude.toFixed(7)}</em>}
        </div>
      </div>
      <footer>
        {mapMode === "place" && <button onClick={() => togglePlace(selected.id)}>{removed.includes(selected.id) ? "RESTORE STOP" : "REMOVE STOP"}</button>}
        {mapMode === "place" && <button onClick={showWholeRoute}>SHOW WHOLE ROUTE</button>}
        {mapMode === "place" && <a href={selected.maps} target="_blank" rel="noreferrer">GOOGLE MAPS ↗</a>}
        {mapMode === "route" && <a href={visibleRouteMapsUrl} target="_blank" rel="noreferrer">CHECK WALKING ROUTE ↗</a>}
      </footer>
    </aside>}

    {mapMode !== "plan" && <button className="map-expand-toggle" onClick={() => setMapExpanded((current) => !current)} aria-pressed={mapExpanded}>
      {mapExpanded ? "BALANCED VIEW" : "EXPAND MAP"}
    </button>}

    <section ref={responsePanelRef} className={`game-panel ${panelOpen ? "open" : "closed"}`} aria-label="Interactive shopping route response">
      <button className="panel-toggle" onClick={() => {
        if (mapMode !== "plan") backToPlan();
        else setPanelOpen((current) => !current);
      }} aria-expanded={panelOpen}>
        <span>{mapMode !== "plan" ? "HIDE MAP" : panelOpen ? "CLOSE PLAN" : "OPEN PLAN"}</span><b>{panelOpen ? "×" : "↑"}</b>
      </button>
      {panelOpen && <div className="panel-body route-flow">
        <header className="request-summary">
          <p>“{liveResponse.question}”</p>
        </header>

        {liveResponse.interaction.mode === "clarify" && liveResponse.interaction.clarification && <section className="clarification-card" aria-label="Choose how to update the route">
          <small>ONE DETAIL BEFORE I CHANGE THE MAP</small>
          <h2>{liveResponse.interaction.clarification.question}</h2>
          <div>{liveResponse.interaction.clarification.options.map((option) => <button key={option} onClick={() => submitFollowup(option)}>{option}</button>)}</div>
        </section>}

        <section className="answer-actions" aria-label="Quick route changes">
          <div>{liveResponse.actions
            .filter((action) => action.type === "change_constraint")
            .map((action) => <button
              key={`${action.type}-${action.label}`}
              onClick={() => runVisualAction(dispatchVisualAction(action))}
              disabled={requestPending}
            >{action.label}</button>)}</div>
        </section>

        {isVintagePlan && <nav className="route-mode-switch" aria-label="Choose which shopping route appears on the map">
          <button className={path === "vintage" ? "selected" : ""} onClick={() => choosePath("vintage")} aria-pressed={path === "vintage"}>VINTAGE</button>
          <button className={path === "luxury" ? "selected" : ""} onClick={() => choosePath("luxury")} aria-pressed={path === "luxury"}>FASHION + VINTAGE</button>
          <button className={path === "fused" ? "selected" : ""} onClick={() => choosePath("fused")} aria-pressed={path === "fused"}>SHORT WALK</button>
        </nav>}

        <section className="route-stage">
          <div className={`route-heading ${isVintagePlan ? "vintage-route-heading" : ""}`}>
            <h1>{routeLead}</h1>
            {isVintagePlan && <p>{vintageOverview}</p>}
          </div>
          <div className="vertical-route">{activeStops.map((stop, index) => <div className="route-node" key={stop.id}>
            <StopCard stop={stop} removed={removed.includes(stop.id)} selected={selectedId === stop.id} onOpen={() => openEvidence(stop.id)} onMap={() => focusMap(stop.id)} onToggle={() => togglePlace(stop.id)} />
            {index < activeStops.length - 1 && <div className="route-edge" aria-hidden="true"><i /></div>}
          </div>)}</div>
        </section>

        <section className="route-map-action">
          <div><strong>See the route on the map</strong><p>Check the stop order, walking times and store locations.</p></div>
          <button onClick={() => focusMap()}>VIEW ROUTE MAP</button>
        </section>
      </div>}
    </section>

    <aside className={`evidence ${evidenceOpen ? "open" : ""}`} aria-label="Selected store evidence">
      <button className="evidence-close" onClick={() => setEvidenceOpen(false)} aria-label="Close store evidence">×</button>
      <div className="evidence-photo" style={{ backgroundImage: `url(${evidenceMedia.src})` }}>
        <a className="evidence-image-open" href={evidenceMedia.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${evidenceMedia.title}`}>{evidenceMedia.role === "store_cover" ? "VIEW STORE" : "VIEW ITEM"} ↗</a>
        {selectedCarousel.length > 1 && <div className="evidence-photo-controls">
          <button onClick={() => moveEvidenceMedia(-1)} aria-label={`Previous ${selected.name} evidence item`}>‹</button>
          <a href={evidenceMedia.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open source for ${evidenceMedia.title}`}>{evidenceMediaIndex + 1}/{selectedCarousel.length}</a>
          <button onClick={() => moveEvidenceMedia(1)} aria-label={`Next ${selected.name} evidence item`}>›</button>
        </div>}
        <small>{evidenceMedia.title}</small>
      </div>
      <div className="evidence-copy">
        <small>{selected.source}</small>
        <h2>{selected.name}</h2>
        <a className="evidence-website" href={selected.website} target="_blank" rel="noreferrer">OPEN STORE WEBSITE ↗</a>
        <p className="evidence-summary">{selected.reason}</p>
        {selected.details && <section className="store-facts">
          {selected.details.hours && <p><small>HOURS</small><span>{selected.details.hours.value}</span><a href={selected.details.hours.sourceUrl} target="_blank" rel="noreferrer">{selected.details.hours.sourceLabel} ↗</a></p>}
          {selected.details.brands && <p><small>WHAT TO LOOK FOR</small><span>{selected.details.brands.items.join(" · ")}</span><a href={selected.details.brands.sourceUrl} target="_blank" rel="noreferrer">{selected.details.brands.sourceLabel} ↗</a></p>}
          {selected.details.priceNote && <p><small>RECENT ONLINE PRICES</small><span>{selected.details.priceNote}</span></p>}
          {selected.details.shopperTip && <p><small>{selected.details.shopperTip.sourceType === "editorial" ? "EDITORIAL TIP" : "SHOPPER TIP"}</small><span>{selected.details.shopperTip.value}</span><a href={selected.details.shopperTip.sourceUrl} target="_blank" rel="noreferrer">{selected.details.shopperTip.sourceLabel} ↗</a></p>}
          {selected.reviewFlags?.map((flag) => <p className="store-warning" key={flag}><small>CHECK BEFORE GOING</small><span>{flag}</span></p>)}
        </section>}
        {selected.materialsNote && <section className="material-note">
          <small>MATERIALS / CONSTRUCTION</small>
          <p>{selected.materialsNote}</p>
        </section>}
        <details key={selected.id} className="evidence-more">
          <summary>MORE · {selected.media.length} SAMPLE ITEMS</summary>
          <ol>
            {selected.media.map((item, index) => {
              const price = formatMediaPrice(item.priceJpy);
              return <li key={`${selected.id}-${index}-${item.src}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.title} ↗</a>
                  <small className={price.status === "unlisted" ? "unlisted" : ""}>{price.jpy}<b>{price.usd}</b></small>
                  <a className="sample-image-link" href={item.src} target="_blank" rel="noreferrer">OPEN IMAGE ↗</a>
                </div>
              </li>;
            })}
          </ol>
          <p>USD is approximate at ¥{FASHION_FX_SNAPSHOT.jpyPerUsd.toFixed(3)}/$1. <a href={FASHION_FX_SNAPSHOT.sourceUrl} target="_blank" rel="noreferrer">BOJ rate, July 23 ↗</a></p>
        </details>
        <button onClick={() => togglePlace(selected.id)}>{removed.includes(selected.id) ? "RESTORE TO ROUTE" : "REMOVE FROM ROUTE"}</button>
        <button onClick={() => focusMap(selected.id)}>SHOW ON ROUTE MAP</button>
        <a href={selected.maps} target="_blank" rel="noreferrer">OPEN IN GOOGLE MAPS ↗</a>
      </div>
    </aside>

    <div className="agent-dock">
      <span className="route-update-status" aria-live="polite">{error ? "Couldn’t refresh. Your route is still here." : composerNotice}</span>
      <div className="composer"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitLivePrompt(); }} aria-label="Ask Open Field" placeholder="Ask for vintage, fewer stops, a shorter walk…" /><button onClick={submitLivePrompt} aria-label="Send message" disabled={requestPending || status === "submitted" || status === "streaming"}>{requestPending ? "…" : "SEND"}</button></div>
    </div>
  </main>;
}

async function startLiveSession(chatId: string, clientData: FollowupClientData): Promise<string> {
  const response = await fetch("/api/chat/session/", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chatId, clientData }) });
  const payload = await response.json() as { publicAccessToken?: string; error?: string };
  if (!response.ok || !payload.publicAccessToken) throw new Error(payload.error ?? "Unable to start live agent");
  return payload.publicAccessToken;
}
