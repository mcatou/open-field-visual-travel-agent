export type ShoppingMedia = {
  assetId: string; displayOrder: number; title: string; semanticLabel: string;
  sourceLabel: string; sourceUrl: string; localAssetRef?: string; priceJpy?: number;
  evidenceLevel: string; publicability: string;
};

export type ShoppingPrice = {
  status: string; currency: "JPY"; min?: number; max?: number; basis: string;
  capturedItemCount: number; inventoryScope: string;
};

export type SourceExhaustion = {
  exhausted: boolean; selectedImageCount: number; availableImageCount: number;
  hackathonThresholdMet: boolean; displayNote: string;
};

export type ReviewFlag = {
  flagId: string; severity: string; userFacingLabel: string; detail: string;
  blocksPublicApproval: boolean;
};

export type ShoppingFact = {
  value: string; sourceLabel: string; sourceUrl: string;
  sourceType: "official" | "editorial" | "directory"; capturedAt: string;
};

export type ShoppingDetails = {
  hours?: ShoppingFact;
  brands?: ShoppingFact & { items: string[] };
  priceNote?: string;
  shopperTip?: ShoppingFact;
};

export type DemoPlace = {
  placeId: string; regionId?: string; name: string; area: string; category: "vintage" | "luxury" | "pause" | "fixed" | "fabric" | "statement" | "stretch" | "multi_brand";
  latitude: number; longitude: number; preferenceScore: number;
  sourceType: "fixture" | "official" | "editorial" | "user_note";
  sourceUrl?: string; mapsUrl?: string; capturedAt: string;
  privacy: "public_demo" | "internal_only"; publicDemoAllowed: boolean; summary: string;
  price?: ShoppingPrice; sourceExhaustion?: SourceExhaustion; media?: ShoppingMedia[];
  details?: ShoppingDetails;
  provenance?: Record<string, unknown>; unresolvedReviewFlags?: ReviewFlag[];
};

const media = (brand: string, items: Array<[string, string, string, number?]>): ShoppingMedia[] => items.map(([title, image, page, priceJpy], index) => ({
  assetId: `${brand.toLowerCase()}-${index + 1}`, displayOrder: index + 1, title, semanticLabel: title,
  sourceLabel: `${brand} official online store`, sourceUrl: page,
  localAssetRef: image, priceJpy, evidenceLevel: "official_first_party", publicability: "protected_demo_reference",
}));

