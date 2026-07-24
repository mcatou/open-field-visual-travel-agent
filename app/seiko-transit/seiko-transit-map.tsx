"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteId, RouteLeg, SeikoTransitNode } from "../../src/runtime/seiko-transit-flow";

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

const CONTROLLED_ENGLISH_LABELS = [
  { label: "Ginza", longitude: 139.7658, latitude: 35.6707 },
  { label: "Yurakucho", longitude: 139.7619, latitude: 35.6758 },
  { label: "Tokyo Station", longitude: 139.7712, latitude: 35.6817 },
  { label: "Marunouchi", longitude: 139.7626, latitude: 35.6817 },
  { label: "Shimbashi", longitude: 139.7586, latitude: 35.6664 },
] as const;

type LineFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: { id: string };
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }>;
};

export function decodePolyline6(encoded: string): [number, number][] {
  const coordinates: [number, number][] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push([longitude / 1e6, latitude / 1e6]);
  }
  return coordinates;
}

function pinElement(
  node: SeikoTransitNode,
  index: number,
  selected: boolean,
  active: boolean,
  onSelect: () => void,
) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `seiko-map-pin ${node.kind} ${active ? "active" : ""} ${selected ? "selected" : ""}`;
  button.dataset.nodeId = node.id;
  button.setAttribute("aria-label", `Show ${node.name}`);
  button.setAttribute("aria-pressed", String(selected));
  const dot = document.createElement("span");
  dot.textContent = node.kind === "station"
    ? node.id === "yurakucho-station" ? "JR" : "M"
    : node.kind === "deadline"
      ? "T"
      : String(index + 1).padStart(2, "0");
  button.appendChild(dot);
  const label = document.createElement("strong");
  label.textContent = node.shortName;
  button.appendChild(label);
  button.addEventListener("click", onSelect);
  return button;
}

function timePill(label: string, mode: "walk" | "rail" | "candidate") {
  const element = document.createElement("div");
  element.className = `route-time-pill ${mode}`;
  element.textContent = label;
  return element;
}

function areaLabel(text: string) {
  const element = document.createElement("div");
  element.className = "seiko-area-label";
  element.textContent = text;
  return element;
}

function railCoordinates(routeId: RouteId, nodes: SeikoTransitNode[]): [number, number][] {
  if (routeId === "walk-direct") return [];
  const stationId = routeId === "jr-direct" ? "yurakucho-station" : "ginza-station";
  const station = nodes.find((node) => node.id === stationId);
  const tokyo = nodes.find((node) => node.id === "tokyo-station");
  if (!station || !tokyo) return [];
  const middle: [number, number] = routeId === "jr-direct"
    ? [139.76505, 35.67812]
    : [139.76602, 35.67675];
  return [
    [station.longitude, station.latitude],
    middle,
    [tokyo.longitude, tokyo.latitude],
  ];
}

function fitGeometry(
  map: MapLibreMap,
  coordinates: [number, number][],
  expanded: boolean,
  duration = 0,
) {
  if (!coordinates.length) return;
  const bounds = new maplibregl.LngLatBounds();
  coordinates.forEach((coordinate) => bounds.extend(coordinate));
  map.fitBounds(bounds, {
    padding: expanded
      ? { top: 82, right: 62, bottom: 235, left: 62 }
      : { top: 82, right: 44, bottom: 245, left: 44 },
    maxZoom: 15.3,
    duration,
  });
}

