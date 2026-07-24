export type StockState = "unknown" | "confirmed" | "unavailable";
export type TransitDisruption = "none" | "marunouchi" | "jr";
export type StoreId = "wako" | "namiki" | "boutique-ginza" | "nisshindo";
export type RouteId =
  | "metro-direct"
  | "jr-direct"
  | "walk-direct"
  | `shop-${StoreId}`;

export const GRAND_SEIKO_MODEL = {
  reference: "SBGH343",
  name: "Sakura-Wakaba",
  priceYen: 1_056_000,
  dial: "Light green, inspired by young cherry leaves",
  caseAndBracelet: "Bright titanium",
  caseDiameter: "38 mm",
  movement: "Hi-Beat 9S85",
  productUrl: "https://www.grand-seiko.com/jp-ja/collections/sbgh343",
} as const;

export const WATCH_PURCHASE_MINUTES = 20;

export const AIRPORT_CONTINUATION = {
  luggageStorageLocation: "unknown",
  luggageSourceUrl: "https://www.tokyostationcity.com/en/information/",
  targetAirport: "Narita International Airport",
  airline: "ANA",
  destination: "San Francisco",
  terminal: "Terminal 1 — reconfirm on the day of departure",
  naritaExpressFastestMinutes: 53,
  naritaExpressSourceUrl: "https://www.jreast.co.jp/multi/en/nex/",
  internationalCheckinDeadlineMinutes: 60,
  anaAirportSourceUrl: "https://www.ana.co.jp/en/jp/guide/prepare/airport-guide/international/nrt/",
  anaProcedureSourceUrl: "https://www.ana.co.jp/en/jp/guide/boarding-procedures/checkin/international/procedure/",
} as const;

export type SeikoTransitScenario = {
  selectedStoreId: StoreId;
  stock: StockState;
  lostMinutes: number;
  disruption: TransitDisruption;
};

export type SeikoTransitNode = {
  id: string;
  name: string;
  shortName: string;
  kind: "start" | "store" | "station" | "deadline";
  latitude: number;
  longitude: number;
  mapsUrl: string;
};

export type GinzaStore = {
  id: StoreId | "matsuya-ginza" | "mitsukoshi";
  name: string;
  shortName: string;
  hours: string;
  walkMinutes: number;
  telephone: string;
  benefit: string;
  benefitSourceUrl?: string;
  stockNote: string;
  imagePath: string;
  imageAlt: string;
  sourceUrl: string;
  mapsUrl: string;
};

export type RouteLeg = {
  id: string;
  fromId: string;
  toId: string;
  encodedShape: string;
  displayMinutes: number;
  distanceMeters: number;
  mode: "walk";
  source: "Valhalla / OpenStreetMap";
  timingSource: "Google Maps snapshot";
};

export type SeikoTransitStep = {
  id: string;
  nodeId: string;
  label: string;
  detail: string;
  minutes: number;
  kind: "call" | "walk" | "shop" | "train" | "station_buffer";
};

export type SeikoTransitPlan = {
  mode: "protect_train" | "shop_then_train";
  recommendedRouteId: RouteId;
  alternatives: RouteId[];
  verdict: string;
  steps: SeikoTransitStep[];
  minutesUsed: number;
  remainingBuffer: number;
};

