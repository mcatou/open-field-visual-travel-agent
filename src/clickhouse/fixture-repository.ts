import { demoPlaces } from "../data/demo-places";
import type { ShoppingRepository } from "../runtime/compose-shopping-route";

export const fixtureShoppingRepository: ShoppingRepository = {
  async findShoppingPlaces() { return { rows: demoPlaces, queryId: "fixture-query-shopping-tokyo", durationMs: 0 }; },
};