const fashionMedia = {
  auralee: media("AURALEE", [
    ["Washed Finx twill shirt", "https://auralee.jp/photo/2026AW/A26AS04TN/z-A26AS04TN_0003-1.jpg", "https://auralee.jp/item/detail/1_1_A26AS04TN_1/0003", 39600],
    ["Super Fine Wool high-gauge rib knit polo", "https://auralee.jp/photo/2026AW/A26AP02HW/z-A26AP02HW_8004-1.jpg", "https://auralee.jp/item/detail/1_1_A26AP02HW_1/8004", 36300],
    ["Sheer rib wide-neck long-sleeve tee", "https://auralee.jp/photo/2026AW/A26AP07HF/z-A26AP07HF_7010-1.jpg", "https://auralee.jp/item/detail/1_1_A26AP07HF_1/7010", 13200],
    ["Faded selvedge light denim pants", "https://auralee.jp/photo/2026SS/A26SP05DE/z-A26SP05DE_7020-1.jpg", "https://auralee.jp/item/detail/1_1_A26SP05DE_1/7020", 52800],
    ["High-gauge rib knit cropped cardigan", "https://auralee.jp/photo/2026SS/A00C04HR/z-A00C04HR_2029-1.jpg", "https://auralee.jp/item/detail/1_1_A00C04HR_1/2029", 39600],
  ]),
  aton: media("ATON", [
    ["Giza compact stripe standard shirt", "https://cdn.shopify.com/s/files/1/0254/3733/9714/files/20260615_aton_24_052.jpg?v=1782280172", "https://aton-tokyo.com/products/giza-compact-stripe-standard-shirt", 39600],
    ["Fresca nubuck oversized pullover", "https://cdn.shopify.com/s/files/1/0254/3733/9714/files/20260414_aton_95_002.jpg?v=1781177510", "https://aton-tokyo.com/products/fresca-nubuck-oversized-pullover", 19800],
    ["Fresca smooth oversized T-shirt", "https://cdn.shopify.com/s/files/1/0254/3733/9714/files/20260414_aton_91_029.jpg?v=1781963591", "https://aton-tokyo.com/products/fresca-smooth-oversized-t-shirt", 24200],
    ["Suvin 60/2 perfect-fit T-shirt", "https://cdn.shopify.com/s/files/1/0254/3733/9714/files/20260414_aton_97_010.jpg?v=1781318945", "https://aton-tokyo.com/products/suvin-60-2-perfect-fit-t-shirt", 13200],
    ["Shrink Fresca jersey sleeveless pullover", "https://cdn.shopify.com/s/files/1/0254/3733/9714/files/20260414_aton_81_033.jpg?v=1776771590", "https://aton-tokyo.com/products/shrink-fresca-jersey-sleeveless-pullover", 28600],
  ]),
  cfcl: media("CFCL", [
    ["Milan draped sleeveless dress", "https://cdn.shopify.com/s/files/1/0495/2489/9996/files/CF012KH054_LAVENDER-FOG_0159_c64060c6-4c69-426e-9304-ff4af1c264b7.jpg?v=1780700686", "https://cfcl.jp/products/vol12-0057", 99000],
    ["Milan draped strapless top", "https://cdn.shopify.com/s/files/1/0495/2489/9996/files/CF012KN017_LAVENDER-FOG_0125.jpg?v=1780700756", "https://cfcl.jp/products/vol12-0051", 59400],
    ["Milan collarless flare jacket", "https://cdn.shopify.com/s/files/1/0495/2489/9996/files/CF012KD151_LINEN-BEIGE_0468.jpg?v=1780701050", "https://cfcl.jp/products/vol12-0125", 99000],
    ["Hypha glitter sleeveless flare top", "https://cdn.shopify.com/s/files/1/0495/2489/9996/files/CF012KN057_BLACK-BLACK_0093_31877c1c-424e-4c87-972b-a08b49b7b639.jpg?v=1780701319", "https://cfcl.jp/products/vol12-0041", 44000],
    ["Pottery short bell-sleeve flare dress", "https://cdn.shopify.com/s/files/1/0495/2489/9996/files/CF012KH168_LAVENDER-FOG-MULTI_0170_3a9ee292-4130-4ea2-8c58-d43714df2673.jpg?v=1780701750", "https://cfcl.jp/products/vol12-0035", 68200],
  ]),
  mame: media("Mame Kurogouchi", [
    ["3D floral-motif knit cardigan", "https://cdn.shopify.com/s/files/1/0557/1271/0811/files/MM26SS-KN062BK-01.jpg?v=1771295589", "https://www.mamekurogouchi.com/products/mm26ss-kn062bk", 52800],
    ["3D floral-motif knit skirt", "https://cdn.shopify.com/s/files/1/0557/1271/0811/files/MM26SS-KN064BK-01.jpg?v=1771295595", "https://www.mamekurogouchi.com/products/mm26ss-kn064bk", 46200],
    ["Embroidered-buttonhole sleeveless dress", "https://cdn.shopify.com/s/files/1/0557/1271/0811/files/MM25FW-DR112BK-01.jpg?v=1760668033", "https://www.mamekurogouchi.com/products/mm25fw-dr112bk", 71500],
    ["Basic silk sleeveless dress", "https://cdn.shopify.com/s/files/1/0557/1271/0811/files/MK0408-DR035BK-01.jpg?v=1778721142", "https://www.mamekurogouchi.com/products/mk0408-dr035bk", 113300],
    ["Collarless raglan-sleeve jacket", "https://cdn.shopify.com/s/files/1/0557/1271/0811/files/MM26SS-JK018BE-01.jpg?v=1768955876", "https://www.mamekurogouchi.com/products/mm26ss-jk018be", 95700],
  ]),
  toga: media("TOGA", [
    ["Asymmetry tee and bra", "https://cdn.shopify.com/s/files/1/0082/1736/2485/files/TA261-JK051_02.jpg?v=1775033534", "https://store.toga.jp/products/ta261-jk051", 25740],
    ["Bright knit cardigan", "https://cdn.shopify.com/s/files/1/0082/1736/2485/files/TA261-XO036_03.jpg?v=1782968456", "https://store.toga.jp/products/ta261-xo036", 25740],
    ["Canvas bonding skirt", "https://cdn.shopify.com/s/files/1/0082/1736/2485/files/TA261-FG093_02_2986ec4a-5738-4661-aeb7-87b445dfeb2e.jpg?v=1782968674", "https://store.toga.jp/products/ta261-fg093", 41580],
    ["Flower-print dress", "https://cdn.shopify.com/s/files/1/0082/1736/2485/files/TA261-FH091_02.jpg?v=1768552535", "https://store.toga.jp/products/ta261-fh091", 72600],
    ["Fringe skirt", "https://cdn.shopify.com/s/files/1/0082/1736/2485/files/TP261-FG233_03.jpg?v=1762755050", "https://store.toga.jp/products/tp261-fg233", 34320],
  ]),
};

