export default {
  "*.{js,jsx,ts,tsx,json,jsonc,css,scss,md,mdx}": "pnpm exec ultracite fix",
  "*": "biome check --write --no-errors-on-unmatched",
};
