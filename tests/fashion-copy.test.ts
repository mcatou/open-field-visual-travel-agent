import assert from "node:assert/strict";
import test from "node:test";
import {
  FASHION_PRIMARY_ROUTE_COPY,
  fashionMaterialNoteFor,
} from "../src/data/fashion-copy";

test("fashion route copy explains the actual store sequence in plain language", () => {
  assert.equal(
    FASHION_PRIMARY_ROUTE_COPY.verdict,
    "Start with AURALEE or ATON for relaxed layers, then add one standout piece.",
  );
  assert.doesNotMatch(
    JSON.stringify(FASHION_PRIMARY_ROUTE_COPY),
    /flexible fits|stronger design piece|distinctive piece|try .* first/i,
  );
});

test("store evidence uses concise, store-specific material notes", () => {
  assert.match(fashionMaterialNoteFor("fashion-auralee-tokyo") ?? "", /Finx twill.*Super Fine Wool.*selvedge denim/i);
  assert.match(fashionMaterialNoteFor("fashion-aton-aoyama") ?? "", /Giza Compact.*Suvin 60\/2.*Fresca jersey/i);
  assert.match(fashionMaterialNoteFor("fashion-mame-aoyama") ?? "", /3D floral knits.*embroidery.*silk dress/i);
  assert.match(fashionMaterialNoteFor("fashion-cfcl-omotesando") ?? "", /draped Milan knits.*Hypha glitter knit.*Pottery shapes/i);
  assert.match(fashionMaterialNoteFor("fashion-shibuya-parco") ?? "", /bonded canvas.*bright knit.*fringe/i);
  assert.equal(fashionMaterialNoteFor("unknown-place"), undefined);
});
