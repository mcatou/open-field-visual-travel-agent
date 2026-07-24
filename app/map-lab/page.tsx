"use client";

/* eslint-disable @next/next/no-img-element -- this comparison page renders externally hosted map previews */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map-lab.css";

type DirectionId = "editorial" | "paper" | "context";
type Stop = {
  id: string;
  placeId: string;
  number: string;
  name: string;
  area: string;
  address: string;
  latitude: number;
  longitude: number;
  image: string;
  item: string;
  mapsUrl: string;
};

const directions: Array<{id:DirectionId;name:string;provider:string;summary:string;tradeoff:string;tiles:string;route:string;recommended?:boolean}> = [
  {id:"editorial",name:"Editorial night",provider:"CARTO Dark Matter + MapLibre",summary:"Real streets with a dark, restrained base so the route and clothing imagery stay dominant.",tradeoff:"Cinematic, but less familiar for everyday wayfinding",tiles:"https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png",route:"#d8ef72"},
  {id:"paper",name:"Soft paper",provider:"CARTO Positron + MapLibre",summary:"The same coordinates on a pale, highly legible city map for planning and accessibility.",tradeoff:"Fastest to read · deliberately less game-like",tiles:"https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png",route:"#c85137"},
  {id:"context",name:"City context",provider:"CARTO Voyager + MapLibre",summary:"More surrounding street detail while preserving the exact route geometry.",tradeoff:"Selected for the working route · clearest everyday wayfinding",tiles:"https://a.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}.png",route:"#1d6f5f",recommended:true},
];

const districtLabels = [
  {name:"MINAMI-AOYAMA",latitude:35.6602,longitude:139.7132},
  {name:"KITA-AOYAMA",latitude:35.6682,longitude:139.7119},
  {name:"OMOTESANDO",latitude:35.6660,longitude:139.7048},
  {name:"SHIBUYA",latitude:35.6597,longitude:139.6992},
];

const stops: Stop[] = [
  {id:"auralee",placeId:"fashion-auralee-tokyo",number:"01",name:"AURALEE TOKYO",area:"Minami-Aoyama",address:"6-3-2 Minami-Aoyama, Minato",latitude:35.6611583,longitude:139.7164106,image:"https://auralee.jp/photo/page/projects/26/20.jpg",item:"Washed Finx shirt + calf-hair skirt",mapsUrl:"https://www.google.com/maps/search/?api=1&query=AURALEE+TOKYO%2C+6-3-2+Minami-Aoyama%2C+Tokyo"},
  {id:"aton",placeId:"fashion-aton-aoyama",number:"02",name:"ATON AOYAMA",area:"Kita-Aoyama",address:"3-6-27 Kita-Aoyama, Minato",latitude:35.6647671,longitude:139.7111198,image:"https://cdn.shopify.com/s/files/1/0254/3733/9714/files/20260414_aton_95_002.jpg?v=1781177510",item:"Fresca oversized pullover",mapsUrl:"https://www.google.com/maps/search/?api=1&query=ATON+AOYAMA%2C+3-6-27+Kita-Aoyama%2C+Tokyo"},
  {id:"mame",placeId:"fashion-mame-aoyama",number:"03",name:"Mame Kurogouchi Aoyama",area:"Kita-Aoyama",address:"3-8-3 Kita-Aoyama, Minato",latitude:35.6653842,longitude:139.7104318,image:"https://cdn.shopify.com/s/files/1/0557/1271/0811/files/MM26SS-KN062BK-01.jpg?v=1771295589",item:"3D floral-motif cardigan",mapsUrl:"https://www.google.com/maps/search/?api=1&query=Mame+Kurogouchi+Aoyama%2C+3-8-3+Kita-Aoyama%2C+Tokyo"},
  {id:"cfcl",placeId:"fashion-cfcl-omotesando",number:"04",name:"CFCL OMOTESANDO",area:"Omotesando",address:"GYRE 3F, 5-10-1 Jingumae, Shibuya",latitude:35.6673861,longitude:139.7069111,image:"https://cdn.shopify.com/s/files/1/0495/2489/9996/files/CF012KH054_LAVENDER-FOG_0159_c64060c6-4c69-426e-9304-ff4af1c264b7.jpg?v=1780700686",item:"Milan draped dress",mapsUrl:"https://www.google.com/maps/search/?api=1&query=CFCL+OMOTESANDO%2C+GYRE+3F%2C+5-10-1+Jingumae%2C+Tokyo"},
  {id:"toga",placeId:"fashion-shibuya-parco",number:"05",name:"TOGA at Shibuya PARCO",area:"Shibuya",address:"Shibuya PARCO 2F, 15-1 Udagawacho",latitude:35.661999,longitude:139.6989521,image:"https://cdn.shopify.com/s/files/1/0082/1736/2485/files/TA261-FH091_02.jpg?v=1768552535",item:"Flower-print dress",mapsUrl:"https://www.google.com/maps/search/?api=1&query=TOGA%2C+Shibuya+PARCO%2C+15-1+Udagawacho%2C+Tokyo"},
];

function mapStyle(direction: (typeof directions)[number]) {
  return {
    version: 8 as const,
    sources: {basemap:{type:"raster" as const,tiles:[direction.tiles],tileSize:256,attribution:"© OpenStreetMap contributors © CARTO"}},
    layers: [{id:"basemap",type:"raster" as const,source:"basemap"}],
  };
}