export function SeikoTransitMap({
  nodes,
  candidateLegs,
  routeNodeIds,
  routeLegs,
  routeId,
  selectedId,
  expanded,
  revision,
  onSelect,
  onExplore,
}: {
  nodes: SeikoTransitNode[];
  candidateLegs: RouteLeg[];
  routeNodeIds: string[];
  routeLegs: RouteLeg[];
  routeId: RouteId;
  selectedId: string;
  expanded: boolean;
  revision: number;
  onSelect: (id: string) => void;
  onExplore: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const timeMarkersRef = useRef<Marker[]>([]);
  const propsRef = useRef({ nodes, candidateLegs, routeNodeIds, routeLegs, routeId, selectedId, expanded, onSelect });
  const onExploreRef = useRef(onExplore);

  useEffect(() => {
    propsRef.current = { nodes, candidateLegs, routeNodeIds, routeLegs, routeId, selectedId, expanded, onSelect };
    onExploreRef.current = onExplore;
  }, [nodes, candidateLegs, routeNodeIds, routeLegs, routeId, selectedId, expanded, onSelect, onExplore]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: cityContextStyle,
      center: [139.765, 35.675],
      zoom: 14.2,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-left");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
    const explore = (event: unknown) => {
      if ((event as { originalEvent?: unknown }).originalEvent) onExploreRef.current();
    };
    map.on("dragstart", explore);
    map.on("zoomstart", explore);
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);
    mapRef.current = map;
    return () => {
      resizeObserver.disconnect();
      markersRef.current.forEach((marker) => marker.remove());
      // The cleanup intentionally removes the latest dynamic route labels.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      timeMarkersRef.current.forEach((marker) => marker.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () => {
      markersRef.current.forEach((marker) => marker.remove());
      timeMarkersRef.current.forEach((marker) => marker.remove());
      const activeIds = new Set(routeNodeIds);
      const englishLabels = CONTROLLED_ENGLISH_LABELS.map((label) => new maplibregl.Marker({
        element: areaLabel(label.label),
        anchor: "center",
      }).setLngLat([label.longitude, label.latitude]).addTo(map));
      const nodeMarkers = nodes.map((node, index) => new maplibregl.Marker({
        element: pinElement(
          node,
          index,
          node.id === selectedId,
          activeIds.has(node.id),
          () => onSelect(node.id),
        ),
        anchor: "center",
      }).setLngLat([node.longitude, node.latitude]).addTo(map));
      markersRef.current = [...englishLabels, ...nodeMarkers];

      const walkFeatures: LineFeatureCollection = {
        type: "FeatureCollection",
        features: routeLegs.map((leg) => ({
          type: "Feature",
          properties: { id: leg.id },
          geometry: { type: "LineString", coordinates: decodePolyline6(leg.encodedShape) },
        })),
      };
      const candidateWalkFeatures: LineFeatureCollection = {
        type: "FeatureCollection",
        features: candidateLegs.map((leg) => ({
          type: "Feature",
          properties: { id: leg.id },
          geometry: { type: "LineString", coordinates: decodePolyline6(leg.encodedShape) },
        })),
      };
      const rail = railCoordinates(routeId, nodes);
      const railFeatures: LineFeatureCollection = {
        type: "FeatureCollection",
        features: rail.length ? [{
          type: "Feature",
          properties: { id: routeId },
          geometry: { type: "LineString", coordinates: rail },
        }] : [],
      };

      if (!map.getSource("candidate-walk-route")) {
        map.addSource("candidate-walk-route", { type: "geojson", data: candidateWalkFeatures });
        map.addLayer({ id: "candidate-walk-halo", type: "line", source: "candidate-walk-route", paint: { "line-color": "#fffaf0", "line-width": 7, "line-opacity": 0.72 } });
        map.addLayer({ id: "candidate-walk-route", type: "line", source: "candidate-walk-route", paint: { "line-color": "#8b735f", "line-width": 2.6, "line-opacity": 0.88, "line-dasharray": [1, 2.4] } });
      } else {
        (map.getSource("candidate-walk-route") as GeoJSONSource).setData(candidateWalkFeatures);
      }
      if (!map.getSource("walk-route")) {
        map.addSource("walk-route", { type: "geojson", data: walkFeatures });
        map.addLayer({ id: "walk-halo", type: "line", source: "walk-route", paint: { "line-color": "#fffaf0", "line-width": 9, "line-opacity": 0.9 } });
        map.addLayer({ id: "walk-route", type: "line", source: "walk-route", paint: { "line-color": "#1e7767", "line-width": 4, "line-dasharray": [1, 2.2] } });
      } else {
        (map.getSource("walk-route") as GeoJSONSource).setData(walkFeatures);
      }
      if (!map.getSource("rail-route")) {
        map.addSource("rail-route", { type: "geojson", data: railFeatures });
        map.addLayer({ id: "rail-halo", type: "line", source: "rail-route", paint: { "line-color": "#fffaf0", "line-width": 9, "line-opacity": 0.9 } });
        map.addLayer({ id: "rail-route", type: "line", source: "rail-route", paint: { "line-color": routeId === "jr-direct" ? "#426d7b" : "#b94b3d", "line-width": 4 } });
      } else {
        (map.getSource("rail-route") as GeoJSONSource).setData(railFeatures);
        map.setPaintProperty("rail-route", "line-color", routeId === "jr-direct" ? "#426d7b" : "#b94b3d");
      }

      const allCoordinates = [...rail];
      const activeLegIds = new Set(routeLegs.map((leg) => leg.id));
      candidateLegs.forEach((leg) => {
        const coordinates = decodePolyline6(leg.encodedShape);
        allCoordinates.push(...coordinates);
        if (activeLegIds.has(leg.id)) return;
        const middle = coordinates[Math.floor(coordinates.length / 2)];
        if (middle) {
          timeMarkersRef.current.push(
            new maplibregl.Marker({ element: timePill(`${leg.displayMinutes} min walk`, "candidate"), anchor: "center" })
              .setLngLat(middle)
              .addTo(map),
          );
        }
      });
      routeLegs.forEach((leg) => {
        const coordinates = decodePolyline6(leg.encodedShape);
        allCoordinates.push(...coordinates);
        const middle = coordinates[Math.floor(coordinates.length / 2)];
        if (middle) {
          timeMarkersRef.current.push(
            new maplibregl.Marker({ element: timePill(`${leg.displayMinutes} min walk`, "walk"), anchor: "center" })
              .setLngLat(middle)
              .addTo(map),
          );
        }
      });
      if (rail.length) {
        timeMarkersRef.current.push(
          new maplibregl.Marker({
            element: timePill(routeId === "jr-direct" ? "3 min JR" : "4 min M", "rail"),
            anchor: "center",
          }).setLngLat(rail[Math.floor(rail.length / 2)]).addTo(map),
        );
      }
      fitGeometry(map, allCoordinates, expanded, revision ? 420 : 0);
    };
    if (map.getSource("walk-route") || map.isStyleLoaded()) update();
    else map.once("load", update);
  }, [nodes, candidateLegs, routeNodeIds, routeLegs, routeId, selectedId, expanded, revision, onSelect]);

  return (
    <div
      className="seiko-map-canvas"
      ref={containerRef}
      aria-label="Labeled Ginza and Tokyo Station route map"
      data-route-id={routeId}
      data-route-legs={routeLegs.map((leg) => leg.id).join(",")}
    />
  );
}
