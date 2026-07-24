# Open Field experience system

This is an executable design contract for visual travel answers. The shopping
route is the visual reference; other workflows reuse its hierarchy instead of
inventing a new interface.

## 1. Information priority

Every candidate section is ranked with the same inputs:

1. relevance to the user's current question;
2. actionability;
3. evidence quality;
4. urgency;
5. visual or cognitive complexity;
6. whether the section is optional.

The deterministic implementation is in
`src/runtime/open-field-experience.ts`. The model may identify intent and
produce validated facts, but it does not choose arbitrary typography or layout.

Default order:

1. answer or decisive value;
2. comparison and choices;
3. evidence for the selected choice;
4. route or timing, when relevant;
5. contingency, collapsed until requested.

The watch recipe therefore leads with visitor savings, then possible stores and
stock actions. Tokyo Station and Narita remain available as follow-ons.

## 2. Visual roles

- **Display serif:** exact product, place, or plan identity only.
- **Sans-serif title:** recommendations, section headings, and decisions.
- **Sans-serif body:** practical notes, caveats, hours, prices, and actions.
- **Eyebrow:** a short category or evidence label; never an internal status.
- **Primary action:** one dark-moss button per decision block.
- **Secondary action:** paper button with moss outline.
- **Disclosure:** optional routes, contingencies, or deeper evidence.

No component may introduce its own type scale. Shared tokens and primitives live
in `app/open-field-brand.css` and `app/components/open-field-ui.tsx`.

## 3. Layout recipe

Desktop answers use the same three-part field:

- map on the left;
- answer in the center;
- selected evidence on the right.

The center pane owns the decision. The right rail adds proof and links for the
selected item. The map mirrors the same stable store or place IDs. Pane resizing
may change available space, but it may not change information priority.

## 4. Content rules

- Lead with what changes the decision.
- Keep one claim per visual block.
- Attach the source link to the claim it supports.
- State uncertainty next to the affected fact.
- Use phone icons for unpublished stock; do not turn “call first” into a
  headline.
- Never show internal runtime, tool, job, or model language.
- Do not show elapsed-time scores or invented precision.
- Keep missing-input and contingency flows collapsed until they are relevant.
- A non-matching question receives a short redirection to supported decisions;
  it does not load a meaningless visual shell.

## 5. Image rules

- Product identity uses the exact model image.
- Store comparison uses storefront or boutique-interior images.
- Product examples remain secondary evidence.
- Every image must identify the same entity as its card and selected map pin.
- Decorative placeholders and repeated images are not acceptable evidence.

## 6. Validation

The UI contract is covered by:

- `tests/watch-experience.test.ts` for prioritization and sourced claims;
- `tests/rendered-html.test.mjs` for visible hierarchy and banned language;
- TypeScript for cross-linked IDs and component inputs;
- real-browser desktop and mobile overflow checks before deployment.
