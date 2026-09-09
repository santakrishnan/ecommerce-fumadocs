# Stock Images for Conversational Search Cards

## Overview

Conversational search agent cards can display local stock images from the repository instead of (or as a fallback for) API-provided image URLs. This is controlled by a single environment variable.

## Configuration

### Environment Variable

```env
# In apps/web/.env.local
USE_STOCK_IMAGES=always
```

| Value | Behavior |
|-------|----------|
| `"always"` | ALL card images replaced with stock images. API image URLs are ignored entirely. |
| `"fallback"` | Use API image when valid (non-empty, proper URL). Fall back to stock when empty/invalid. |
| `"none"` | Pass through API images as-is. No stock image replacement. |

### Switching Modes

Edit `apps/web/.env.local` and change the value. The dev server auto-reloads env files — no restart needed.

**For production:** set `USE_STOCK_IMAGES` in your deployment environment variables (Vercel, AWS, etc.).

## How It Works

### Resolution Chain

When stock images are active, the resolver attempts to match in this order:

1. **Model + Year + Trim + Color** — exact match from the vehicle image manifest
2. **Model + Year + Trim** — randomized color from the matched grade
3. **Model + Year** — first available grade, randomized color
4. **Model only** — any year entry, randomized color
5. **Context-aware fallback** — body type inferred from model name or card title keywords

### Body Type Inference (for fallback)

When no manifest entry matches, the system infers a body type from context:

| Signal | Example | Inferred Type |
|--------|---------|---------------|
| Model name | "Tacoma", "Tundra" | truck |
| Model name | "4Runner", "RAV4", "Highlander" | suv |
| Model name | "Camry", "Corolla" | sedan |
| Card title keyword | "Best-value Trucks" | truck |
| Card title keyword | "SUV options" | suv |
| Card title keyword | "Double Cab" | truck |

### Fallback Images

Located at `public/vehicles/toyota/`:

| File | Source | Body Type |
|------|--------|-----------|
| `fallback_sedan.webp` | Camry LE — Supersonic Red | sedan |
| `fallback_car.webp` | Corolla LE — Blueprint | car / hatchback |
| `fallback_suv.webp` | RAV4 LE — Ice Cap (white) | suv / crossover / minivan |
| `fallback_truck.webp` | Highlander XLE — Heavy Metal (grey) | truck / pickup |

When no body type can be inferred, one is chosen at random.

## Architecture

```
.env.local (USE_STOCK_IMAGES)
    ↓
stock-image-config.ts (reads env, exports mode)
    ↓
agent-card-image-resolver.ts (resolveCardImage — BFF layer)
    ↓
agent-card.mapper.ts (passes model/trim/bodyType per card type)
    ↓
@ucmp/shared/vehicle-images (resolveVehicleImage — manifest lookup + fallback)
```

### Files Changed

| File | Role |
|------|------|
| `apps/web/src/features/search/lib/card-mappers/stock-image-config.ts` | Reads `USE_STOCK_IMAGES` env var, exports typed mode |
| `apps/web/src/features/search/bff/mappers/agent-card-image-resolver.ts` | Decides whether to use stock, fallback, or passthrough |
| `apps/web/src/features/search/bff/mappers/agent-card.mapper.ts` | Extracts model/trim/bodyType from card data and filters |
| `packages/shared/src/vehicle-images/vehicle-images.ts` | Core resolution logic, body type inference, fallback selection |
| `packages/shared/src/vehicle-images/types.ts` | Added `bodyType` to `ResolveVehicleImageInput` |
| `packages/shared/src/vehicle-images/index.ts` | Updated exports |

## Adding New Models to the Classification

Edit `MODEL_BODY_TYPE` in `packages/shared/src/vehicle-images/vehicle-images.ts`:

```ts
const MODEL_BODY_TYPE: Record<string, BodyType> = {
  // Add new models here:
  "new-model": "truck", // or "suv" | "sedan" | "car"
};
```

## Adding New Fallback Images

1. Place the image in `apps/web/public/vehicles/toyota/`
2. Name it `fallback_<category>.webp`
3. Update the `FALLBACK_IMAGES` array and `FALLBACK_BY_BODY_TYPE` map in `vehicle-images.ts`

---

## V2 Agent Migration Guide

When the V2 agent backend is introduced, the same stock image system should be applied. Here's how:

### What to do for V2

1. **Create a V2 image resolver** (or reuse the existing one):
   - If V2 cards follow a similar shape, import `resolveCardImage` from `agent-card-image-resolver.ts` directly.
   - If V2 has a different card structure, create `agent-v2-image-resolver.ts` following the same pattern.

2. **In the V2 card mapper**, call `resolveCardImage` with:
   ```ts
   resolveCardImage({
     apiImage: card.imageUrl,           // whatever field holds the API image
     model: card.model,                 // vehicle model name
     make: card.make ?? "Toyota",       // vehicle make
     year: card.year,                   // model year (optional)
     trim: card.trim,                   // trim level (optional)
     color: card.exteriorColor,         // color (optional)
     bodyType: card.title ?? card.model, // contextual hint for fallback
   })
   ```

3. **Ensure `bodyType` has enough context** for inference:
   - Pass the card title if it contains category keywords (e.g. "Trucks under $40k")
   - Pass the model name if available (e.g. "Tacoma")
   - Combine both: `[model, title].filter(Boolean).join(" ")`

4. **The `USE_STOCK_IMAGES` env var applies globally** — no per-backend config needed. Both v1 and v2 respect the same setting.

5. **If V2 introduces new card types**, handle them in the mapper:
   - Extract model from card data or `nextSearchPlan.filters`
   - Pass `bodyType` hint for intelligent fallback
   - Cards without image support (pills, text-only) can skip the resolver

### Checklist for V2

- [ ] Identify where V2 card images are resolved (equivalent of `agent-card.mapper.ts`)
- [ ] Import and call `resolveCardImage` in each card type that shows an image
- [ ] Extract model/trim/color from V2 card data structure
- [ ] Pass `bodyType` hint derived from card title + model name
- [ ] Verify with `USE_STOCK_IMAGES=always` that all cards show appropriate stock images
- [ ] Verify with `USE_STOCK_IMAGES=fallback` that valid API images pass through
- [ ] Run `pnpm type-check && pnpm test` to confirm no regressions
