const routeOrders = {
  "vintage-first": [
    "fashion-auralee-tokyo",
    "fashion-aton-aoyama",
    "fashion-mame-aoyama",
    "fashion-cfcl-omotesando",
    "fashion-shibuya-parco",
  ],
  "luxury-first": [
    "fashion-mame-aoyama",
    "fashion-cfcl-omotesando",
    "fashion-shibuya-parco",
  ],
  "short-route": [
    "fashion-aton-aoyama",
    "fashion-mame-aoyama",
    "fashion-cfcl-omotesando",
  ],
} as const;

export function fashionRouteOrder(branchId: keyof typeof routeOrders, availablePlaceIds: string[]) {
  const available = new Set(availablePlaceIds);
  return routeOrders[branchId].filter((placeId) => available.has(placeId));
}
