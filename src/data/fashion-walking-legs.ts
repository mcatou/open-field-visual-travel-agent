export type FashionWalkingLeg = {
  id: string;
  fromId: string;
  toId: string;
  minutes: number;
  distance: string;
  sourceUrl: string;
  capturedAt: "2026-07-23";
  sourceSupports: "Google Maps displayed walking duration and distance for this store pair.";
  sourceDoesNotSupport: "The demo's dotted straight connector is not the pedestrian route geometry.";
  safeDownstreamUse: "public_demo";
};

const encodedDestinations: Record<string, string> = {
  "fashion-auralee-tokyo": "AURALEE+TOKYO%2C+6-3-2+Minami-Aoyama%2C+Tokyo",
  "fashion-aton-aoyama": "ATON+AOYAMA%2C+3-6-27+Kita-Aoyama%2C+Tokyo",
  "fashion-mame-aoyama": "Mame+Kurogouchi+Aoyama%2C+3-8-3+Kita-Aoyama%2C+Tokyo",
  "fashion-cfcl-omotesando": "CFCL+OMOTESANDO%2C+GYRE+3F%2C+5-10-1+Jingumae%2C+Tokyo",
  "fashion-shibuya-parco": "TOGA%2C+Shibuya+PARCO%2C+15-1+Udagawacho%2C+Tokyo",
  "vintage-amore-omotesando": "AMORE+Vintage+Omotesando%2C+5-1-15+Jingumae%2C+Tokyo",
  "vintage-qoo-omotesando": "VINTAGE+QOO+TOKYO%2C+5-2-6+Jingumae%2C+Tokyo",
  "vintage-ragtag-harajuku": "RAGTAG+Harajuku%2C+5-17-9+Jingumae%2C+Tokyo",
  "vintage-paradise-jingumae": "Paradise+Vintage%2C+3-27-4+Jingumae%2C+Tokyo",
  "vintage-kinji-harajuku": "KINJI+Harajuku%2C+4-31-10+Jingumae%2C+Tokyo",
  "vintage-10tow-shibuya": "10tow%2C+11-6+Udagawacho%2C+Tokyo",
};

function makeLeg(fromId: string, toId: string, minutes: number, distance: string): FashionWalkingLeg {
  return {
    id: `walk-${fromId}-to-${toId}`,
    fromId,
    toId,
    minutes,
    distance,
    sourceUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodedDestinations[fromId]}&destination=${encodedDestinations[toId]}&travelmode=walking`,
    capturedAt: "2026-07-23",
    sourceSupports: "Google Maps displayed walking duration and distance for this store pair.",
    sourceDoesNotSupport: "The demo's dotted straight connector is not the pedestrian route geometry.",
    safeDownstreamUse: "public_demo",
  };
}

export const fashionWalkingLegs = [
  makeLeg("fashion-auralee-tokyo", "fashion-aton-aoyama", 13, "900 m"),
  makeLeg("fashion-auralee-tokyo", "fashion-mame-aoyama", 14, "1.0 km"),
  makeLeg("fashion-auralee-tokyo", "fashion-cfcl-omotesando", 19, "1.3 km"),
  makeLeg("fashion-auralee-tokyo", "fashion-shibuya-parco", 29, "2.0 km"),
  makeLeg("fashion-aton-aoyama", "fashion-mame-aoyama", 2, "120 m"),
  makeLeg("fashion-aton-aoyama", "fashion-cfcl-omotesando", 9, "650 m"),
  makeLeg("fashion-aton-aoyama", "fashion-shibuya-parco", 22, "1.5 km"),
  makeLeg("fashion-mame-aoyama", "fashion-cfcl-omotesando", 7, "500 m"),
  makeLeg("fashion-mame-aoyama", "fashion-shibuya-parco", 21, "1.5 km"),
  makeLeg("fashion-cfcl-omotesando", "fashion-shibuya-parco", 18, "1.2 km"),
  makeLeg("vintage-amore-omotesando", "vintage-qoo-omotesando", 2, "150 m"),
  makeLeg("vintage-qoo-omotesando", "vintage-ragtag-harajuku", 8, "650 m"),
  makeLeg("vintage-ragtag-harajuku", "vintage-paradise-jingumae", 3, "200 m"),
  makeLeg("vintage-paradise-jingumae", "vintage-kinji-harajuku", 4, "280 m"),
  makeLeg("vintage-kinji-harajuku", "vintage-10tow-shibuya", 18, "1.3 km"),
  makeLeg("fashion-mame-aoyama", "vintage-qoo-omotesando", 3, "190 m"),
  makeLeg("vintage-ragtag-harajuku", "vintage-10tow-shibuya", 14, "1.0 km"),
] satisfies FashionWalkingLeg[];

export function getFashionWalkingLeg(fromId: string, toId: string) {
  return fashionWalkingLegs.find((leg) => leg.fromId === fromId && leg.toId === toId);
}

export function buildFashionRouteMapsUrl(placeIds: string[]) {
  const destinations = placeIds
    .map((placeId) => encodedDestinations[placeId])
    .filter((destination): destination is string => Boolean(destination));

  if (destinations.length === 0) return "https://www.google.com/maps";
  if (destinations.length === 1) {
    return `https://www.google.com/maps/search/?api=1&query=${destinations[0]}`;
  }

  const [origin, ...remaining] = destinations;
  const destination = remaining[remaining.length - 1];
  const waypoints = remaining.slice(0, -1);
  const waypointQuery = waypoints.length ? `&waypoints=${waypoints.join("%7C")}` : "";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointQuery}&travelmode=walking`;
}

export const fashionFullRouteMapsUrl = buildFashionRouteMapsUrl([
  "fashion-auralee-tokyo",
  "fashion-aton-aoyama",
  "fashion-mame-aoyama",
  "fashion-cfcl-omotesando",
  "fashion-shibuya-parco",
]);
