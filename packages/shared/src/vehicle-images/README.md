# vehicle-images

Maps a vehicle (make, model, year, trim) to a local image path under `apps/web/public/vehicles/`.

Toyota entries are generated from the Toyota configurator GraphQL API by
`scripts/fetch-vehicle-images.mjs`. For each grade it downloads the angle-13
exterior jelly **for every exterior color**, using `getDeepLinkConfig` (model
code + interior color) to resolve each color's image. Files are named
`toyota-<series>-<year>-<grade>-<colorcode>-angle-13.webp` and grouped in a
per-grade folder. Colors that the configurator can't resolve fall back to the
grade's default-color image. Non-Toyota entries reuse existing static PNGs and
are declared inline as `NON_TOYOTA_ENTRIES` in `scripts/fetch-vehicle-images.mjs`.

`resolveVehicleImage({ make, model, year, trim, color })` returns the best match
with a fallback chain: exact grade + color → grade default color → model's first
grade → `/images/noimage.png`. Regenerate the manifest with
`node scripts/fetch-vehicle-images.mjs` (5 primary series) or `--all` (full lineup).
