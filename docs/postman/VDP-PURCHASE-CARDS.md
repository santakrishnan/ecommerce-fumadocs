# VDP Purchase Card States

The VDP (Vehicle Detail Page) purchase card renders differently based on two data sources:

1. **Vehicle data** — from the VIN API (`GET /api/v1/vdp/{vin}`)
2. **Origination data** — from the origination/financing service (returned in `data.origination`)

## Card States Overview

| State | VIN | Origination Kind | CTA Button |
|-------|-----|-----------------|------------|
| Generic | `3TMDZ5BN8NM126690` | `none` | Get pre-approved |
| Estimated Payment | `2T1BURHE8JC039175` | `estimate` | Get pre-approved |
| Offer Received | `5TDKZRFH8NS112233` | `offer` | Continue purchase |
| Offer Expired | `4T1G11AK5NU445566` | `expired` | Restart purchase |
| Vehicle Sold | `JTMRWRFV8ND778899` | `none` | Search similar to this |

## Data Mapping by Card State

### S1 — Generic (No Origination)

The baseline card shown when the visitor has no payment activity.

| UI Element | Data Source |
|-----------|-------------|
| "Below market" badge | `data.vehicle.belowMarket` |
| Selling price ($30,775) | `data.vehicle.pricing.sellingPrice` |
| Vehicle title | `vehicleInfo.make` + `vehicleInfo.model` + `vehicleInfo.trim` |
| Year · Mileage | `vehicleInfo.year` + `status.mileage` |
| Dealer name | `data.dealer.dealerName` |
| Dealer address | `data.dealer.extended.address` |
| Dealer map thumbnail | `data.dealer.extended.images` (type: "map-thumbnail") |
| Test drive day/slots | `data.dealer.extended.testDrive` |

### S2 — Estimated Payment

Same as Generic, plus a payment estimate section.

| UI Element | Data Source |
|-----------|-------------|
| "Estimated payment $456.97/mo" | `data.origination.estimatedMonthly` |
| "with $3,500 down" | `data.origination.downPayment` |
| Test drive confirmation note | Visitor-specific (from booking service, not VIN API) |

### S3 — Offer Received (Active)

Same as Generic, but with an active financing offer replacing the estimate.

| UI Element | Data Source |
|-----------|-------------|
| "Your offer: Expires in 5d, 18h" | Countdown derived from `data.origination.expiresAt` |
| "$297/mo" | `data.origination.monthly` |
| "3.25% APR for 60 months" | `data.origination.apr` + `data.origination.termMonths` |
| Button text: "Continue purchase" | Conditional on `origination.kind === "offer"` |

### S4 — Offer Expired

Same as Generic, but with an expired notice.

| UI Element | Data Source |
|-----------|-------------|
| "Your previous offer has expired." | Triggered when `data.origination.kind === "expired"` |
| Button text: "Restart purchase" | Conditional on `origination.kind === "expired"` |

### S5 — Vehicle Sold

Completely different layout — no pricing, no dealer section, no test drive.

| UI Element | Data Source |
|-----------|-------------|
| "Vehicle sold" badge | `status.vehicleStatus === "Sold"` |
| Hero image | `data.vehicle.media.photos[0].url` |
| "This 2023 Highlander Hybrid Limited has sold." | Composed from `vehicleInfo.year`, `vehicleInfo.model`, `vehicleInfo.trim` |
| "Sold on March 24, 2026 at Toyota of Bay Ridge" | `data.vehicle.soldAt` + `data.dealer.dealerName` |
| Button text: "Search similar to this" | Always shown for sold vehicles |

## Determining Card State (Logic)

```
if (status.vehicleStatus === "Sold") → SOLD card
else if (origination.kind === "offer") → OFFER RECEIVED card
else if (origination.kind === "expired") → OFFER EXPIRED card
else if (origination.kind === "estimate") → ESTIMATE card
else → GENERIC card
```

## Testing in the Browser

With `pnpm dev` running at `http://localhost:3000`, visit these URLs to see each card state:

| State | URL |
|-------|-----|
| S1 — Generic | `http://localhost:3000/used-cars/details/toyota/highlander/hybrid-limited/2023/3TMDZ5BN8NM126690` |
| S2 — Estimated Payment | `http://localhost:3000/used-cars/details/toyota/rav4/hybrid-xse/2024/2T1BURHE8JC039175` |
| S3 — Offer Received | `http://localhost:3000/used-cars/details/toyota/highlander/hybrid-limited/2023/5TDKZRFH8NS112233` |
| S4 — Offer Expired | `http://localhost:3000/used-cars/details/toyota/highlander/hybrid-limited/2023/4T1G11AK5NU445566` |
| S5 — Vehicle Sold | `http://localhost:3000/used-cars/details/toyota/highlander/hybrid-limited/2023/JTMRWRFV8ND778899` |

The route pattern is `/used-cars/details/[make]/[model]/[trim]/[year]/[vin]`. Segments are lowercase/slugified; the VIN is case-insensitive.

### BFF API (raw JSON)

```
GET http://localhost:3000/api/v1/vdp/{vin}
```

Example: `http://localhost:3000/api/v1/vdp/3TMDZ5BN8NM126690`

### What to verify per state

- **S1 Generic** — "Below market" badge, selling price, no payment block, "Get pre-approved" CTA, dealer info with map thumbnail, test drive slots
- **S2 Estimated** — Same as S1 plus "Estimated payment $456.97/mo" with "$3,500 down"
- **S3 Offer** — "Your offer: Expires in Xd, Yh", "$297/mo", "3.29% APR for 60 months", "Continue purchase" CTA
- **S4 Expired** — "Your previous offer has expired.", "Restart purchase" CTA
- **S5 Sold** — Different card entirely: "Vehicle sold" badge, hero image from API, sold headline, sold date + dealer, "Search similar to this" CTA, no dealer/test drive section

## Testing with Postman

Import `vdp-purchase-cards.postman_collection.json` from this directory. Set the `baseUrl` variable to your local dev server (default: `http://localhost:3000`).

Each request targets a specific VIN that returns the corresponding card state via the BFF mock data.

## Notes

- **Test drive data** (day, time slots) comes from the dealer enrichment, not the VIN API directly.
- **Test drive confirmation** ("You have a test drive at...") is visitor-specific and would come from a booking service, not the VDP API.
- **`soldAt`** is a proposed field not yet in the upstream SDK — currently sourced from fixture data.
- The **"Below market"** badge requires the `belowMarket` computed field from the BFF enrichment.
