import {
  GINZA_STORES,
  GRAND_SEIKO_MODEL,
  type GinzaStore,
} from "./seiko-transit-flow";

export type VisualSectionRole =
  | "answer"
  | "comparison"
  | "evidence"
  | "route"
  | "contingency";

export type VisualSectionCandidate = {
  id: string;
  role: VisualSectionRole;
  userRelevance: number;
  actionability: number;
  evidence: number;
  urgency: number;
  complexity: number;
  optional?: boolean;
};

const roleWeight: Record<VisualSectionRole, number> = {
  answer: 10,
  comparison: 6,
  evidence: 4,
  route: 2,
  contingency: 0,
};

function bounded(value: number) {
  return Math.max(0, Math.min(5, value));
}

export function visualPriorityScore(section: VisualSectionCandidate) {
  return (
    bounded(section.userRelevance) * 4
    + bounded(section.actionability) * 3
    + bounded(section.evidence) * 2
    + bounded(section.urgency)
    + roleWeight[section.role]
    - bounded(section.complexity)
    - (section.optional ? 8 : 0)
  );
}

export function rankVisualSections<T extends VisualSectionCandidate>(sections: T[]) {
  return sections
    .map((section, index) => ({ section, index, score: visualPriorityScore(section) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ section }) => section);
}

export type WatchBenefit = {
  storeId: string;
  eyebrow: string;
  headline: string;
  body: string;
  sourceUrl: string;
};

export type WatchStoreCard = {
  id: GinzaStore["id"];
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
  storeUrl: string;
  mapsUrl: string;
};

export function buildWatchExperience() {
  const mitsukoshi = GINZA_STORES.find((store) => store.id === "mitsukoshi");
  const wako = GINZA_STORES.find((store) => store.id === "wako");
  if (!mitsukoshi?.benefitSourceUrl || !wako?.benefitSourceUrl) {
    throw new Error("Watch experience requires sourced Mitsukoshi and Wako benefit claims.");
  }

  const sections = rankVisualSections([
    {
      id: "model",
      role: "evidence",
      userRelevance: 5,
      actionability: 2,
      evidence: 5,
      urgency: 1,
      complexity: 1,
    },
    {
      id: "visitor-savings",
      role: "answer",
      userRelevance: 5,
      actionability: 5,
      evidence: 4,
      urgency: 3,
      complexity: 1,
    },
    {
      id: "store-search",
      role: "comparison",
      userRelevance: 5,
      actionability: 4,
      evidence: 5,
      urgency: 2,
      complexity: 2,
    },
    {
      id: "tokyo-station-route",
      role: "route",
      userRelevance: 2,
      actionability: 3,
      evidence: 4,
      urgency: 1,
      complexity: 3,
      optional: true,
    },
    {
      id: "airport-contingency",
      role: "contingency",
      userRelevance: 1,
      actionability: 2,
      evidence: 4,
      urgency: 1,
      complexity: 4,
      optional: true,
    },
  ]);

  const primaryBenefit: WatchBenefit = {
    storeId: mitsukoshi.id,
    eyebrow: "BEST PUBLISHED VISITOR OFFER",
    headline: "5% visitor app coupon",
    body: "Eligible visitors can activate the Mitsukoshi Isetan coupon. Some brands and items are excluded, so confirm that Grand Seiko qualifies before purchase.",
    sourceUrl: mitsukoshi.benefitSourceUrl,
  };

  const secondaryBenefit: WatchBenefit = {
    storeId: wako.id,
    eyebrow: "USEFUL LATER, NOT TODAY",
    headline: "Wako points start at 1%",
    body: "Eligible points post the next day, so they do not reduce this purchase.",
    sourceUrl: wako.benefitSourceUrl,
  };

  const storeCards: WatchStoreCard[] = GINZA_STORES.map((store) => ({
    id: store.id,
    name: store.name,
    shortName: store.shortName,
    hours: store.hours,
    walkMinutes: store.walkMinutes,
    telephone: store.telephone,
    benefit: store.benefit,
    benefitSourceUrl: store.benefitSourceUrl,
    stockNote: store.stockNote,
    imagePath: store.imagePath,
    imageAlt: store.imageAlt,
    storeUrl: store.sourceUrl,
    mapsUrl: store.mapsUrl,
  }));

  return {
    model: GRAND_SEIKO_MODEL,
    sections,
    primaryBenefit,
    secondaryBenefit,
    availability: {
      headline: "Six possible Ginza stores",
      body: "Grand Seiko does not publish branch stock for SBGH343. Use the phone action to confirm the exact reference before walking.",
    },
    storeCards,
    transport: {
      label: "Add route to Tokyo Station",
      description: "Compare walking, Tokyo Metro and JR only when the onward trip matters.",
      defaultOpen: false,
    },
    airport: {
      label: "Continue to luggage and Narita",
      description: "Keep the airport handoff separate until storage location and flight time are known.",
      defaultOpen: false,
    },
  } as const;
}
