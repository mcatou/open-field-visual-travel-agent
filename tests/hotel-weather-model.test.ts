import assert from "node:assert/strict";
import test from "node:test";

import {
  INITIAL_STATE,
  MODE_COPY,
  hotelWeatherReducer,
} from "../app/hotel-weather/model";

test("rain follow-up changes the recommendation without resetting open context", () => {
  const selected = hotelWeatherReducer(INITIAL_STATE, {
    type: "selectHotel",
    hotelId: "hikari",
  });
  const advanced = hotelWeatherReducer(selected, {
    type: "nextImage",
    direction: 1,
  });
  const patched = hotelWeatherReducer(advanced, {
    type: "applyFollowUp",
    mode: "rainproof",
  });

  assert.equal(MODE_COPY[patched.mode].recommendation, "hikari");
  assert.equal(patched.selectedHotelId, "hikari");
  assert.equal(patched.activeImage, 1);
});

test("private-sauna follow-up recommends the private branch", () => {
  const patched = hotelWeatherReducer(INITIAL_STATE, {
    type: "applyFollowUp",
    mode: "private",
  });

  assert.equal(MODE_COPY[patched.mode].recommendation, "bourou");
  assert.match(MODE_COPY[patched.mode].verdict, /private sauna/i);
});

test("carousel navigation wraps within the selected hotel's public references", () => {
  const previous = hotelWeatherReducer(INITIAL_STATE, {
    type: "nextImage",
    direction: -1,
  });

  assert.equal(previous.activeImage, 2);
});
