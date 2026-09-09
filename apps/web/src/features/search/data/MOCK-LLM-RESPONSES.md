# Mock Search Agent Responses — Demo Scenarios

This file documents all mocked search scenarios available when `SEARCH_AGENT_BACKEND=static_mock` in `.env.local`.

Mocks are served by [`bff/services/agent-mock.ts`](../bff/services/agent-mock.ts) using fixture data from [`bff/__fixtures__/agent.fixture.ts`](../bff/__fixtures__/agent.fixture.ts).

## How matching works

1. **VDP FAQ pill responses** — checked first via exact/near-exact match (highest priority). These only fire for the specific VDP pill questions and won't conflict with general search.
2. **Numeric inventory count** — `\b14 inventory\b`, `\b8 inventory\b`, `\b6 inventory\b` checked via regex.
3. **Substring keyword matching** — the code checks `query.toLowerCase()` against keywords in priority order (first match wins).
4. **Default fallback** — if nothing matches, returns model option cards (RAV4 Hybrid, Highlander Hybrid, bZ).

---

## VDP FAQ — two independent mock paths

The VDP FAQ overlay is **always mocked** regardless of env settings. It uses a separate data path from search:

| Path | When it fires | Source of truth |
|---|---|---|
| **BFF path** (primary) | Pill click or follow-up in VDP overlay | [`vehicle-detail/bff/__fixtures__/vdp-search-faq.fixture.ts`](../../../features/vehicle-detail/bff/__fixtures__/vdp-search-faq.fixture.ts) via `mockVdpSearchFaq` (keyword matching) |
| **SSE path** (fallback) | Only when `SEARCH_AGENT_BACKEND=static_mock` and `turnProvider` is not active | `agent-mock.ts` (exact phrase matching, built from same answer constants) |

The BFF path is controlled by `turnProvider` on the `SearchResultsOrchestratorWrapper` — it bypasses the search API entirely. The answer constants live in `vdp-search-faq.fixture.ts` and are shared by both paths.

### Pill questions (static, same for all VINs)

Defined in [`vehicle-detail/__fixtures__/ask-question.fixture.ts`](../../../features/vehicle-detail/__fixtures__/ask-question.fixture.ts):

- "How comfortable is the 3rd row seating?"
- "What is the cargo space like?"
- "How does Limited compare to XLE?"
- "What makes this one better than the others I'm seeing?"

### BFF keyword matching (`vdp-search-faq-mock.ts`)

| Keywords in question | Fixture returned |
|---|---|
| `towing`, `tow` | Towing capacity (text only) |
| `cargo`, `trunk`, `storage` | Cargo space comparison cards |
| `better than`, `makes this one` | "Better than others" (text only) |
| `limited`, `xle`, `platinum` | Trim comparison (3 option cards) |
| _(no match — default)_ | 3rd row seating (text only) |

---

## VDP FAQ SSE exact matches (agent-mock.ts)

These are matched by **exact phrase only** (strict `===` on the lowercased query) and only fire when `SEARCH_AGENT_BACKEND=static_mock`. They use the same answer content as the BFF fixtures.

| Query (exact match, lowercased) | Card type | Response |
|---|---|---|
| `"how comfortable is the 3rd row seating?"` | Text only | 3rd row comfort review + action button "What is the cargo space like?" |
| `"what is the towing capacity?"` | Text only | Towing capacity info (3,500 lbs) |
| `"what makes this one better than the others i'm seeing?"` | Text only | Generic comparison to similar listings |
| `"how does limited compare to xle?"` | Trim cards (3) | XLE, Limited, Platinum comparison + action button |

---

## Beats checklist demo (PEDX01-2831)

Two scenarios exercise the search-page loader's beat checklist (`turn.beats`,
rendered by `SearchLoadingIndicator`/`IntentBanner`). Both emit real `beat`/
`message` fields on `Status`/`ToolCall`/`ToolResult` frames, mirroring the
shape captured from the live agent (see `.debug/search/*.json`).

| Keyword | Behavior |
|---|---|
| `beats` | Happy path: `resolve` → `inventory` → `options` beats, each closing with a checkmark as the next one starts, then a normal `Complete` with 2 red Tacoma inventory cards. |
| `beats error` | `resolve` completes, then the `inventory` beat's `ToolResult` reports `status: "Error"` and the stream ends there — no further frames, no `Complete`/`Error` event (simulates a V1 timeout). The `inventory` row should freeze with the warning icon instead of a checkmark. |

