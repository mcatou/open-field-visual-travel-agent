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
import { SeikoTransitMap } from "./seiko-transit-map";
import "./seiko-transit.css";

const JR_TOKYO_SOURCE = "https://www.jreast.co.jp/estation/stations/1039.html";
const METRO_GINZA_SOURCE = "https://www.tokyometro.jp/station/ginza/index.html";
type PanePreset = "balanced" | "map" | "answer" | "details" | "custom";
type PaneSide = "map-answer" | "answer-details";

const paneSizes: Record<Exclude<PanePreset, "custom">, [number, number, number]> = {
  balanced: [28, 48, 24],
  map: [42, 40, 18],
  answer: [22, 60, 18],
  details: [22, 44, 34],
};

const routeMeta: Record<RouteId, {
  label: string;
  eyebrow: string;
  detail: string;
  nodeIds: string[];
  legIds: string[];
}> = {
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
  const [lostMinutes, setLostMinutes] = useState(0);
  const [disruption, setDisruption] = useState<TransitDisruption>("none");
  const [selectedId, setSelectedId] = useState("matsuya-ginza");
  const [previewRoute, setPreviewRoute] = useState<RouteId | null>(null);
  const [panePreset, setPanePreset] = useState<PanePreset>("balanced");
  const [paneShares, setPaneShares] = useState<[number, number, number]>(paneSizes.balanced);
  const [storesOpen, setStoresOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [notice, setNotice] = useState("Choose a store to see its location and route to Tokyo Station.");
  const [mapRevision, setMapRevision] = useState(0);

  const plan = useMemo(
    () => buildSeikoTransitPlan({ selectedStoreId, stock, lostMinutes, disruption }),
    [selectedStoreId, stock, lostMinutes, disruption],
  );
  const activeRouteId = previewRoute ?? plan.recommendedRouteId;
  const activeRoute = routeMeta[activeRouteId];
  const activeLegs = ROUTE_LEGS.filter((leg) => activeRoute.legIds.includes(leg.id));
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
    setPreviewRoute(`shop-${id}`);
    setMapRevision((current) => current + 1);
    const store = GINZA_STORES.find((candidate) => candidate.id === id)!;
    setNotice(`${store.shortName} selected. Use the phone icon for stock, or inspect its route to Tokyo Station.`);
  }

  function chooseDirectoryStore(id: (typeof GINZA_STORES)[number]["id"]) {
    if (["wako", "namiki", "boutique-ginza", "nisshindo"].includes(id)) {
      chooseStore(id as StoreId);
      return;
    }
    setSelectedId(id);
    setStock("unknown");
    setPreviewRoute("metro-direct");
    setMapRevision((current) => current + 1);
    const store = GINZA_STORES.find((candidate) => candidate.id === id)!;
    setNotice(`${store.shortName} selected. Use the phone icon to check SBGH343 availability.`);
  }

  function chooseStock(next: StockState) {
    setStock(next);
    setPreviewRoute(null);
    setMapRevision((current) => current + 1);
    const store = GINZA_STORES.find((candidate) => candidate.id === selectedStoreId)!;
    setNotice(next === "confirmed"
      ? `${store.shortName} confirmed SBGH343. The map now shows the store detour and hard exit route.`
      : next === "unavailable"
        ? `${store.shortName} cannot help. The store detour was removed.`
        : "Stock is unconfirmed. The departure-first route stays active.");
  }

  function submitPrompt() {
    const text = prompt.trim().toLowerCase();
    if (!text) {
      setNotice("Try “Wako has it,” “Namiki sold out,” or “the Marunouchi Line is delayed.”");
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
    if (/15|quarter hour/.test(text)) setLostMinutes(15);
    else if (/5|five/.test(text)) setLostMinutes(5);
    setPreviewRoute(null);
    setMapRevision((current) => current + 1);
    setPrompt("");
    setNotice("Plan updated.");
  }

  return (
    <main className="seiko-world" style={layoutStyle}>
      <header className="seiko-header">
        <div className="seiko-brand"><strong>OPEN FIELD</strong><span>VISUAL TRAVEL PLANNER</span></div>
        <div className="seiko-title"><i />GINZA WATCH · AIRPORT PLAN</div>
        <nav>
          <a href="/" target="_blank" rel="noreferrer">SHOPPING ROUTE ↗</a>
        </nav>
      </header>

      <div className="seiko-layout" ref={layoutRef}>
        <section className="seiko-map-panel" aria-label="Route map panel">
          <SeikoTransitMap
            nodes={SEIKO_TRANSIT_NODES}
            candidateLegs={GINZA_STORE_WALK_LEGS}
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
            <small>Walking times checked 23 Jul.</small>
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
                <span>CONFIRMED MODEL</span>
                <h1>Grand Seiko {GRAND_SEIKO_MODEL.reference}</h1>
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

            <section className="availability-card">
              <div>
                <span>AVAILABILITY</span>
                <p>SBGH343 is sold through Grand Seiko boutiques, salons and master shops, but branch stock is not published online.</p>
              </div>
            </section>

            <section className="store-queue">
              <header>
                <div><span>01 · GINZA</span><h2>Stores that may carry SBGH343</h2></div>
                <button onClick={() => setStoresOpen((current) => !current)} aria-expanded={storesOpen}>{storesOpen ? "ROLL UP" : "SHOW STORES"}</button>
              </header>
              {storesOpen && <div className="store-grid">
                {GINZA_STORES.map((store) => <article key={store.id} className={selectedId === store.id ? "selected" : ""}>
                  <button onClick={() => chooseDirectoryStore(store.id)} aria-pressed={selectedId === store.id}>
                    <span>{store.walkMinutes === 0 ? "HERE" : `${store.walkMinutes} MIN FROM MATSUYA`} · {store.hours}</span>
                    <strong>{store.name}</strong>
                  </button>
                  {store.benefitSourceUrl && <small>{store.benefit}</small>}
                  <div>
                    <a className="phone-icon" href={`tel:${store.telephone}`} aria-label={`Phone ${store.name}`} title={`Phone ${store.name}`}>☎</a>
                    <a href={store.sourceUrl} target="_blank" rel="noreferrer">STORE ↗</a>
                    {store.benefitSourceUrl && <a href={store.benefitSourceUrl} target="_blank" rel="noreferrer">BENEFIT ↗</a>}
                  </div>
                </article>)}
              </div>}
            </section>

            {["wako", "namiki", "boutique-ginza", "nisshindo"].includes(selectedId) && <section className="stock-gate">
              <div><span>02 · STOCK</span><h2>{GINZA_STORES.find((store) => store.id === selectedStoreId)?.shortName}</h2></div>
              <div>
                {([
                  ["unknown", "☎", "Unknown"],
                  ["confirmed", "Held", "Add to route"],
                  ["unavailable", "Unavailable", "Remove"],
                ] as Array<[StockState, string, string]>).map(([id, label, note]) => (
                  <button key={id} onClick={() => chooseStock(id)} className={stock === id ? "selected" : ""} aria-pressed={stock === id}>
                    <strong>{label}</strong><span>{note}</span>
                  </button>
                ))}
              </div>
            </section>}

            <section className="route-plan">
              <header>
                <div><span>03 · ROUTE TO TOKYO STATION</span><h2>{activeRoute.label}</h2></div>
              </header>
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

            <section className="airport-continuation">
              <header>
                <div>
                  <span>04 · AIRPORT</span>
                  <h2>Tokyo Station → luggage → Narita → ANA to SFO</h2>
                </div>
                <small>ADD FLIGHT TIME TO FINISH TIMING</small>
              </header>
              <div className="airport-flow">
                <article>
                  <b>01</b>
                  <div><strong>Collect luggage</strong><p>Add the locker or counter from the storage receipt.</p></div>
                  <a href={AIRPORT_CONTINUATION.luggageSourceUrl} target="_blank" rel="noreferrer">STORAGE GUIDE ↗</a>
                </article>
                <i />
                <article>
                  <b>02</b>
                  <div><strong>Tokyo Station → Narita</strong><p>N’EX: allow at least {AIRPORT_CONTINUATION.naritaExpressFastestMinutes} minutes.</p></div>
                  <a href={AIRPORT_CONTINUATION.naritaExpressSourceUrl} target="_blank" rel="noreferrer">JR EAST N’EX ↗</a>
                </article>
                <i />
                <article>
                  <b>03</b>
                  <div><strong>{AIRPORT_CONTINUATION.targetAirport} · ANA to {AIRPORT_CONTINUATION.destination}</strong><p>Check in at least {AIRPORT_CONTINUATION.internationalCheckinDeadlineMinutes} minutes before departure.</p></div>
                  <a href={AIRPORT_CONTINUATION.anaAirportSourceUrl} target="_blank" rel="noreferrer">ANA NARITA GUIDE ↗</a>
                </article>
              </div>
              <div className="missing-inputs">
                <b>ADD</b><span>STORAGE LOCATION</span><span>FLIGHT TIME</span>
              </div>
              <p className="purchase-rule">Allow at least <strong>{WATCH_PURCHASE_MINUTES} min</strong> for bracelet sizing, payment and paperwork.</p>
            </section>
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
                  <span>OFFICIAL STORE PHOTO ↗</span>
                </a>
                <small>{selectedStore.walkMinutes} MIN FROM MATSUYA · {selectedStore.hours}</small>
                <h2>{selectedStore.name}</h2>
                <p>{selectedStore.stockNote}</p>
                <dl>
                  <div><dt>☎</dt><dd><a href={`tel:${selectedStore.telephone}`}>{selectedStore.telephone}</a></dd></div>
                  <div><dt>PRICE</dt><dd>¥1,056,000 list</dd></div>
                  {selectedStore.benefitSourceUrl && <div><dt>BENEFIT</dt><dd>{selectedStore.benefit}</dd></div>}
                </dl>
                {selectedNode && <code>{selectedNode.latitude.toFixed(7)}, {selectedNode.longitude.toFixed(7)}</code>}
                <a href={selectedStore.sourceUrl} target="_blank" rel="noreferrer">OFFICIAL STORE PAGE ↗</a>
                <a href={selectedStore.mapsUrl} target="_blank" rel="noreferrer">OPEN LIVE GOOGLE MAPS ↗</a>
                {selectedStore.benefitSourceUrl && <a href={selectedStore.benefitSourceUrl} target="_blank" rel="noreferrer">BENEFIT DETAILS ↗</a>}
              </section>
            </> : selectedRouteDetail ? <section className="selected-store">
              <small>{selectedRouteDetail.eyebrow}</small>
              <h2>{selectedRouteDetail.title}</h2>
              <p>{selectedRouteDetail.summary}</p>
              {selectedNode && <code>{selectedNode.latitude.toFixed(7)}, {selectedNode.longitude.toFixed(7)}</code>}
              <a href={selectedRouteDetail.sourceUrl} target="_blank" rel="noreferrer">{selectedRouteDetail.sourceLabel} ↗</a>
              {selectedNode && <a href={selectedNode.mapsUrl} target="_blank" rel="noreferrer">OPEN LIVE GOOGLE MAPS ↗</a>}
            </section> : null}

          </div>
        </aside>
      </div>

      <div className="seiko-composer">
        <div><b>UPDATE</b><span aria-live="polite">{notice}</span></div>
        <div><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") submitPrompt(); }} placeholder="Wako has it / Namiki sold out / Marunouchi is delayed…" aria-label="Change the watch transport plan" /><button onClick={submitPrompt}>SEND</button></div>
      </div>
    </main>
  );
}