export const GINZA_STORES: GinzaStore[] = [
  {
    id: "matsuya-ginza",
    name: "Matsuya Ginza Watch Salon",
    shortName: "Matsuya",
    hours: "11:00–20:00",
    walkMinutes: 0,
    telephone: "03-3567-1211",
    benefit: "Possible department-store card benefits require eligibility; no SBGH343 same-purchase discount is confirmed.",
    stockNote: "Starting point in the source dialog. Exact SBGH343 stock still needs a branch check.",
    imagePath: "/seiko-transit/store-matsuya.jpg",
    imageAlt: "Matsuya Ginza watch salon",
    sourceUrl: "https://www.grand-seiko.com/jp-ja/storesinfo/10040",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Matsuya%20Ginza%20Watch%20Salon",
  },
  {
    id: "wako",
    name: "Wako Grand Seiko Flagship",
    shortName: "Wako",
    hours: "11:00–19:00",
    walkMinutes: 3,
    telephone: "03-3562-2111",
    benefit: "Wako points start at 1% of eligible pre-tax spend and post the next day—not a reduction on this purchase.",
    benefitSourceUrl: "https://site.wako.co.jp/files/pdf/card_kiyaku_250715.pdf",
    stockNote: "Official carrier class; exact SBGH343 stock is unknown until the branch confirms it.",
    imagePath: "/seiko-transit/store-wako.jpg",
    imageAlt: "Grand Seiko flagship boutique at Wako in Ginza",
    sourceUrl: "https://www.grand-seiko.com/jp-ja/storesinfo/JP-129926",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Grand%20Seiko%20Flagship%20Boutique%20Ginza%20Wako",
  },
  {
    id: "namiki",
    name: "Grand Seiko Flagship Boutique Ginza Namiki",
    shortName: "Namiki",
    hours: "11:00–19:00",
    walkMinutes: 7,
    telephone: "03-6228-5918",
    benefit: "No published same-purchase discount was confirmed; ask about tax-free eligibility and current boutique policy.",
    stockNote: "Official boutique; exact SBGH343 stock is unknown until the branch confirms it.",
    imagePath: "/seiko-transit/store-namiki.jpg",
    imageAlt: "Grand Seiko flagship boutique on Ginza Namiki Street",
    sourceUrl: "https://www.grand-seiko.com/jp-ja/storesinfo/jp-86768",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Grand%20Seiko%20Flagship%20Boutique%20Ginza%20Namiki",
  },
  {
    id: "boutique-ginza",
    name: "Grand Seiko Boutique Ginza",
    shortName: "GS Ginza",
    hours: "11:00–19:00",
    walkMinutes: 7,
    telephone: "03-3562-3800",
    benefit: "No published same-purchase discount was confirmed; ask about tax-free eligibility and current boutique policy.",
    stockNote: "Official boutique; exact SBGH343 stock is unknown until the branch confirms it.",
    imagePath: "/seiko-transit/store-boutique-ginza.jpg",
    imageAlt: "Grand Seiko Boutique Ginza storefront",
    sourceUrl: "https://www.grand-seiko.com/jp-ja/storesinfo/10143",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Grand%20Seiko%20Boutique%20Ginza%207-9-16",
  },
  {
    id: "mitsukoshi",
    name: "Ginza Mitsukoshi Watch Salon",
    shortName: "Mitsukoshi",
    hours: "10:00–20:00",
    walkMinutes: 2,
    telephone: "03-3562-1111",
    benefit: "Eligible visitors can activate a 5% Mitsukoshi Isetan app coupon. Some brands and items are excluded, so confirm Grand Seiko at the counter.",
    benefitSourceUrl: "https://cp.mistore.jp/global/en/app/shopping-coupon.html",
    stockNote: "The source-dialog day had a special closure. Recheck both opening status and stock before routing.",
    imagePath: "/seiko-transit/store-mitsukoshi.jpg",
    imageAlt: "Ginza Mitsukoshi watch salon",
    sourceUrl: "https://www.grand-seiko.com/jp-ja/storesinfo/id-84363",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ginza%20Mitsukoshi%20Watch%20Salon",
  },
  {
    id: "nisshindo",
    name: "Nisshindo Ginza Main Store",
    shortName: "Nisshindo",
    hours: "11:00–20:00",
    walkMinutes: 8,
    telephone: "03-3571-5611",
    benefit: "No published same-purchase discount was confirmed; ask the store and confirm tax-free eligibility separately.",
    stockNote: "Official Grand Seiko Master Shop; exact SBGH343 stock is unknown until the branch confirms it.",
    imagePath: "/seiko-transit/store-nisshindo.jpg",
    imageAlt: "Nisshindo Ginza main store",
    sourceUrl: "https://www.grand-seiko.com/jp-ja/storesinfo/10043",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Nisshindo%20Ginza%20Main%20Store",
  },
];