## Scenarios with cards

All keywords are case-insensitive. Your query just needs to _contain_ the keyword.

| Keyword | Card type | Cards shown |
|---|---|---|
| `suv` | Model (Option) | RAV4 Hybrid, Highlander Hybrid, bZ (same as default) |
| `hybrid` | Model (Option) | Prius, Camry Hybrid, RAV4 Hybrid, Corolla Hybrid, Crown |
| `family` | Model (Option) | RAV4 Hybrid, Highlander Hybrid, bZ (same as default) |
| `trim` | Trim (Option) | RAV4 Hybrid LE, SE, XLE Premium |
| `package` | Package (Option) | Weather Package, Tow Package |
| `category` | Category (Option) | SUVs, Sedans |
| `segment` | Segment (Option) | Compact SUV, Midsize SUV |
| `truck` | Inventory | Tacoma TRD Pro, Tundra Limited, Tacoma SR5, Tundra TRD Off-Road |
| `electric` / `ev` / `bz` | Inventory | bZ4X ×3, Prius Prime ×2 |
| `budget` / `under $` / `cheap` | Inventory | Corolla LE, Corolla Cross L, Corolla Hybrid LE, RAV4 LE, Corolla Cross LE AWD |
| `city` / `commute` (prefix match) | Inventory | Corolla Hybrid LE, Prius XLE, Corolla Cross Hybrid S, Prius LE |
| `low mileage` / `barely driven` | Inventory | Highlander Hybrid XLE, Camry SE, RAV4 Prime |
| `long text` / `third row` / `scrolling` | Inventory | Highlander Hybrid ×4 (long summary for scroll demo) |
| `6 inventory` | Inventory | Highlander Hybrid ×6 (grid variant) |
| `8 inventory` | Inventory | Highlander Hybrid ×8 (grid variant) |
| `14 inventory` | Inventory | Highlander Hybrid ×14 (grid variant) |
| `inventory` | Inventory | RAV4 Hybrid ×4 (default inventory) |
| `long trip` / `road trip` | Comparison | Highlander Hybrid, RAV4 Hybrid, bZ4X — range + highway MPG |
| `compare` / `comparison` / `cargo` | Comparison | Highlander Hybrid, RAV4 Hybrid, bZ4X — cargo space |
| `no-matching` / `no matching` | Editorial (Fallback Option) | Close match, Similar model, Nearby, Alternative |
| `fallback` | Fallback (Option) | Hybrid SUVs, Gas SUVs |

---

## No-media scenarios (text only, no cards)

These trigger on substring match (not exact phrase):

| Keyword | Response behaviour |
|---|---|
| `off-topic` / `off topic` / `turtle` | Playful redirect — "Turtles are great! I share their passion for slow and steady progress…" |
| `negative` / `sucks` | Empathetic response + Brand Engagement Center contact (1-800-331-4331) |
| `competitor` / `ford` | Acknowledges competitor, offers comparable Toyota models and mentions small pre-owned selection |
| `purple` | No exact color match, offers to broaden search |

---

## Keyword priority

Keywords are checked in this order (first match wins):

1. **VDP FAQ pills** (exact match: `"how comfortable is the 3rd row seating?"`, `"what is the towing capacity?"`, `"what makes this one better than the others i'm seeing?"`, `"how does limited compare to xle?"`)
2. Numeric inventory (`14 inventory`, `8 inventory`, `6 inventory`)
3. `beats error` → `beats`
4. `error`
5. `trim` → `package` → `category` → `segment` → `suv` → `hybrid` → `family`
6. `long trip` / `road trip` → `compare` / `comparison` / `cargo`
7. `long text` / `third row` / `scrolling`
8. `truck` → `electric` / `ev` / `bz` → `budget` / `under $` / `cheap` → `city` / `commute` (prefix) → `low mileage` / `barely driven` → `inventory`
9. Off-topic keywords (`off-topic` / `off topic` / `turtle` → `negative` / `sucks` → `competitor` / `ford` → `purple`)
10. `no-matching` / `no matching` → `fallback`
11. Default → model option cards

---

## Card type → component mapping

| Response mode | Component |
|---|---|
| `OptionCards` (Model) | `ModelCard` |
| `OptionCards` (Trim) | `TrimCard` |
| `OptionCards` (Fallback/editorial) | Rendered via attributes |
| `InventoryCards` | `InventoryCard` |
| `ComparisonCards` | `ComparisonCard` |
| Text-only (0 results) | No cards rendered |