const sourcedMedia = (
  brand: string,
  sourceLabel: string,
  evidenceLevel: string,
  items: Array<[string, string, string, number?]>,
): ShoppingMedia[] => items.map(([title, image, page, priceJpy], index) => ({
  assetId: `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
  displayOrder: index + 1,
  title,
  semanticLabel: title,
  sourceLabel,
  sourceUrl: page,
  localAssetRef: image,
  priceJpy,
  evidenceLevel,
  publicability: "protected_demo_reference",
}));

const vintageMedia = {
  amore: sourcedMedia("AMORE", "AMORE official online store", "official_first_party", [
    ["Chanel 2005–06 gray tweed check handbag", "https://cdn.shopify.com/s/files/1/0268/4249/7096/files/168264-01_5ebe87b2-e007-400a-830c-43572c45fcfe.jpg?v=1784590806&width=900", "https://amorevintagejapan.com/products/168264", 368001],
    ["Chanel 2003–04 black lambskin shoulder bag", "https://cdn.shopify.com/s/files/1/0268/4249/7096/files/188195-01_0f6d027f-9813-49e7-9b18-dc46b9a99080.jpg?v=1784590609&width=900", "https://amorevintagejapan.com/products/188195", 398001],
    ["Chanel 1997–99 black caviar shoulder bag", "https://cdn.shopify.com/s/files/1/0268/4249/7096/files/197861-01_f8203c53-4116-4999-ab53-bf41654aa481.jpg?v=1784590598&width=900", "https://amorevintagejapan.com/products/197861", 398001],
    ["Chanel 2003–04 perforated caviar tote", "https://cdn.shopify.com/s/files/1/0268/4249/7096/files/197853-01_da81fb7a-b7c6-41bc-b5ca-5cff2d8af7c5.jpg?v=1784590516&width=900", "https://amorevintagejapan.com/products/197853", 268001],
    ["Chanel 1997–99 black lambskin half-flap bag", "https://cdn.shopify.com/s/files/1/0268/4249/7096/files/188196-01_b81ebfa5-c4bd-471b-8613-108d601fd9be.jpg?v=1784590528&width=900", "https://amorevintagejapan.com/products/188196", 458000],
  ]),
  qoo: sourcedMedia("QOO", "VINTAGE QOO TOKYO official online store", "official_first_party", [
    ["Ferragamo check-pattern shirt, size L", "https://qoo-online.com/cdn/shop/files/240802181545-1.jpg?v=1782096906&width=900", "https://qoo-online.com/en/collections/clothes/products/240802181545", 32780],
    ["Dior two-tone jacket, purple and black", "https://qoo-online.com/cdn/shop/files/240802202344-1.jpg?v=1784703767&width=900", "https://qoo-online.com/en/collections/clothes/products/240802202344", 87780],
    ["Dior checked double-breasted jacket, size M", "https://qoo-online.com/cdn/shop/files/240802202341-1.jpg?v=1783994965&width=900", "https://qoo-online.com/en/collections/clothes/products/240802202341", 76780],
    ["Chanel 2005 tweed button jacket, size 38", "https://qoo-online.com/cdn/shop/files/240802200923-2.jpg?v=1782796271&width=900", "https://qoo-online.com/en/collections/clothes/products/240802200923", 492800],
    ["Celine collarless double-breasted jacket, size 42", "https://qoo-online.com/cdn/shop/files/240802200229-2.jpg?v=1782796265&width=900", "https://qoo-online.com/en/collections/clothes/products/240802200229", 87780],
  ]),
  ragtag: sourcedMedia("RAGTAG", "RAGTAG official current inventory", "official_first_party", [
    ["HYKE T-shirt, approximately size S", "https://www.ragtag.jp/img/item/03518/0351826E0137/0351826E0137_m1_a001.jpg", "https://www.ragtag.jp/brand/03518/item/0351826E0137", 3800],
    ["HYKE T-shirt, size S", "https://www.ragtag.jp/img/item/03518/0351826L0061/0351826L0061_m1_a001.jpg", "https://www.ragtag.jp/brand/03518/item/0351826L0061", 8800],
    ["sacai T-shirt, size M", "https://www.ragtag.jp/img/item/03579/0357926L0113/0357926L0113_m1_a001.jpg", "https://www.ragtag.jp/brand/03579/item/0357926L0113", 13600],
    ["Comme des Garçons T-shirt, approximately size L", "https://www.ragtag.jp/img/item/20055/2005526L0219/2005526L0219_m1_a001.jpg", "https://www.ragtag.jp/brand/20055/item/2005526L0219", 7200],
    ["HYKE casual shirt, size S", "https://www.ragtag.jp/img/item/03518/0351826L0060/0351826L0060_m1_a001.jpg", "https://www.ragtag.jp/brand/03518/item/0351826L0060", 15000],
  ]),
  kinji: sourcedMedia("KINJI", "KINJI Harajuku official store page", "official_first_party", [
    ["KINJI Harajuku store", "https://kinji.jp/img/image8.png", "https://kinji.jp/kinji_harajuku.html"],
    ["KINJI men's floor", "https://kinji.jp/img/image35.png", "https://kinji.jp/kinji_harajuku.html"],
    ["KINJI women's floor", "https://kinji.jp/img/image36.png", "https://kinji.jp/kinji_harajuku.html"],
  ]),
  paradise: sourcedMedia("Paradise", "Paradise Vintage official online store", "official_first_party", [
    ["Loewe Velazquez green 2-way bag", "https://paradisevintagetokyo.com/cdn/shop/files/DSC0141_625d0946-2a1b-4b71-972c-65c45d640745.jpg?v=1781574711&width=900", "https://paradisevintagetokyo.com/en/products/%E3%83%AD%E3%82%A8%E3%83%99-%E3%83%99%E3%83%A9%E3%82%B9%E3%82%B1%E3%82%B9-2way%E3%83%8F%E3%83%B3%E3%83%89%E3%83%90%E3%83%83%E3%82%B0-%E3%83%AC%E3%82%B6%E3%83%BC-%E3%82%B0%E3%83%AA%E3%83%BC%E3%83%B3-%E3%82%B4%E3%83%BC%E3%83%AB%E3%83%89%E9%87%91%E5%85%B7", 138000],
    ["Prada dark-brown turn-lock shoulder bag", "https://paradisevintagetokyo.com/cdn/shop/files/DSC0193_4feefadc-925b-478f-9423-351b441b260d.jpg?v=1781574327&width=900", "https://paradisevintagetokyo.com/en/products/%E3%83%97%E3%83%A9%E3%83%80-%E3%82%BF%E3%83%BC%E3%83%B3%E3%83%AD%E3%83%83%E3%82%AF-%E3%82%B7%E3%83%A7%E3%83%AB%E3%83%80%E3%83%BC%E3%83%90%E3%83%83%E3%82%B0-%E3%83%AC%E3%82%B6%E3%83%BC-%E3%83%80%E3%83%BC%E3%82%AF%E3%83%96%E3%83%A9%E3%82%A6%E3%83%B3-%E3%82%B7%E3%83%AB%E3%83%90%E3%83%BC%E9%87%91%E5%85%B7", 128000],
    ["Chanel black lambskin maxi flap bag", "https://paradisevintagetokyo.com/cdn/shop/files/DSC0001_ef8343b6-ce90-4948-b85d-2677f54e43c8.jpg?v=1781320725&width=900", "https://paradisevintagetokyo.com/en/collections/chanel", 898000],
    ["Chanel black caviar Boston bag", "https://paradisevintagetokyo.com/cdn/shop/files/DSC0016_779ad742-7b74-4cf6-bde5-1726df647e20.jpg?v=1781319220&width=900", "https://paradisevintagetokyo.com/en/collections/chanel", 568000],
    ["Chanel brown caviar chain shoulder bag", "https://paradisevintagetokyo.com/cdn/shop/files/DSC0072_60cc767d-baa0-432a-879a-593b68e46a21.jpg?v=1781315202&width=900", "https://paradisevintagetokyo.com/en/collections/chanel", 598000],
  ]),
  tenTow: sourcedMedia("10tow", "Who What Wear Tokyo vintage guide", "editorial_observation", [
    ["Comme des Garçons top photographed at 10tow", "https://cdn.mos.cms.futurecdn.net/V5BjrNiPJBsGxf4qRT22VQ.jpg", "https://www.whowhatwear.com/living/travel/best-vintage-shopping-tokyo"],
  ]),
};

const fact = (
  value: string,
  sourceLabel: string,
  sourceUrl: string,
  sourceType: ShoppingFact["sourceType"],
): ShoppingFact => ({ value, sourceLabel, sourceUrl, sourceType, capturedAt: "2026-07-23T00:00:00.000Z" });

const vintageDetails = {
  amore: {
    hours: fact("10:00–21:00", "AMORE official store page", "https://amorevintagejapan.com/en-au/pages/store-locations", "official"),
    brands: { ...fact("Chanel-focused at this branch", "AMORE official store page", "https://amorevintagejapan.com/en-au/pages/store-locations", "official"), items: ["Chanel bags", "jewelry", "accessories", "watches"] },
    priceNote: "Recent official online examples shown here: ¥268,001–¥458,000. Store inventory can differ.",
    shopperTip: fact("Use this as the investment-level Chanel stop; the editorial guide emphasizes its large, polished archive.", "Who What Wear Tokyo vintage guide", "https://www.whowhatwear.com/living/travel/best-vintage-shopping-tokyo", "editorial"),
  },
  qoo: {
    hours: fact("11:30–20:00", "QOO official Omotesando page", "https://qoo-online.com/en/pages/qoo-omotesando-1f2f", "official"),
    brands: { ...fact("Floor guide", "QOO official Omotesando page", "https://qoo-online.com/en/pages/qoo-omotesando-1f2f", "official"), items: ["Chanel", "Hermès", "Louis Vuitton", "Celine", "Dior", "Loewe", "Prada"] },
    priceNote: "Recent official clothing examples shown here: ¥32,780–¥492,800. Check stock before going.",
    shopperTip: fact("Good for comparing luxury ready-to-wear and bags in one large store; expect curated rather than bargain pricing.", "Who What Wear Tokyo vintage guide", "https://www.whowhatwear.com/living/travel/best-vintage-shopping-tokyo", "editorial"),
  },
  ragtag: {
    hours: fact("11:00–20:00", "RAGTAG official Harajuku page", "https://www.ragtag.jp/english/harajuku.html", "official"),
    brands: { ...fact("Women's floor guide", "RAGTAG official Harajuku page", "https://www.ragtag.jp/english/harajuku.html", "official"), items: ["sacai", "HYKE", "Mame Kurogouchi", "AURALEE", "Comme des Garçons", "Yohji Yamamoto", "Maison Margiela", "MARNI"] },
    priceNote: "Recent official examples shown here: ¥3,800–¥15,000. Condition and branch stock vary by item.",
    shopperTip: fact("Best broad-price comparison stop: the editorial guide highlights its organized selection and wider price spread.", "Who What Wear Tokyo vintage guide", "https://www.whowhatwear.com/living/travel/best-vintage-shopping-tokyo", "editorial"),
  },
  kinji: {
    hours: fact("11:00–20:00", "KINJI official Harajuku page", "https://kinji.jp/kinji_harajuku.html", "official"),
    brands: { ...fact("Store-format description", "KINJI official Harajuku page", "https://kinji.jp/kinji_harajuku.html", "official"), items: ["men's used clothing", "women's used clothing", "accessories", "antiques and art"] },
    priceNote: "No stable item-level online price list was captured; browse in person and confirm condition.",
    shopperTip: fact("Use this for the high-volume treasure-hunt part of the route, not for one guaranteed label.", "Store-format inference from official KINJI page", "https://kinji.jp/kinji_harajuku.html", "editorial"),
  },
  paradise: {
    hours: fact("12:00–19:00; official pages conflict, so recheck the same day", "Paradise official English about page", "https://paradisevintagetokyo.com/en/pages/about-us", "official"),
    brands: { ...fact("Recent official inventory", "Paradise official online store", "https://paradisevintagetokyo.com/en/collections/all-bags", "official"), items: ["Chanel", "Hermès", "Loewe", "Prada"] },
    priceNote: "Recent official examples shown here: ¥128,000–¥898,000. The official Japanese and English pages currently disagree on address/hours.",
    shopperTip: fact("Useful for a more colorful luxury-bag edit; verify the current address because the store's own language pages disagree.", "Who What Wear guide plus official-page cross-check", "https://www.whowhatwear.com/living/travel/best-vintage-shopping-tokyo", "editorial"),
  },
  tenTow: {
    hours: fact("13:00–20:00; verify before going", "Apple Maps business listing", "https://maps.apple.com/place?place-id=I374F514A1FA496EF", "directory"),
    brands: { ...fact("Editorial observation, not a live stock list", "Who What Wear Tokyo vintage guide", "https://www.whowhatwear.com/living/travel/best-vintage-shopping-tokyo", "editorial"), items: ["Comme des Garçons", "Junya Watanabe", "Yohji Yamamoto"] },
    priceNote: "No stable official online price list was captured. Treat this as an archive-browse stop.",
    shopperTip: fact("Use 10tow for archival Japanese designers at the Shibuya end of the day.", "Who What Wear Tokyo vintage guide", "https://www.whowhatwear.com/living/travel/best-vintage-shopping-tokyo", "editorial"),
  },
} satisfies Record<string, ShoppingDetails>;

// Synthetic, privacy-safe rows. Names deliberately describe route roles, not real businesses.
export const demoPlaces: DemoPlace[] = [
  { placeId: "fixture-shimokitazawa-vintage", name: "Shimokitazawa vintage edit", area: "Shimokitazawa", category: "vintage", latitude: 35.6615, longitude: 139.668, preferenceScore: 0.93, sourceType: "fixture", capturedAt: "2026-07-21T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Fixture for an independent-vintage chapter." },
  { placeId: "fixture-daikanyama-design", name: "Daikanyama design pause", area: "Daikanyama", category: "pause", latitude: 35.6481, longitude: 139.7032, preferenceScore: 0.84, sourceType: "fixture", capturedAt: "2026-07-21T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Fixture for lunch and neighborhood texture." },
  { placeId: "fixture-aoyama-luxury", name: "Aoyama luxury edit", area: "Aoyama", category: "luxury", latitude: 35.6652, longitude: 139.7125, preferenceScore: 0.88, sourceType: "fixture", capturedAt: "2026-07-21T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Fixture for a compact flagship chapter." },
  { placeId: "fixture-omotesando-dinner", name: "Omotesando dinner anchor", area: "Omotesando", category: "fixed", latitude: 35.6654, longitude: 139.712, preferenceScore: 1, sourceType: "fixture", capturedAt: "2026-07-21T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Synthetic hard constraint; venue unresolved." },
  { placeId: "fashion-auralee-tokyo", regionId: "tokyo-fashion", name: "AURALEE TOKYO", area: "Minami-Aoyama", category: "fabric", latitude: 35.6611583, longitude: 139.7164106, preferenceScore: 0.98, sourceType: "official", sourceUrl: "https://auralee.jp/store", mapsUrl: "https://www.google.com/maps/search/?api=1&query=AURALEE+TOKYO%2C+6-3-2+Minami-Aoyama%2C+Tokyo", capturedAt: "2026-07-22T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Try relaxed shirts and light layers first. Check shoulder and armhole comfort; the label alone cannot confirm fit.", media: fashionMedia.auralee },
  { placeId: "fashion-aton-aoyama", regionId: "tokyo-fashion", name: "ATON AOYAMA", area: "Kita-Aoyama", category: "fabric", latitude: 35.6647671, longitude: 139.7111198, preferenceScore: 0.96, sourceType: "official", sourceUrl: "https://aton-tokyo.com/en/pages/store-stockist", mapsUrl: "https://www.google.com/maps/search/?api=1&query=ATON+AOYAMA%2C+3-6-27+Kita-Aoyama%2C+Tokyo", capturedAt: "2026-07-22T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Look for relaxed shirts, oversized T-shirts and clean jersey layers. Current catalog examples list brand sizes S and M; check stock and fit in store.", media: fashionMedia.aton },
  { placeId: "fashion-mame-aoyama", regionId: "tokyo-fashion", name: "Mame Kurogouchi Aoyama", area: "Kita-Aoyama", category: "statement", latitude: 35.6653842, longitude: 139.7104318, preferenceScore: 0.94, sourceType: "official", sourceUrl: "https://www.mamekurogouchi.com/en/pages/store", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Mame+Kurogouchi+Aoyama%2C+3-8-3+Kita-Aoyama%2C+Tokyo", capturedAt: "2026-07-22T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Use this stop for a cardigan, jacket or dress with a clear design detail. Current catalog examples list brand sizes 1 and 2; try before relying on a conversion.", media: fashionMedia.mame },
  { placeId: "fashion-cfcl-omotesando", regionId: "tokyo-fashion", name: "CFCL OMOTESANDO", area: "Omotesando", category: "stretch", latitude: 35.6673861, longitude: 139.7069111, preferenceScore: 0.93, sourceType: "official", sourceUrl: "https://cfcl.jp/en/pages/directstores", mapsUrl: "https://www.google.com/maps/search/?api=1&query=CFCL+OMOTESANDO%2C+GYRE+3F%2C+5-10-1+Jingumae%2C+Tokyo", capturedAt: "2026-07-22T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Try the knitted tops, jackets and dresses for movement and comfort. CFCL uses its own size labels, so compare measurements and try in store.", media: fashionMedia.cfcl },
  { placeId: "fashion-shibuya-parco", regionId: "tokyo-fashion", name: "TOGA at Shibuya PARCO", area: "Shibuya", category: "multi_brand", latitude: 35.661999, longitude: 139.6989521, preferenceScore: 0.88, sourceType: "official", sourceUrl: "https://shibuya.parco.jp/shop/detail/?cd=025717", mapsUrl: "https://www.google.com/maps/search/?api=1&query=TOGA%2C+Shibuya+PARCO%2C+15-1+Udagawacho%2C+Tokyo", capturedAt: "2026-07-22T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Finish with one specific TOGA stop rather than a general mall scan. Compare tees, cardigans, skirts and dresses; confirm current store stock.", media: fashionMedia.toga },
  { placeId: "vintage-amore-omotesando", regionId: "tokyo-vintage", name: "AMORE Vintage Omotesando", area: "Jingumae", category: "luxury", latitude: 35.665626, longitude: 139.7094897, preferenceScore: 0.95, sourceType: "official", sourceUrl: "https://amorevintagejapan.com/en-au/pages/store-locations", mapsUrl: "https://www.google.com/maps/search/?api=1&query=AMORE+Vintage+Omotesando%2C+5-1-15+Jingumae%2C+Tokyo", capturedAt: "2026-07-23T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "A focused Chanel stop for bags, jewelry and accessories. Use the linked current examples to decide whether the price level is worth the stop.", price: { status: "sampled_current_online", currency: "JPY", min: 268001, max: 458000, basis: "Five current official online examples", capturedItemCount: 5, inventoryScope: "Online examples; not a promise of branch stock" }, media: vintageMedia.amore, details: vintageDetails.amore },
  { placeId: "vintage-qoo-omotesando", regionId: "tokyo-vintage", name: "VINTAGE QOO TOKYO", area: "Omotesando", category: "luxury", latitude: 35.6658918, longitude: 139.7095161, preferenceScore: 0.98, sourceType: "official", sourceUrl: "https://qoo-online.com/en/pages/qoo-omotesando-1f2f", mapsUrl: "https://www.google.com/maps/search/?api=1&query=VINTAGE+QOO+TOKYO%2C+5-2-6+Jingumae%2C+Tokyo", capturedAt: "2026-07-23T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Start here if you want ready-to-wear and bags across several luxury labels in one building. The item cards show the spread from easier clothing buys to expensive Chanel.", price: { status: "sampled_current_online", currency: "JPY", min: 32780, max: 492800, basis: "Five current official clothing examples", capturedItemCount: 5, inventoryScope: "Online examples; confirm store-floor stock" }, media: vintageMedia.qoo, details: vintageDetails.qoo },
  { placeId: "vintage-ragtag-harajuku", regionId: "tokyo-vintage", name: "RAGTAG Harajuku", area: "Jingumae", category: "vintage", latitude: 35.6657568, longitude: 139.7052181, preferenceScore: 0.97, sourceType: "official", sourceUrl: "https://www.ragtag.jp/english/harajuku.html", mapsUrl: "https://www.google.com/maps/search/?api=1&query=RAGTAG+Harajuku%2C+5-17-9+Jingumae%2C+Tokyo", capturedAt: "2026-07-23T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "The broad-price comparison stop. Filter by size, condition and label; current examples range from low-thousands basics to designer pieces.", price: { status: "sampled_current_online", currency: "JPY", min: 3800, max: 15000, basis: "Five current official online examples", capturedItemCount: 5, inventoryScope: "Examples from RAGTAG online inventory; branch stock varies" }, media: vintageMedia.ragtag, details: vintageDetails.ragtag },
  { placeId: "vintage-paradise-jingumae", regionId: "tokyo-vintage", name: "Paradise Vintage", area: "Jingumae", category: "luxury", latitude: 35.6672339, longitude: 139.7057777, preferenceScore: 0.85, sourceType: "official", sourceUrl: "https://paradisevintagetokyo.com/en/pages/about-us", mapsUrl: "https://www.google.com/maps/search/?api=1&query=Paradise+Vintage%2C+3-27-4+Jingumae%2C+Tokyo", capturedAt: "2026-07-23T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "A compact luxury-bag stop with stronger color and statement options. Recheck the address and hours: the store's current official language pages disagree.", price: { status: "sampled_current_online", currency: "JPY", min: 128000, max: 898000, basis: "Five current official bag examples", capturedItemCount: 5, inventoryScope: "Online examples; branch stock changes" }, media: vintageMedia.paradise, details: vintageDetails.paradise, unresolvedReviewFlags: [{ flagId: "paradise-address-conflict", severity: "warning", userFacingLabel: "Verify address", detail: "Official Japanese and English pages show different addresses and hours.", blocksPublicApproval: false }] },
  { placeId: "vintage-kinji-harajuku", regionId: "tokyo-vintage", name: "KINJI Harajuku", area: "Harajuku", category: "vintage", latitude: 35.6690562, longitude: 139.7060816, preferenceScore: 0.9, sourceType: "official", sourceUrl: "https://kinji.jp/kinji_harajuku.html", mapsUrl: "https://www.google.com/maps/search/?api=1&query=KINJI+Harajuku%2C+4-31-10+Jingumae%2C+Tokyo", capturedAt: "2026-07-23T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Use this for browsing volume rather than a guaranteed designer hit. The official page covers men's, women's and accessories, but does not publish a stable item-price feed.", price: { status: "unresolved", currency: "JPY", basis: "No stable official online item list captured", capturedItemCount: 0, inventoryScope: "In-store browsing only" }, media: vintageMedia.kinji, details: vintageDetails.kinji },
  { placeId: "vintage-10tow-shibuya", regionId: "tokyo-vintage", name: "10tow", area: "Udagawacho", category: "vintage", latitude: 35.6623354, longitude: 139.6974593, preferenceScore: 0.88, sourceType: "official", sourceUrl: "https://www.instagram.com/10tow_/", mapsUrl: "https://www.google.com/maps/search/?api=1&query=10tow%2C+11-6+Udagawacho%2C+Tokyo", capturedAt: "2026-07-23T00:00:00.000Z", privacy: "public_demo", publicDemoAllowed: true, summary: "Finish here for archival Japanese designers. No stable official catalog or price list was captured, so this is a browse stop rather than a promised item hunt.", price: { status: "unresolved", currency: "JPY", basis: "No stable official online catalog captured", capturedItemCount: 0, inventoryScope: "Editorially described browse stop" }, media: vintageMedia.tenTow, details: vintageDetails.tenTow },
];
