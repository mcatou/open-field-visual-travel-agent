export type HotelId = "bourou" | "hikari";
export type FollowUpMode = "balanced" | "rainproof" | "private";

export type HotelPhoto = {
  label: string;
  src: string;
  sourceUrl: string;
};

export type Hotel = {
  id: HotelId;
  name: string;
  shortName: string;
  branchLabel: string;
  branchTitle: string;
  latitude: number;
  longitude: number;
  mapX: number;
  mapY: number;
  officialUrl: string;
  publicFacts: string[];
  unresolved: string[];
  photos: HotelPhoto[];
};

export type DemoState = {
  mode: FollowUpMode;
  selectedHotelId: HotelId;
  activeImage: number;
  provenanceOpen: boolean;
};

export type DemoAction =
  | { type: "selectHotel"; hotelId: HotelId }
  | { type: "applyFollowUp"; mode: Exclude<FollowUpMode, "balanced"> }
  | { type: "nextImage"; direction: -1 | 1 }
  | { type: "toggleProvenance" }
  | { type: "reset" };

export const HOTELS: readonly Hotel[] = [
  {
    id: "bourou",
    name: "Bourou Lake Toya",
    shortName: "Bourou",
    branchLabel: "Private recovery",
    branchTitle: "Keep the weather outside the room",
    latitude: 42.566,
    longitude: 140.816,
    mapX: 38,
    mapY: 57,
    officialUrl: "https://www.bourou-toya.com/room/",
    publicFacts: [
      "Premium suite material shows a private sauna, open-air bath and cold bath.",
      "The room itself is the weather backup: the spa sequence does not depend on a clear lake day.",
      "Best fit when privacy matters more than a full resort programme.",
    ],
    unresolved: [
      "Public demo does not claim live availability, price, meals or cooling details.",
      "Room-level terms need a fresh official check before booking.",
    ],
    photos: [
      {
        label: "Lake-facing atmosphere",
        src: "https://www.bourou-toya.com/wp/wp-content/themes/bouroutoya/assets/img/top/awai_sub.jpg",
        sourceUrl: "https://www.bourou-toya.com/",
      },
      {
        label: "Lake setting",
        src: "https://www.bourou-toya.com/wp/wp-content/themes/bouroutoya/assets/img/top/sea_main.jpg",
        sourceUrl: "https://www.bourou-toya.com/",
      },
      {
        label: "Interior design context",
        src: "https://www.bourou-toya.com/wp/wp-content/themes/bouroutoya/assets/img/top/sea_sub.jpg",
        sourceUrl: "https://www.bourou-toya.com/",
      },
    ],
  },
  {
    id: "hikari",
    name: "Lake Toya Tsuruga Resort Hikari no uta",
    shortName: "Hikari no uta",
    branchLabel: "Resort backup",
    branchTitle: "Let the property carry a wet day",
    latitude: 42.554,
    longitude: 140.864,
    mapX: 66,
    mapY: 66,
    officialUrl: "https://www.hikarino-uta.com/en/hotspring/",
    publicFacts: [
      "Official material shows gender-separated communal baths with open-air bath, auto-löyly sauna and cold bath.",
      "A broader resort and dining programme gives a wet day more indoor structure.",
      "Best fit when shared facilities and meals are useful rather than a compromise.",
    ],
    unresolved: [
      "A private open-air bath depends on the exact room type.",
      "Public demo does not claim live availability, price or current review status.",
    ],
    photos: [
      {
        label: "Onsen setting",
        src: "https://www.hikarino-uta.com/en/hotspring/images/img_main.webp",
        sourceUrl: "https://www.hikarino-uta.com/en/hotspring/",
      },
      {
        label: "Communal bath",
        src: "https://www.hikarino-uta.com/en/hotspring/images/img_public1.webp",
        sourceUrl: "https://www.hikarino-uta.com/en/hotspring/",
      },
      {
        label: "Open-air bath",
        src: "https://www.hikarino-uta.com/en/hotspring/images/img_open1.webp",
        sourceUrl: "https://www.hikarino-uta.com/en/hotspring/",
      },
    ],
  },
] as const;

export const MODE_COPY: Record<
  FollowUpMode,
  {
    label: string;
    verdict: string;
    recommendation: HotelId;
    reasons: Record<HotelId, string>;
  }
> = {
  balanced: {
    label: "Balanced answer",
    verdict:
      "Choose the kind of bad-weather day you want: private spa time at Bourou, or a fuller resort day at Hikari no uta.",
    recommendation: "bourou",
    reasons: {
      bourou: "Stronger private spa fit",
      hikari: "Stronger resort and dining backup",
    },
  },
  rainproof: {
    label: "Rain is the priority",
    verdict:
      "Hikari no uta becomes the safer all-day branch: shared baths, sauna and dining create more structure without relying on the view.",
    recommendation: "hikari",
    reasons: {
      bourou: "Excellent room-level recovery",
      hikari: "Most complete indoor day",
    },
  },
  private: {
    label: "Private sauna first",
    verdict:
      "Bourou is the clearer branch when private sauna and bath time matter more than dinner or shared resort facilities.",
    recommendation: "bourou",
    reasons: {
      bourou: "Private sauna, bath and cold bath",
      hikari: "Shared spa; room bath varies",
    },
  },
};

export const INITIAL_STATE: DemoState = {
  mode: "balanced",
  selectedHotelId: "bourou",
  activeImage: 0,
  provenanceOpen: false,
};

export function getHotel(hotelId: HotelId): Hotel {
  return HOTELS.find((hotel) => hotel.id === hotelId) ?? HOTELS[0];
}
export function hotelWeatherReducer(
  state: DemoState,
  action: DemoAction,
): DemoState {
  switch (action.type) {
    case "selectHotel":
      return {
        ...state,
        selectedHotelId: action.hotelId,
        activeImage: 0,
      };
    case "applyFollowUp":
      return {
        ...state,
        mode: action.mode,
      };
    case "nextImage": {
      const photoCount = getHotel(state.selectedHotelId).photos.length;
      return {
        ...state,
        activeImage:
          (state.activeImage + action.direction + photoCount) % photoCount,
      };
    }
    case "toggleProvenance":
      return {
        ...state,
        provenanceOpen: !state.provenanceOpen,
      };
    case "reset":
      return INITIAL_STATE;
  }
}
