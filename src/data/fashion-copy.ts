export const FASHION_PRIMARY_ROUTE_COPY = {
  label: "Relaxed shirts and layers first",
  summary: "AURALEE and ATON first, then Mame, CFCL or TOGA.",
  verdict: "Start with AURALEE or ATON for relaxed layers, then add one standout piece.",
} as const;

const FASHION_MATERIAL_NOTES: Readonly<Record<string, string>> = {
  "fashion-auralee-tokyo":
    "Selected items include Washed Finx twill, Super Fine Wool, sheer rib knit and selvedge denim.",
  "fashion-aton-aoyama":
    "Selected items include Giza Compact cotton, Suvin 60/2 cotton and several Fresca jersey treatments.",
  "fashion-mame-aoyama":
    "Selected items include 3D floral knits, embroidery and a silk dress.",
  "fashion-cfcl-omotesando":
    "Selected items include draped Milan knits, Hypha glitter knit and sculptural Pottery shapes.",
  "fashion-shibuya-parco":
    "Selected items include bonded canvas, bright knit, fringe and layered pieces.",
};

export function fashionMaterialNoteFor(placeId: string): string | undefined {
  return FASHION_MATERIAL_NOTES[placeId];
}