export const SEIKO_TRANSIT_NODES: SeikoTransitNode[] = [
  {
    id: "matsuya-ginza",
    name: "Matsuya Ginza Watch Salon",
    shortName: "Matsuya",
    kind: "start",
    latitude: 35.6722946,
    longitude: 139.7666931,
    mapsUrl: GINZA_STORES[0].mapsUrl,
  },
  {
    id: "wako",
    name: "Wako Grand Seiko Flagship",
    shortName: "Wako",
    kind: "store",
    latitude: 35.671678,
    longitude: 139.7650451,
    mapsUrl: GINZA_STORES[1].mapsUrl,
  },
  {
    id: "namiki",
    name: "Grand Seiko Flagship Boutique Ginza Namiki",
    shortName: "Namiki",
    kind: "store",
    latitude: 35.6709513,
    longitude: 139.762487,
    mapsUrl: GINZA_STORES[2].mapsUrl,
  },
  {
    id: "boutique-ginza",
    name: "Grand Seiko Boutique Ginza",
    shortName: "GS Ginza",
    kind: "store",
    latitude: 35.6687965,
    longitude: 139.7628174,
    mapsUrl: GINZA_STORES[3].mapsUrl,
  },
  {
    id: "nisshindo",
    name: "Nisshindo Ginza Main Store",
    shortName: "Nisshindo",
    kind: "store",
    latitude: 35.6685295,
    longitude: 139.762558,
    mapsUrl: GINZA_STORES[5].mapsUrl,
  },
  {
    id: "ginza-station",
    name: "Ginza Station — Marunouchi Line M16",
    shortName: "Ginza Station",
    kind: "station",
    latitude: 35.67123,
    longitude: 139.765,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Ginza%20Station%20M16",
  },
  {
    id: "yurakucho-station",
    name: "JR Yurakucho Station",
    shortName: "Yurakucho JR",
    kind: "station",
    latitude: 35.675069,
    longitude: 139.763328,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=JR%20Yurakucho%20Station",
  },
  {
    id: "tokyo-station",
    name: "Tokyo Station",
    shortName: "Tokyo",
    kind: "deadline",
    latitude: 35.68126,
    longitude: 139.76671,
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Tokyo%20Station",
  },
];

