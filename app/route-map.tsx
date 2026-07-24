"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getFashionWalkingLeg } from "../src/data/fashion-walking-legs";

export type RouteMapStop = {
  id: string;
  name: string;
  area: string;
  latitude: number;
  longitude: number;
  image: string;
  removed: boolean;
};

const cityContextStyle = {
  version: 8 as const,
  sources: {
    basemap: {
      type: "raster" as const,
      tiles: ["https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
  },
  layers: [{ id: "basemap", type: "raster" as const, source: "basemap" }],
};

const routeDistricts = [
  { name: "MINAMI-AOYAMA", latitude: 35.6602, longitude: 139.7132, offset: [-54, 34] as [number, number] },
  { name: "KITA-AOYAMA", latitude: 35.6682, longitude: 139.7119, offset: [44, -40] as [number, number] },
  { name: "OMOTESANDO", latitude: 35.666, longitude: 139.7048, offset: [-46, -30] as [number, number] },
  { name: "SHIBUYA", latitude: 35.6597, longitude: 139.6992, offset: [14, 34] as [number, number] },
];

const cityDistricts = [
  { name: "SHINJUKU", latitude: 35.6896, longitude: 139.7006, offset: [0, 0] as [number, number] },
  { name: "HARAJUKU", latitude: 35.6702, longitude: 139.7027, offset: [0, 0] as [number, number] },
  { name: "AOYAMA", latitude: 35.672, longitude: 139.7178, offset: [0, 0] as [number, number] },
  { name: "ROPPONGI", latitude: 35.6628, longitude: 139.7314, offset: [0, 0] as [number, number] },
  { name: "SHIBUYA", latitude: 35.6597, longitude: 139.7005, offset: [0, 0] as [number, number] },
];

function routeTracePoints(map: MapLibreMap, stops: RouteMapStop[]) {
  return stops.filter((stop) => !stop.removed).map((stop) => {
    const point = map.project([stop.longitude, stop.latitude]);
    return `${point.x},${point.y}`;
  }).join(" ");
}

function drawWalkingLabels(map: MapLibreMap, stops: RouteMapStop[], group: SVGGElement | null) {
  if (!group) return;
  group.replaceChildren();
  const activeStops = stops.filter((stop) => !stop.removed);
  activeStops.slice(0, -1).forEach((from, index) => {
    const to = activeStops[index + 1];
    const leg = getFashionWalkingLeg(from.id, to.id);
    if (!leg) return;
    const start = map.project([from.longitude, from.latitude]);
    const end = map.project([to.longitude, to.latitude]);
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.max(Math.hypot(dx, dy), 1);
    const compactPair = `${from.id}:${to.id}`;
    const offset = compactPair === "fashion-aton-aoyama:fashion-mame-aoyama"
      ? 60
      : compactPair === "fashion-mame-aoyama:fashion-cfcl-omotesando"
        ? 48
        : 20;
    const direction = compactPair === "fashion-aton-aoyama:fashion-mame-aoyama" ? -1 : index % 2 === 0 ? 1 : -1;
    const x = (start.x + end.x) / 2 + (-dy / length) * offset * direction;
    const y = (start.y + end.y) / 2 + (dx / length) * offset * direction;
    const label = document.createElementNS("http://www.w3.org/2000/svg", "g");
    label.classList.add("route-walk-label");
    label.dataset.legId = leg.id;
    label.setAttribute("transform", `translate(${x},${y})`);
    const pill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pill.setAttribute("x", "-26");
    pill.setAttribute("y", "-11");
    pill.setAttribute("width", "52");
    pill.setAttribute("height", "22");
    pill.setAttribute("rx", "11");
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "central");
    text.textContent = `${leg.minutes} min`;
    label.appendChild(pill);
    label.appendChild(text);
    group.appendChild(label);
  });
}

function fitStops(map: MapLibreMap, stops: RouteMapStop[], duration = 0, rail = false) {
  if (!stops.length) return;
  const bounds = new maplibregl.LngLatBounds();
  stops.forEach((stop) => bounds.extend([stop.longitude, stop.latitude]));
  const compact = map.getContainer().clientWidth < 700;
  const padding = rail
    ? { top: 72, right: 62, bottom: 72, left: 62 }
    : compact
      ? { top: 85, right: 55, bottom: 300, left: 55 }
      : { top: 110, right: 110, bottom: 120, left: 70 };
  map.fitBounds(bounds, { padding, maxZoom: rail ? 13.7 : 14.15, duration });
}

function applyMapView(map: MapLibreMap, mode: "plan" | "route" | "place", stops: RouteMapStop[], selectedId: string, duration: number) {
  map.resize();
  if (mode === "place") {
    const selected = stops.find((stop) => stop.id === selectedId);
    if (selected) map.easeTo({ center: [selected.longitude, selected.latitude], zoom: 14.9, duration, offset: [0, 0] });
    return;
  }
  if (mode === "route") {
    const activeStops = stops.filter((stop) => !stop.removed);
    fitStops(map, activeStops.length ? activeStops : stops, duration, true);
    return;
  }
  fitStops(map, stops, duration);
}

function markerElement(stop: RouteMapStop, index: number, selected: boolean, onSelect: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `route-map-pin${selected ? " selected" : ""}${stop.removed ? " removed" : ""}`;
  button.dataset.placeId = stop.id;
  button.setAttribute("aria-label", `Select ${stop.name} on map`);
  button.setAttribute("aria-pressed", String(selected));

  const number = document.createElement("span");
  number.className = "route-map-pin-number";
  number.textContent = String(index + 1).padStart(2, "0");
  button.appendChild(number);

  if (selected) {
    const card = document.createElement("span");
    card.className = "route-map-pin-card";
    const image = document.createElement("img");
    image.src = stop.image;
    image.alt = "";
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = stop.name;
    const area = document.createElement("small");
    area.textContent = stop.area;
    copy.appendChild(name);
    copy.appendChild(area);
    card.appendChild(image);
    card.appendChild(copy);
    button.appendChild(card);
  }

  button.addEventListener("click", onSelect);
  return button;
}

export function RouteMap({ stops, selectedId, mode, viewRevision, onSelect, onExplore }: { stops: RouteMapStop[]; selectedId: string; mode: "plan" | "route" | "place"; viewRevision: number; onSelect: (id: string) => void; onExplore: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const loadedRef = useRef(false);
  const stopsRef = useRef(stops);
  const modeRef = useRef(mode);
  const selectedIdRef = useRef(selectedId);
  const traceHaloRef = useRef<SVGPolylineElement>(null);
  const traceLineRef = useRef<SVGPolylineElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const walkingLabelsRef = useRef<SVGGElement>(null);
  const drawTraceRef = useRef<() => void>(() => {});
  const onExploreRef = useRef(onExplore);

  useEffect(() => {
    onExploreRef.current = onExplore;
  }, [onExplore]);

  useEffect(() => {
    modeRef.current = mode;
    selectedIdRef.current = selectedId;
  }, [mode, selectedId]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      style: cityContextStyle,
      center: [139.713, 35.6755],
      zoom: 13,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
    const drawTrace = () => {
      const width = map.getContainer().clientWidth;
      const height = map.getContainer().clientHeight;
      svgRef.current?.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const points = routeTracePoints(map, stopsRef.current);
      traceHaloRef.current?.setAttribute("points", points);
      traceLineRef.current?.setAttribute("points", points);
      drawWalkingLabels(map, stopsRef.current, walkingLabelsRef.current);
    };
    const beginExplore = (event: unknown) => {
      if ((event as { originalEvent?: unknown }).originalEvent) onExploreRef.current();
    };
    drawTraceRef.current = drawTrace;
    map.on("move", drawTrace);
    map.on("resize", drawTrace);
    map.on("dragstart", beginExplore);
    map.on("zoomstart", beginExplore);
    let resizeSettle: number | undefined;
    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      drawTrace();
      if (resizeSettle !== undefined) window.clearTimeout(resizeSettle);
      resizeSettle = window.setTimeout(() => {
        applyMapView(map, modeRef.current, stopsRef.current, selectedIdRef.current, 0);
        drawTrace();
      }, 90);
    });
    resizeObserver.observe(container.current);
    map.once("load", () => {
      loadedRef.current = true;
      applyMapView(map, modeRef.current, stopsRef.current, selectedIdRef.current, 0);
      drawTrace();
    });
    mapRef.current = map;
    return () => {
      loadedRef.current = false;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.off("move", drawTrace);
      map.off("resize", drawTrace);
      map.off("dragstart", beginExplore);
      map.off("zoomstart", beginExplore);
      if (resizeSettle !== undefined) window.clearTimeout(resizeSettle);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    const labels = (stops.length ? routeDistricts : cityDistricts).map((district) => {
      const element = document.createElement("span");
      element.className = "route-map-district";
      element.textContent = district.name;
      return new maplibregl.Marker({ element, anchor: "center", offset: district.offset }).setLngLat([district.longitude, district.latitude]).addTo(map);
    });
    const stopMarkers = stops.map((stop, index) => new maplibregl.Marker({
      element: markerElement(stop, index, stop.id === selectedId, () => onSelect(stop.id)),
      anchor: "center",
    }).setLngLat([stop.longitude, stop.latitude]).addTo(map));
    markersRef.current = [...labels, ...stopMarkers];
  }, [onSelect, selectedId, stops]);

  useEffect(() => {
    stopsRef.current = stops;
    drawTraceRef.current();
  }, [stops]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    applyMapView(map, mode, stops, selectedId, mode === "plan" ? 350 : 450);
    const transitionFrame = window.setTimeout(() => {
      applyMapView(map, modeRef.current, stopsRef.current, selectedIdRef.current, 0);
      drawTraceRef.current();
    }, 460);
    return () => window.clearTimeout(transitionFrame);
  }, [mode, selectedId, stops, viewRevision]);

  const activeStops = stops.filter((stop) => !stop.removed);
  const walkingSummary = activeStops.slice(0, -1).map((from, index) => {
    const to = activeStops[index + 1];
    const leg = getFashionWalkingLeg(from.id, to.id);
    return leg ? `${from.name} to ${to.name}: ${leg.minutes} minutes walking` : "";
  }).filter(Boolean).join("; ");

  return <div className="city-context-map-shell" aria-label="City context map with five precise Tokyo store pins">
    <div className="city-context-map" ref={container} />
    <svg ref={svgRef} className="route-trace-svg" aria-hidden="true">
      <polyline ref={traceHaloRef} className="route-trace-halo" />
      <polyline ref={traceLineRef} className="route-trace-line" />
      <g ref={walkingLabelsRef} className="route-walk-labels" />
    </svg>
    <span className="route-walk-summary">Google Maps walking estimates checked July 23, 2026. {walkingSummary}. The dotted connector shows stop order, not the pedestrian route geometry.</span>
    <span className="map-credit">
      <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
      <span>·</span>
      <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">© CARTO</a>
    </span>
  </div>;
}
