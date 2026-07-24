"use client";
/* eslint-disable @next/next/no-img-element -- official product imagery is intentionally shown without an optimizer */

import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  AIRPORT_CONTINUATION,
  GINZA_STORE_WALK_LEGS,
  GINZA_STORES,
  GRAND_SEIKO_MODEL,
  ROUTE_LEGS,
  SEIKO_TRANSIT_NODES,
  WATCH_PURCHASE_MINUTES,
  buildSeikoTransitPlan,
  type RouteId,
  type StockState,
  type StoreId,
  type TransitDisruption,
} from "../../src/runtime/seiko-transit-flow";
import { buildWatchExperience } from "../../src/runtime/open-field-experience";
import {
  FieldDisclosure,
  FieldSectionHeading,
  FieldSourceLink,
} from "../components/open-field-ui";
import { SeikoTransitMap } from "./seiko-transit-map";
import "../open-field-brand.css";
import "./seiko-transit.css";

const JR_TOKYO_SOURCE = "https://www.jreast.co.jp/estation/stations/1039.html";
const METRO_GINZA_SOURCE = "https://www.tokyometro.jp/station/ginza/index.html";
type PanePreset = "balanced" | "map" | "answer" | "details" | "custom";
type PaneSide = "map-answer" | "answer-details";
type DisplayRouteId = RouteId | "store-search";

const watchExperience = buildWatchExperience();

const paneSizes: Record<Exclude<PanePreset, "custom">, [number, number, number]> = {
  balanced: [28, 48, 24],
  map: [42, 40, 18],
  answer: [22, 60, 18],
  details: [22, 44, 34],
};

const routeMeta: Record<DisplayRouteId, {
  label: string;
  eyebrow: string;
  detail: string;
  nodeIds: string[];
  legIds: string[];
}> = {
  "store-search": {
    label: "Possible SBGH343 stores in Ginza",
    eyebrow: "STORE SEARCH",
    detail: "Compare visitor offers, then confirm the exact reference before walking.",
    nodeIds: GINZA_STORES.map((store) => store.id),
    legIds: GINZA_STORE_WALK_LEGS.map((leg) => leg.id),
  },
  "metro-direct": {
    label: "Ginza Station → Tokyo Station",
    eyebrow: "FASTEST SIMPLE EXIT",
    detail: "One stop on the Marunouchi Line (station codes M16 to M17). Verify the platform display.",
    nodeIds: ["matsuya-ginza", "ginza-station", "tokyo-station"],
    legIds: ["matsuya-ginza-station"],
  },
  "jr-direct": {
    label: "Yurakucho JR → Tokyo",
    eyebrow: "RAIL BACKUP",
    detail: "About seven minutes to Yurakucho, then one JR stop. Verify the platform display.",
    nodeIds: ["matsuya-ginza", "yurakucho-station", "tokyo-station"],
    legIds: ["matsuya-yurakucho"],
  },
  "walk-direct": {
    label: "Walk straight to Tokyo Station",
    eyebrow: "NO-TRANSFER BACKUP",
    detail: "Google Maps snapshot: about 11 minutes / 750 m. Open live directions before leaving.",
    nodeIds: ["matsuya-ginza", "tokyo-station"],
    legIds: ["matsuya-tokyo"],
  },
  "shop-wako": {
    label: "Wako → Ginza Station → Tokyo Station",
    eyebrow: "3-MINUTE STORE DETOUR",
    detail: "Only after Wako confirms SBGH343. Their 1% points post the next day.",
    nodeIds: ["matsuya-ginza", "wako", "ginza-station", "tokyo-station"],
    legIds: ["matsuya-wako", "wako-ginza-station"],
  },
  "shop-namiki": {
    label: "Namiki → Ginza Station → Tokyo Station",
    eyebrow: "7-MINUTE STORE DETOUR",
    detail: "Only after Namiki confirms SBGH343 and agrees to hold it.",
    nodeIds: ["matsuya-ginza", "namiki", "ginza-station", "tokyo-station"],
    legIds: ["matsuya-namiki", "namiki-ginza-station"],
  },
  "shop-boutique-ginza": {
    label: "GS Ginza → Ginza Station → Tokyo Station",
    eyebrow: "7-MINUTE STORE DETOUR",
    detail: "Only after Grand Seiko Boutique Ginza confirms SBGH343.",
    nodeIds: ["matsuya-ginza", "boutique-ginza", "ginza-station", "tokyo-station"],
    legIds: ["matsuya-boutique-ginza", "boutique-ginza-station"],
  },
  "shop-nisshindo": {
    label: "Nisshindo → Ginza Station → Tokyo Station",
    eyebrow: "8-MINUTE STORE DETOUR",
    detail: "Only after Nisshindo confirms SBGH343 and agrees to hold it.",
    nodeIds: ["matsuya-ginza", "nisshindo", "ginza-station", "tokyo-station"],
    legIds: ["matsuya-nisshindo", "nisshindo-ginza-station"],
  },
};