function addRoute(map: MapLibreMap, direction: (typeof directions)[number]) {
  if (map.getSource("fashion-route")) return;
  map.addSource("fashion-route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: stops.map((stop) => [stop.longitude, stop.latitude]) },
    },
  });
  map.addLayer({id:"route-halo",type:"line",source:"fashion-route",paint:{"line-color":direction.id==="editorial"?"#102d27":"#fffaf0","line-width":8,"line-opacity":.72}});
  map.addLayer({id:"route-line",type:"line",source:"fashion-route",paint:{"line-color":direction.route,"line-width":3,"line-dasharray":[1.5,1.1]}});
}

function fitRoute(map: MapLibreMap, direction: DirectionId, duration = 0) {
  const bounds = new maplibregl.LngLatBounds();
  stops.forEach((stop) => bounds.extend([stop.longitude, stop.latitude]));
  map.jumpTo({pitch:direction==="editorial"?34:0,bearing:direction==="editorial"?-17:0});
  map.fitBounds(bounds, {padding:{top:105,right:125,bottom:105,left:115},maxZoom:14.05,duration});
}

function makeMarker(stop: Stop, isSelected: boolean, onSelect: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `geo-pin${isSelected ? " selected" : ""}`;
  button.setAttribute("aria-label", `Select ${stop.name}`);
  button.setAttribute("aria-pressed", String(isSelected));
  button.dataset.placeId = stop.placeId;

  const number = document.createElement("span");
  number.className = "geo-pin-number";
  number.textContent = stop.number;
  button.appendChild(number);

  if (isSelected) {
    const card = document.createElement("span");
    card.className = "geo-pin-card";
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

export default function MapLab() {
  const [direction, setDirection] = useState<DirectionId>("context");
  const [selected, setSelected] = useState("auralee");
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const lastDirection = useRef<DirectionId>("context");
  const activeDirection = useMemo(() => directions.find((item) => item.id === direction)!, [direction]);
  const activeStop = useMemo(() => stops.find((item) => item.id === selected)!, [selected]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const initial = directions.find((item) => item.id === "context")!;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle(initial),
      center: [139.708, 35.6645],
      zoom: 13.9,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });
    map.addControl(new maplibregl.NavigationControl({showCompass:false}), "top-right");
    map.addControl(new maplibregl.AttributionControl({compact:true}), "bottom-right");
    map.once("load", () => {
      addRoute(map, initial);
      fitRoute(map, "context");
    });
    mapRef.current = map;
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker) => marker.remove());
    const labels = districtLabels.map((district) => {
      const element = document.createElement("span");
      element.className = "geo-district-label";
      element.textContent = district.name;
      return new maplibregl.Marker({element,anchor:"center"}).setLngLat([district.longitude,district.latitude]).addTo(map);
    });
    markersRef.current = [...labels, ...stops.map((stop) => new maplibregl.Marker({
      element: makeMarker(stop, stop.id === selected, () => {
        setSelected(stop.id);
      }),
      anchor: "center",
    }).setLngLat([stop.longitude, stop.latitude]).addTo(map))];
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || lastDirection.current === direction) return;
    lastDirection.current = direction;
    map.setStyle(mapStyle(activeDirection));
    map.once("style.load", () => {
      addRoute(map, activeDirection);
      fitRoute(map, direction, 450);
    });
  }, [activeDirection, direction]);

  return <main className={`map-lab ${direction}`}>
    <header className="lab-header">
      <div><Link href="/">← Route demo</Link><span>Verified geography · separate study</span></div>
      <h1>Map direction lab</h1>
      <p>Three real Tokyo basemaps, using the same five verified coordinates and one synchronized pin system.</p>
    </header>

    <section className="direction-picker" aria-label="Map direction comparison">
      {directions.map((item) => <button key={item.id} className={direction===item.id?"active":""} onClick={()=>setDirection(item.id)} aria-pressed={direction===item.id}>
        <span>{item.recommended?"Recommended":"Alternative"}</span><strong>{item.name}</strong><b>{item.provider}</b><p>{item.summary}</p><small>{item.tradeoff}</small>
      </button>)}
    </section>

    <section className="map-study">
      <div className="study-label"><span>Real street map</span><strong>{activeDirection.name}</strong><small>{activeDirection.provider}</small></div>
      <div className="map-canvas" ref={mapContainer} aria-label={`${activeDirection.name} real Tokyo route map`} />
      <aside className="pin-spec">
        <span>Selected stop</span><img src={activeStop.image} alt=""/><strong>{activeStop.name}</strong><small>{activeStop.area}</small><p>{activeStop.item}</p>
        <dl><div><dt>Address</dt><dd>{activeStop.address}</dd></div><div><dt>Coordinates</dt><dd>{activeStop.latitude.toFixed(7)}, {activeStop.longitude.toFixed(7)}</dd></div></dl>
        <a className="exact-pin-link" href={activeStop.mapsUrl} target="_blank" rel="noreferrer">Open exact pin ↗</a>
        <div className="marker-contract"><b>{activeStop.number}</b><span><strong>Numbered route marker</strong><small>Each marker is anchored to its stored longitude and latitude. The selected marker expands without changing its point.</small></span></div>
        <ul><li>Exact store or building coordinate</li><li>Stable place ID shared with route data</li><li>Image appears only on selection</li><li>Card and pin stay synchronized</li></ul>
      </aside>
    </section>

    <footer><strong>What is geographically exact</strong><p>All five pins use verified store or building coordinates. Label-free CARTO street tiles prevent unwanted Japanese naming; controlled English area labels sit above them. The connecting line shows stop sequence only; it is not yet a walking-directions route.</p></footer>
    <details className="coordinate-index"><summary>All five verified coordinates</summary><ol>{stops.map((stop)=><li key={stop.placeId}><b>{stop.number} · {stop.name}</b><span>{stop.address}</span><code>{stop.latitude.toFixed(7)}, {stop.longitude.toFixed(7)}</code></li>)}</ol></details>
  </main>;
}
