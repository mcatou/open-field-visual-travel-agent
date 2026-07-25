import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageUrl = new URL("../app/seiko-transit/page.tsx", import.meta.url);
const cssUrl = new URL("../app/seiko-transit/seiko-transit.css", import.meta.url);

test("keeps the watch answer concise and removes legacy visual noise", async () => {
  const page = await readFile(pageUrl, "utf8");

  assert.match(page, /Best published visitor offer/);
  assert.match(page, /className="watch-facts"/);
  assert.match(page, /className="phone-handset"/);
  assert.match(page, />Call</);
  assert.doesNotMatch(page, /Check the department-store offer first/);
  assert.doesNotMatch(page, /Walking estimates are snapshots; open live directions before leaving/);
  assert.doesNotMatch(page, /WATCH_PURCHASE_MINUTES/);
  assert.doesNotMatch(page, /☎/);
});

test("keeps mobile watch geometry overrides after the desktop system layer", async () => {
  const css = await readFile(cssUrl, "utf8");
  const systemLayer = css.indexOf("Open Field response system");
  const finalMobileLayer = css.lastIndexOf("@media(max-width:820px)");
  const mobileCss = css.slice(finalMobileLayer);

  assert.ok(systemLayer >= 0);
  assert.ok(finalMobileLayer > systemLayer);
  assert.match(
    mobileCss,
    /\.seiko-layout\{position:relative;inset:auto/,
  );
  assert.match(
    mobileCss,
    /\.seiko-world\{[^}]*height:100dvh[^}]*overflow-y:auto/,
  );
  assert.match(
    mobileCss,
    /padding:66px 10px calc\(120px \+ env\(safe-area-inset-bottom\)\)/,
  );
  assert.match(
    mobileCss,
    /\.store-grid article>div a,[^}]*min-height:44px/,
  );
});