const routeOnlyDetails = {
  "ginza-station": {
    eyebrow: "TOKYO METRO · STATION CODE M16",
    title: "Ginza Station",
    summary: "One Marunouchi Line stop to Tokyo Station. M16 and M17 are station codes, not train numbers.",
    sourceLabel: "TOKYO METRO STATION PAGE",
    sourceUrl: METRO_GINZA_SOURCE,
  },
  "yurakucho-station": {
    eyebrow: "JR BACKUP",
    title: "Yurakucho Station",
    summary: "A longer walk but a useful backup when the Marunouchi Line is the weak link.",
    sourceLabel: "JR EAST TOKYO STATION GUIDE",
    sourceUrl: JR_TOKYO_SOURCE,
  },
  "tokyo-station": {
    eyebrow: "LUGGAGE + AIRPORT TRANSFER",
    title: "Tokyo Station",
    summary: "Retrieve stored luggage, then rebook transport to Narita. The exact storage location and ANA flight time are still needed.",
    sourceLabel: "JR EAST TOKYO STATION GUIDE",
    sourceUrl: JR_TOKYO_SOURCE,
  },
} as const;

function minutesLabel(minutes: number) {
  return `${minutes} min`;
}

export default function SeikoTransitPage() {
  const layoutRef = useRef<HTMLDivElement>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<StoreId>("wako");
  const [stock, setStock] = useState<StockState>("unknown");
  const [lostMinutes] = useState(0);
  const [disruption, setDisruption] = useState<TransitDisruption>("none");
  const [selectedId, setSelectedId] = useState("mitsukoshi");
  const [previewRoute, setPreviewRoute] = useState<RouteId | null>(null);
  const [panePreset, setPanePreset] = useState<PanePreset>("balanced");
  const [paneShares, setPaneShares] = useState<[number, number, number]>(paneSizes.balanced);
  const [storesOpen, setStoresOpen] = useState(true);
  const [transportOpen, setTransportOpen] = useState(false);
  const [airportOpen, setAirportOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("Visitor savings are first. Choose a store to see stock and details.");
  const [mapRevision, setMapRevision] = useState(0);

  const plan = useMemo(
    () => buildSeikoTransitPlan({ selectedStoreId, stock, lostMinutes, disruption }),
    [selectedStoreId, stock, lostMinutes, disruption],
  );
  const activeRouteId: DisplayRouteId = transportOpen
    ? (previewRoute ?? plan.recommendedRouteId)
    : "store-search";
  const activeRoute = routeMeta[activeRouteId];
  const activeLegs = activeRouteId === "store-search"
    ? GINZA_STORE_WALK_LEGS
    : ROUTE_LEGS.filter((leg) => activeRoute.legIds.includes(leg.id));
  const selectedStore = GINZA_STORES.find((store) => store.id === selectedId);
  const selectedNode = SEIKO_TRANSIT_NODES.find((node) => node.id === selectedId);
  const selectedRouteDetail = routeOnlyDetails[selectedId as keyof typeof routeOnlyDetails];
  const displaySteps = useMemo(() => {
    if (!previewRoute?.startsWith("shop-")) return plan.steps.filter((step) => step.kind !== "call");
    const store = GINZA_STORES.find((candidate) => `shop-${candidate.id}` === previewRoute);
    if (!store) return plan.steps.filter((step) => step.kind !== "call");
    const returnMinutes = store.id === "wako" ? 1 : store.id === "nisshindo" ? 5 : 4;
    return [
      { id: "preview-store", nodeId: store.id, label: store.shortName, detail: "Check SBGH343 availability before going.", minutes: store.walkMinutes, kind: "walk" as const },
      { id: "preview-station", nodeId: "ginza-station", label: "Ginza Station", detail: `About ${returnMinutes} minutes from ${store.shortName}.`, minutes: returnMinutes, kind: "walk" as const },
      { id: "preview-tokyo", nodeId: "tokyo-station", label: "Tokyo Station", detail: "One stop on the Marunouchi Line. Check the platform display.", minutes: 4, kind: "train" as const },
    ];
  }, [plan.steps, previewRoute]);
  const [mapFr, answerFr, evidenceFr] = paneShares;
  const layoutStyle = {
    "--map-fr": `${mapFr}fr`,
    "--answer-fr": `${answerFr}fr`,
    "--evidence-fr": `${evidenceFr}fr`,
    "--composer-left": `calc(${mapFr}vw + 16px)`,
  } as CSSProperties;

  function applyPreset(preset: Exclude<PanePreset, "custom">) {
    setPanePreset(preset);
    setPaneShares(paneSizes[preset]);
  }

  function resizePane(side: PaneSide, deltaPercentage: number) {
    setPanePreset("custom");
    setPaneShares(([map, answer, details]) => {
      if (side === "map-answer") {
        const nextMap = Math.min(48, Math.max(18, map + deltaPercentage));
        const applied = nextMap - map;
        if (answer - applied < 32) return [map, answer, details];
        return [nextMap, answer - applied, details];
      }
      const nextDetails = Math.min(38, Math.max(16, details - deltaPercentage));
      const applied = nextDetails - details;
      if (answer - applied < 32) return [map, answer, details];
      return [map, answer - applied, nextDetails];
    });
  }

  function beginResize(side: PaneSide, event: ReactPointerEvent<HTMLDivElement>) {
    const layout = layoutRef.current;
    if (!layout) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const startX = event.clientX;
    const width = layout.getBoundingClientRect().width;
    const initial = paneShares;
    const move = (moveEvent: PointerEvent) => {
      const delta = ((moveEvent.clientX - startX) / width) * 100;
      setPanePreset("custom");
      if (side === "map-answer") {
        const nextMap = Math.min(48, Math.max(18, initial[0] + delta));
        const applied = nextMap - initial[0];
        if (initial[1] - applied >= 32) setPaneShares([nextMap, initial[1] - applied, initial[2]]);
      } else {
        const nextDetails = Math.min(38, Math.max(16, initial[2] - delta));
        const applied = nextDetails - initial[2];
        if (initial[1] - applied >= 32) setPaneShares([initial[0], initial[1] - applied, nextDetails]);
      }
    };
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop, { once: true });
  }

  function resizeWithKeyboard(side: PaneSide, event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    resizePane(side, event.key === "ArrowRight" ? 2 : -2);
  }

  function chooseStore(id: StoreId) {
    setSelectedStoreId(id);
    setSelectedId(id);
    setStock("unknown");
    setPreviewRoute(null);
    setMapRevision((current) => current + 1);
    const store = GINZA_STORES.find((candidate) => candidate.id === id)!;
    setNotice(`${store.shortName} selected. Confirm SBGH343 availability before walking.`);
  }

  function chooseDirectoryStore(id: (typeof GINZA_STORES)[number]["id"]) {
    if (["wako", "namiki", "boutique-ginza", "nisshindo"].includes(id)) {
      chooseStore(id as StoreId);
      return;
    }
    setSelectedId(id);
    setStock("unknown");
    setPreviewRoute(null);
    setMapRevision((current) => current + 1);
    const store = GINZA_STORES.find((candidate) => candidate.id === id)!;
    setNotice(`${store.shortName} selected. Confirm SBGH343 availability before walking.`);
  }

  function chooseStock(next: StockState) {
    setStock(next);
    setPreviewRoute(null);
    setMapRevision((current) => current + 1);
    const store = GINZA_STORES.find((candidate) => candidate.id === selectedStoreId)!;
    setNotice(next === "confirmed"
      ? `${store.shortName} confirmed SBGH343. You can add the route to Tokyo Station when needed.`
      : next === "unavailable"
        ? `${store.shortName} cannot help. The store detour was removed.`
        : "Stock is still unconfirmed.");
  }

  function submitPrompt() {
    const text = prompt.trim().toLowerCase();
    if (!text) {
      setNotice("Ask about visitor savings, a store, stock, or the route to Tokyo Station.");
      return;
    }
    const storeMatch: Array<[RegExp, StoreId]> = [
      [/wako/, "wako"],
      [/namiki/, "namiki"],
      [/nisshindo/, "nisshindo"],
      [/boutique|7-9-16/, "boutique-ginza"],
    ];
    const matchedStore = storeMatch.find(([pattern]) => pattern.test(text))?.[1];
    if (matchedStore) {
      setSelectedStoreId(matchedStore);
      setSelectedId(matchedStore);
    }
    if (/has it|in stock|confirmed|holding/.test(text)) setStock("confirmed");
    else if (/no stock|sold out|unavailable|doesn.t have/.test(text)) setStock("unavailable");
    if (/marunouchi|metro/.test(text) && /delay|issue|closed|down/.test(text)) setDisruption("marunouchi");
    if (/\bjr\b/.test(text) && /delay|issue|closed|down/.test(text)) setDisruption("jr");
    if (/route|station|train|metro|marunouchi|\bjr\b|walk/.test(text)) setTransportOpen(true);
    if (/airport|narita|luggage|ana|flight/.test(text)) {
      setTransportOpen(true);
      setAirportOpen(true);
    }
    setPreviewRoute(null);
    setMapRevision((current) => current + 1);
    setPrompt("");
    setNotice(
      matchedStore
        ? "Showing that store."
        : /discount|coupon|visitor|foreign|tax|saving|price/.test(text)
          ? "Visitor savings are first."
          : /route|station|train|metro|marunouchi|\bjr\b|walk|airport|narita|luggage|ana|flight/.test(text)
            ? "Travel options are open."
            : "I can compare visitor savings, possible SBGH343 stores, and an optional route to Tokyo Station.",
    );
  }

  return (
    <main className="seiko-world" style={layoutStyle}>
      <header className="seiko-header">
        <div className="seiko-brand"><strong>OPEN FIELD</strong><span>VISUAL TRAVEL PLANNER</span></div>
        <div className="seiko-title"><i />GINZA · SBGH343</div>
        <nav>
          <a href="/" target="_blank" rel="noreferrer">SHOPPING ROUTE ↗</a>
        </nav>
      </header>

      <div className="seiko-layout" ref={layoutRef}>
        <section className="seiko-map-panel" aria-label="Route map panel">
          <SeikoTransitMap
            nodes={SEIKO_TRANSIT_NODES}
            candidateLegs={activeRouteId === "store-search" ? [] : GINZA_STORE_WALK_LEGS}
            routeNodeIds={activeRoute.nodeIds}
            routeLegs={activeLegs}
            routeId={activeRouteId}
            selectedId={selectedId}
            expanded={paneShares[0] >= 36}
            revision={mapRevision}
            onSelect={setSelectedId}
            onExplore={() => applyPreset("map")}
          />
          <div className="pane-controls map-controls">
            <span>ROUTE MAP</span>
            <button onClick={() => applyPreset(panePreset === "map" ? "balanced" : "map")}>
              {panePreset === "map" ? "BALANCED VIEW" : "EXPAND MAP"}
            </button>
          </div>
          <div className="map-panel-bottom">
            <span>{activeRoute.eyebrow}</span>
            <strong>{activeRoute.label}</strong>
            <p>{activeRoute.detail}</p>
            <small>Walking estimates are snapshots; open live directions before leaving.</small>
          </div>
        </section>

        <div
          className="pane-resizer"
          role="separator"
          aria-label="Resize map and answer panes"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={(event) => beginResize("map-answer", event)}
          onKeyDown={(event) => resizeWithKeyboard("map-answer", event)}
        />

        <section className="seiko-answer" aria-label="Interactive watch and transportation response">
          <div className="pane-controls answer-controls">
            <span>PLAN</span>
            <button onClick={() => applyPreset(panePreset === "answer" ? "balanced" : "answer")}>
              {panePreset === "answer" ? "BALANCED VIEW" : "FOCUS ANSWER"}
            </button>
          </div>
          <div className="answer-scroll">
            <header className="watch-identity">
              <div className="watch-copy">
                <span className="of-eyebrow">EXACT REFERENCE</span>
                <h1 className="of-display">Grand Seiko {GRAND_SEIKO_MODEL.reference}</h1>
                <h2>{GRAND_SEIKO_MODEL.name}</h2>
                <p>Light-green dial inspired by young cherry leaves, with a Bright Titanium case and bracelet.</p>
                <div className="fact-row">
                  <b>¥1,056,000</b>
                  <b>38 MM</b>
                  <b>BRIGHT TITANIUM BRACELET</b>
                  <b>HI-BEAT 9S85</b>
                </div>
                <a href={GRAND_SEIKO_MODEL.productUrl} target="_blank" rel="noreferrer">OFFICIAL PRODUCT PAGE ↗</a>
              </div>
              <a className="watch-image" href={GRAND_SEIKO_MODEL.productUrl} target="_blank" rel="noreferrer">
                <img src="/seiko-transit/sbgh343.png" alt="Official Grand Seiko SBGH343 product image" />
                <span>EXACT MODEL ↗</span>
              </a>
            </header>

            <section className="watch-priority-card">
              <FieldSectionHeading
                eyebrow="VISITOR SAVINGS"
                title="Check the department-store offer first"
                body="The clearest published visitor benefit is at Ginza Mitsukoshi. Confirm the watch is eligible before treating it as a saving."
              />
              <div className="benefit-grid">
                <article className="benefit-card primary of-card">
                  <span className="of-eyebrow">{watchExperience.primaryBenefit.eyebrow}</span>
                  <strong>{watchExperience.primaryBenefit.headline}</strong>
                  <p>{watchExperience.primaryBenefit.body}</p>
                  <FieldSourceLink href={watchExperience.primaryBenefit.sourceUrl} primary>CHECK TERMS ↗</FieldSourceLink>
                </article>
                <article className="benefit-card of-card">
                  <span className="of-eyebrow">{watchExperience.secondaryBenefit.eyebrow}</span>
                  <strong>{watchExperience.secondaryBenefit.headline}</strong>
                  <p>{watchExperience.secondaryBenefit.body}</p>
                  <FieldSourceLink href={watchExperience.secondaryBenefit.sourceUrl}>WAKO TERMS ↗</FieldSourceLink>
                </article>
              </div>
            </section>

            <section className="store-queue">
              <div className="store-queue-heading">
                <FieldSectionHeading
                  eyebrow="POSSIBLE STOCK · GINZA"
                  title={watchExperience.availability.headline}
                  body={watchExperience.availability.body}
                />
                <button onClick={() => setStoresOpen((current) => !current)} aria-expanded={storesOpen}>{storesOpen ? "HIDE" : "SHOW STORES"}</button>
              </div>
              <p className="purchase-note">If you buy it, allow at least <strong>{WATCH_PURCHASE_MINUTES} minutes</strong> for bracelet sizing, payment and paperwork.</p>
              {storesOpen && <div className="store-grid">
                {watchExperience.storeCards.map((store) => <article key={store.id} className={selectedId === store.id ? "selected" : ""}>
                  <button onClick={() => chooseDirectoryStore(store.id)} aria-pressed={selectedId === store.id}>
                    <img src={store.imagePath} alt="" loading="lazy" decoding="async" />
                    <span>
                      <small>{store.walkMinutes === 0 ? "AT MATSUYA" : `${store.walkMinutes} MIN WALK`} · {store.hours}</small>
                      <strong>{store.name}</strong>
                    </span>
                  </button>
                  {store.benefitSourceUrl && <p>{store.benefit}</p>}
                  <div>
                    <a className="phone-icon" href={`tel:${store.telephone}`} aria-label={`Phone ${store.name}`} title={`Phone ${store.name}`}>☎</a>
                    <a href={store.storeUrl} target="_blank" rel="noreferrer">STORE ↗</a>
                    {store.benefitSourceUrl && <a href={store.benefitSourceUrl} target="_blank" rel="noreferrer">BENEFIT ↗</a>}
                  </div>
                </article>)}
              </div>}
            </section>

            {["wako", "namiki", "boutique-ginza", "nisshindo"].includes(selectedId) && <section className="stock-gate">
              <div><span className="of-eyebrow">STOCK CHECK</span><h2>{GINZA_STORES.find((store) => store.id === selectedStoreId)?.shortName}</h2><p>Allow at least {WATCH_PURCHASE_MINUTES} minutes for bracelet sizing, payment and paperwork if you buy it.</p></div>
              <div>
                {([
                  ["unknown", "☎", "Not checked"],
                  ["confirmed", "Available", "Store confirmed"],
                  ["unavailable", "Unavailable", "Skip this store"],
                ] as Array<[StockState, string, string]>).map(([id, label, note]) => (
                  <button key={id} onClick={() => chooseStock(id)} className={stock === id ? "selected" : ""} aria-pressed={stock === id}>
                    <strong>{label}</strong><span>{note}</span>
                  </button>
                ))}
              </div>
            </section>}

            <FieldDisclosure
              title={watchExperience.transport.label}
              description={watchExperience.transport.description}
              open={transportOpen}
              onToggle={setTransportOpen}
            >
              <section className="route-plan">
                <FieldSectionHeading eyebrow="OPTIONAL ROUTE" title={activeRoute.label} />
                <div className="plan-flow">
                  {displaySteps.map((step, index, visibleSteps) => (
                    <div key={step.id} className={`plan-step ${selectedId === step.nodeId ? "selected" : ""}`}>
                      <button onClick={() => setSelectedId(step.nodeId)}>
                        <b>{String(index + 1).padStart(2, "0")}</b>
                        <span><strong>{step.label}</strong><small>{step.detail}</small></span>
                        <em>{minutesLabel(step.minutes)}</em>
                      </button>
                      {index < visibleSteps.length - 1 && <i />}
                    </div>
                  ))}
                </div>
              </section>
            </FieldDisclosure>

            <FieldDisclosure
              title={watchExperience.airport.label}
              description={watchExperience.airport.description}
              open={airportOpen}
              onToggle={setAirportOpen}
            >
              <section className="airport-continuation">
                <div className="airport-flow">
                  <article>
                    <b>01</b>
                    <div><strong>Collect luggage</strong><p>Use the storage receipt for the exact locker or counter.</p></div>
                    <a href={AIRPORT_CONTINUATION.luggageSourceUrl} target="_blank" rel="noreferrer">GUIDE ↗</a>
                  </article>
                  <i />
                  <article>
                    <b>02</b>
                    <div><strong>Tokyo Station → Narita</strong><p>N’EX takes at least {AIRPORT_CONTINUATION.naritaExpressFastestMinutes} minutes.</p></div>
                    <a href={AIRPORT_CONTINUATION.naritaExpressSourceUrl} target="_blank" rel="noreferrer">JR EAST ↗</a>
                  </article>
                  <i />
                  <article>
                    <b>03</b>
                    <div><strong>ANA to {AIRPORT_CONTINUATION.destination}</strong><p>Reconfirm terminal and check-in cutoff with the flight time.</p></div>
                    <a href={AIRPORT_CONTINUATION.anaAirportSourceUrl} target="_blank" rel="noreferrer">ANA ↗</a>
                  </article>
                </div>
              </section>
            </FieldDisclosure>
          </div>
        </section>

        <div
          className="pane-resizer"
          role="separator"
          aria-label="Resize answer and details panes"
          aria-orientation="vertical"
          tabIndex={0}
          onPointerDown={(event) => beginResize("answer-details", event)}
          onKeyDown={(event) => resizeWithKeyboard("answer-details", event)}
        />

        <aside className="seiko-evidence" aria-label="Selected store and route details">
          <div className="pane-controls evidence-controls">
            <span>SELECTED DETAILS</span>
            <button onClick={() => applyPreset(panePreset === "details" ? "balanced" : "details")}>
              {panePreset === "details" ? "BALANCED VIEW" : "EXPAND DETAILS"}
            </button>
          </div>
          <div className="evidence-scroll">
            {selectedStore ? <>
              <section className="selected-store">
                <a className="selected-store-photo" href={selectedStore.sourceUrl} target="_blank" rel="noreferrer">
                  <img src={selectedStore.imagePath} alt={selectedStore.imageAlt} loading="lazy" decoding="async" />
                  <span>VIEW STORE ↗</span>
                </a>
                <span className="of-eyebrow">{selectedStore.walkMinutes === 0 ? "AT MATSUYA" : `${selectedStore.walkMinutes} MIN WALK`} · {selectedStore.hours}</span>
                <h2 className="of-title">{selectedStore.name}</h2>
                {selectedStore.benefitSourceUrl ? <div className="selected-benefit">
                  <span className="of-eyebrow">VISITOR BENEFIT</span>
                  <p>{selectedStore.benefit}</p>
                  <a href={selectedStore.benefitSourceUrl} target="_blank" rel="noreferrer">CHECK TERMS ↗</a>
                </div> : null}
                <p>{selectedStore.stockNote}</p>
                <dl>
                  <div><dt>☎</dt><dd><a href={`tel:${selectedStore.telephone}`}>{selectedStore.telephone}</a></dd></div>
                  <div><dt>PRICE</dt><dd>¥1,056,000 list</dd></div>
                </dl>
                <a href={selectedStore.sourceUrl} target="_blank" rel="noreferrer">OFFICIAL STORE PAGE ↗</a>
                <a href={selectedStore.mapsUrl} target="_blank" rel="noreferrer">OPEN LIVE GOOGLE MAPS ↗</a>
                <button className="selected-route-action" onClick={() => {
                  setTransportOpen(true);
                  setPreviewRoute(
                    ["wako", "namiki", "boutique-ginza", "nisshindo"].includes(selectedStore.id)
                      ? `shop-${selectedStore.id as StoreId}`
                      : "metro-direct",
                  );
                  setMapRevision((current) => current + 1);
                }}>ADD ROUTE TO TOKYO STATION</button>
              </section>
            </> : selectedRouteDetail ? <section className="selected-store">
              <small>{selectedRouteDetail.eyebrow}</small>
              <h2>{selectedRouteDetail.title}</h2>
              <p>{selectedRouteDetail.summary}</p>
              <a href={selectedRouteDetail.sourceUrl} target="_blank" rel="noreferrer">{selectedRouteDetail.sourceLabel} ↗</a>
              {selectedNode && <a href={selectedNode.mapsUrl} target="_blank" rel="noreferrer">OPEN LIVE GOOGLE MAPS ↗</a>}
            </section> : null}

          </div>
        </aside>
      </div>

      <div className="seiko-composer">
        <div><b>ASK</b><span aria-live="polite">{notice}</span></div>
        <div><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitPrompt(); }} placeholder="Ask about visitor savings, stock, a store, or Tokyo Station…" aria-label="Ask about the watch, stores, or onward travel" /><button onClick={submitPrompt}>SEND</button></div>
      </div>
    </main>
  );
}