export const ROUTE_LEGS: RouteLeg[] = [
  {
    id: "matsuya-wako",
    fromId: "matsuya-ginza",
    toId: "wako",
    encodedShape: "}vg`cA}ktqiGtWpYc@t@e@z@|B`CeAfBrBzBy@jAc@n@sANaKjPMRr_@fa@",
    displayMinutes: 3,
    distanceMeters: 150,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "matsuya-namiki",
    fromId: "matsuya-ginza",
    toId: "namiki",
    encodedShape: "}vg`cA}ktqiGtWpY`AZf@h@d@h@`@d@^d@r@|@|ElFfVdXKPh@l@xA~AcAjBhDpDfCjCrCxCbCfCaBdCq@hAhIhILNRPMRtc@ff@Jn@Ot@_KhPMRe@v@i@z@MP}IxNy@lAs@hAsIlNs@fAe@VLf@`A`An@n@b@B?NF^a@Ji@z@e@z@Wj@dMnM",
    displayMinutes: 7,
    distanceMeters: 450,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "matsuya-boutique-ginza",
    fromId: "matsuya-ginza",
    toId: "boutique-ginza",
    encodedShape: "}vg`cA}ktqiGtWpY`AZf@h@d@h@`@d@^d@r@|@|ElFfVdXdFvFlD]p@v@`BhBzCpDtA~At@z@?jDbFpFtc@ze@^T`@CNTx@`Az@bAXPBZXb@|c@zf@xIbJ`@Pr@p@h@l@n@p@p@|@fZn[",
    displayMinutes: 7,
    distanceMeters: 500,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "matsuya-nisshindo",
    fromId: "matsuya-ginza",
    toId: "nisshindo",
    encodedShape: "}vg`cA}ktqiGtWpY`AZf@h@d@h@`@d@^d@r@|@|ElFfVdXdFvFlD]p@v@`BhBzCpDtA~At@z@?jDbFpFtc@ze@^T`@CNTx@`Az@bAXPBZXb@|c@zf@xIbJ`@Pr@p@h@l@n@p@p@|@nZv[tRrT\\VTLRK\\OjC_E",
    displayMinutes: 8,
    distanceMeters: 550,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "matsuya-ginza-station",
    fromId: "matsuya-ginza",
    toId: "ginza-station",
    encodedShape: "}vg`cA}ktqiGtWpY`AZf@h@d@h@`@d@^d@r@|@|ElFfVdXdFvFe@n@e@p@lFlFhDjDwAxB",
    displayMinutes: 3,
    distanceMeters: 210,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "matsuya-yurakucho",
    fromId: "matsuya-ginza",
    toId: "yurakucho-station",
    encodedShape: "}vg`cA}ktqiG_VyWs@lAc@t@qC{CqA|BmAjBgNnToMdTqMrSqApBcAtAsJjOgI`OmBbD{ArEaAtCuDbLwAdE]vAMd@sA`Ey@bC_@vA_@`CMrCm@~Zi@xB_ApA^t@Xl@{FdCuBpCW\\lCjErBhD}CjGw@eAs@fAs@nA[f@_BiCs@{BgH{J",
    displayMinutes: 7,
    distanceMeters: 450,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "matsuya-tokyo",
    fromId: "matsuya-ginza",
    toId: "tokyo-station",
    encodedShape: "}vg`cA}ktqiG_VyW_AcAOO}@cAk@m@SSo@Y}g@}i@fAgB}GiI{AlCHjAyC~F}BoCoMlTo@u@aMtS}b@vs@}NlVWnAgChMuBuAi@lAj@h@f@\\Tw@o@a@}WsPgKkGsUuNkQmKaAM{BWoC[{PyJiAYeAZiFmAyFwA{Cw@Hs@}AuGcH{Do_@cTYQiFoCcYwMuIuE_HfEu@Wof@aQ}ApJiIkC}DrBg@tCe@hCa@^mBzKNp@cCxNeEBaAWgQ~LkE|CwEoA{EqAqZeIG^o@hEuAlJIh@k@zDrIzB",
    displayMinutes: 11,
    distanceMeters: 750,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "wako-ginza-station",
    fromId: "wako",
    toId: "ginza-station",
    encodedShape: "slf`cA_jqqiG~GnHR]dCuD~EoHn@p@rAvAdDuElDnD",
    displayMinutes: 1,
    distanceMeters: 90,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "namiki-ginza-station",
    fromId: "namiki",
    toId: "ginza-station",
    encodedShape: "_ud`cAaylqiGeMoMVk@d@{@h@{@`@KG_@?Oc@Co@o@aAaAMg@d@Wr@gArImNr@iAx@mA|IyNLQh@{@d@w@LS~JiPNu@Ko@Xe@|@{Amh@}j@mAsA_FaF",
    displayMinutes: 4,
    distanceMeters: 305,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "boutique-ginza-station",
    fromId: "boutique-ginza",
    toId: "ginza-station",
    encodedShape: "ow``cAg`mqiGgZo[e@r@a@t@kBeBeBiBcAgAgm@ip@}B}BwBeCiAmAmh@ik@}E}EwAxB",
    displayMinutes: 4,
    distanceMeters: 342,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "nisshindo-ginza-station",
    fromId: "nisshindo",
    toId: "ginza-station",
    encodedShape: "_|_`cAaplqiGkC~D]NSJUMa@r@_@j@gAmAam@ko@kBeBeBiBcAgAgm@ip@}B}BwBeCiAmAmh@ik@}E}EwAxB",
    displayMinutes: 5,
    distanceMeters: 408,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
];

export const GINZA_STORE_WALK_LEGS: RouteLeg[] = [
  ROUTE_LEGS[0],
  {
    id: "wako-namiki",
    fromId: "wako",
    toId: "namiki",
    encodedShape: "slf`cA_jqqiG~GnHc@l@a@n@OTkEtGoAlBwAvBQV]h@k@|@QVoJ|NW`@QRj@p@hAnA`DpDrAzA^RCn@\\~@tAjBjTlUlUjVZ`@THTALf@`A`An@n@b@B?NF^a@Ji@z@e@z@Wj@dMnM",
    displayMinutes: 4,
    distanceMeters: 308,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "namiki-boutique-ginza",
    fromId: "namiki",
    toId: "boutique-ginza",
    encodedShape: "_ud`cAaylqiGt@v@na@pc@Xc@j@cAh@_ATc@tLgQn@iAr@oAfJwNNSr@aARWLQ`@i@zK{PQ{@To@h@{@|AjBtAsBjBdB`@u@d@s@fZn[",
    displayMinutes: 4,
    distanceMeters: 317,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
  {
    id: "boutique-ginza-nisshindo",
    fromId: "boutique-ginza",
    toId: "nisshindo",
    encodedShape: "ow``cAg`mqiGFFtRrT\\VTLRK\\OjC_E",
    displayMinutes: 1,
    distanceMeters: 66,
    mode: "walk",
    source: "Valhalla / OpenStreetMap",
    timingSource: "Google Maps snapshot",
  },
];

const directMetroSteps: SeikoTransitStep[] = [
  { id: "call-first", nodeId: "matsuya-ginza", label: "Call before walking", detail: "Ask for SBGH343 specifically and whether it can be held.", minutes: 4, kind: "call" },
  { id: "walk-ginza", nodeId: "ginza-station", label: "Walk to Ginza Station", detail: "Use a signed Marunouchi Line entrance. M16 is Ginza's station code.", minutes: 3, kind: "walk" },
  { id: "metro-tokyo", nodeId: "tokyo-station", label: "Ginza Station → Tokyo Station", detail: "One stop on the Marunouchi Line, from M16 to M17. Confirm the next departure on the platform display.", minutes: 4, kind: "train" },
];

const directJrSteps: SeikoTransitStep[] = [
  { id: "call-first", nodeId: "matsuya-ginza", label: "Call before walking", detail: "Ask for SBGH343 specifically and whether it can be held.", minutes: 4, kind: "call" },
  { id: "walk-yurakucho", nodeId: "yurakucho-station", label: "Walk to JR Yurakucho", detail: "Google Maps snapshot: about 7 minutes from Matsuya.", minutes: 7, kind: "walk" },
  { id: "jr-tokyo", nodeId: "tokyo-station", label: "JR one stop to Tokyo", detail: "Check the platform display; this demo does not invent a departure.", minutes: 3, kind: "train" },
];

function finish(
  recommendedRouteId: RouteId,
  alternatives: RouteId[],
  verdict: string,
  steps: SeikoTransitStep[],
  lostMinutes: number,
  mode: SeikoTransitPlan["mode"],
): SeikoTransitPlan {
  const minutesUsed = steps.reduce((sum, step) => sum + step.minutes, 0) + lostMinutes;
  return {
    mode,
    recommendedRouteId,
    alternatives,
    verdict,
    steps,
    minutesUsed,
    remainingBuffer: Math.max(0, 60 - minutesUsed),
  };
}

export function buildSeikoTransitPlan(scenario: SeikoTransitScenario): SeikoTransitPlan {
  const directSteps = scenario.disruption === "marunouchi" ? directJrSteps : directMetroSteps;
  const directId: RouteId = scenario.disruption === "marunouchi" ? "jr-direct" : "metro-direct";
  const alternatives: RouteId[] = scenario.disruption === "marunouchi"
    ? ["metro-direct", "walk-direct"]
    : ["jr-direct", "walk-direct"];

  if (scenario.lostMinutes >= 12 || scenario.stock === "unavailable") {
    return finish(
      directId,
      alternatives,
      scenario.stock === "unavailable"
        ? "That branch cannot help. Go to Tokyo Station and keep SBGH343 as a saved search."
        : "The shopping margin is gone. Go to Tokyo Station now.",
      directSteps,
      scenario.lostMinutes,
      "protect_train",
    );
  }

  if (scenario.stock === "confirmed") {
    const store = GINZA_STORES.find((candidate) => candidate.id === scenario.selectedStoreId)!;
    const returnMinutes = scenario.selectedStoreId === "wako" ? 1 : scenario.selectedStoreId === "nisshindo" ? 5 : 4;
    const steps: SeikoTransitStep[] = [
      { id: "stock-confirmed", nodeId: scenario.selectedStoreId, label: `${store.shortName} confirmed SBGH343`, detail: "Ask the branch to hold the exact reference before leaving Matsuya.", minutes: 2, kind: "call" },
      { id: "walk-store", nodeId: scenario.selectedStoreId, label: `Walk to ${store.shortName}`, detail: `Google Maps snapshot: about ${store.walkMinutes} minutes.`, minutes: store.walkMinutes, kind: "walk" },
      { id: "inspect", nodeId: scenario.selectedStoreId, label: "Inspect, price, and decide", detail: "Confirm fit, tax-free eligibility, and the final amount before sizing.", minutes: 8, kind: "shop" },
      { id: "purchase", nodeId: scenario.selectedStoreId, label: "Complete the purchase", detail: "Allow 20 min minimum for bracelet sizing and paperwork, including signatures, payment, tax-free processing, and packing.", minutes: WATCH_PURCHASE_MINUTES, kind: "shop" },
      { id: "return-ginza", nodeId: "ginza-station", label: "Return to Ginza Station", detail: "Do not start the purchase unless the full 20-minute transaction window fits before this exit.", minutes: returnMinutes, kind: "walk" },
      { id: "metro-tokyo", nodeId: "tokyo-station", label: "Ginza Station → Tokyo Station", detail: "One stop on the Marunouchi Line, from M16 to M17; verify the live platform display.", minutes: 4, kind: "train" },
    ];
    return finish(
      `shop-${scenario.selectedStoreId}`,
      [directId, ...alternatives],
      `${store.shortName} has confirmed SBGH343. The detour fits only with a hard exit cutoff.`,
      steps,
      scenario.lostMinutes,
      "shop_then_train",
    );
  }

  return finish(
    directId,
    alternatives,
    "Call first. If no branch confirms SBGH343 within four minutes, leave for Tokyo Station.",
    directSteps,
    scenario.lostMinutes,
    "protect_train",
  );
}
