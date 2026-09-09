# Card Size Mapping

Documents how each card type maps to the shared `CARD_SIZE` token system defined in `apps/web/src/shared/components/card/card-size.ts`.

## Shared CARD_SIZE Tokens

| Token | Mobile | Tablet (md) | Desktop (lg/xl) |
|---|---|---|---|
| `sm` | 178×237px | — | 220×293px |
| `md` | 270×360px | — | 334×445px |
| `lg` | 362×482px | — | 448×597px |
| `search` | 362×482px | 360×480px | 448×597px |

## Inventory Card

Uses `CARD_SIZE` tokens directly via `SIZE_TOKEN`:

| Public Size | Token | Dimensions |
|---|---|---|
| `"small"` | `sm` | 178×237 → 220×293 |
| `"medium"` | `md` | 270×360 → 334×445 |
| `"large"` | `lg` | 362×482 → 448×597 |
| `"search"` | `search` | 362×482 / 360×480 / 448×597 |

## Trim Card

Uses `CARD_SIZE` tokens directly (default: `"search"`):

| Size | Dimensions |
|---|---|
| `"search"` | 362×482 / 360×480 / 448×597 |

## Comparison Card

Uses `CARD_SIZE` tokens directly (default: `"search"`):

| Size | Dimensions |
|---|---|
| `"search"` | 362×482 / 360×480 / 448×597 |

## Editorial Card

**Decision: Keep separate (Option B) — card-local dimension classes.**

The editorial card does NOT use `CARD_SIZE` tokens directly. It defines its own `EDITORIAL_SIZE_CLASSES` map with aspect-ratio-based sizing.

| Public Size | Mobile/Tablet | Desktop (lg) | Closest CARD_SIZE | Delta |
|---|---|---|---|---|
| `"medium"` | 268×357px | 334×445px | `md` (270×360 → 334×445) | −2w/−3h mobile; exact desktop |
| `"large"` | 360×480px | 448×601px | `search` (360×480 → 448×597) | exact tablet; +4h desktop |

### Why separate?

1. **Aspect-ratio sizing** — Editorial uses `aspect-[W/H]` (fluid height derived from width) while `CARD_SIZE` uses fixed `w-[X] h-[Y]`. These are fundamentally different sizing strategies.

2. **Responsive carousel tuning** — The editorial carousel has distinct peek/card-count tuning (1.5/2.5/4-card and 1/2+/3-card configurations) that requires specific width values not expressible through the shared tokens.

3. **4px desktop height difference (601 vs 597)** — The editorial large card's Figma-specified aspect ratio (448/601) produces a 601px height at 448px width. This is the exact Figma ratio, not a rounding error. Converging would change the aspect ratio.

4. **Convergence is planned** — ADR-0003 Phase 2 stages the decision to reconcile editorial dimensions with `CARD_SIZE.md/lg`. Until design approves the 601→597 height change, exact classes are pinned by `editorial-card.test`.

### Token mapping for hover scale

Editorial cards integrate with the shared token system for carousel behavior:

```typescript
EDITORIAL_SIZE_TOKEN = { medium: "md", large: "lg" }
```

This maps to `CARD_HOVER_SCALE` so carousels derive consistent hover lift:
- `"medium"` → `CARD_HOVER_SCALE.md` = 1.02
- `"large"` → `CARD_HOVER_SCALE.lg` = 1.015

### Skeleton alignment

The editorial skeleton (`EditorialCardsSkeleton`) uses the same medium dimensions:
- `w-[268px] aspect-[268/357] lg:w-[334px] lg:aspect-[334/445]`
- Matches `EDITORIAL_SIZE_CLASSES.medium` exactly

### Carousel behavior

- Gap: 8px (`pl-2` per `CarouselItem`) — same as all other carousels
- Primitives: `Carousel > CarouselContent > CarouselItem` from `@ucmp/ui`
- Controls: `disableArrows` on home, full controls on search
- Drag/swipe: Embla-based, enabled by default
