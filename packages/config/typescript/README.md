# @ucmp/tsconfig

Shared TypeScript configurations for the UCMP monorepo.

## Configurations

### `base.json`
Base TypeScript configuration with strict settings. Use this for non-React packages.

### `nextjs.json`
Configuration for Next.js applications. Extends `base.json` with Next.js-specific settings.

### `react-library.json`
Configuration for React component libraries. Extends `base.json` with React-specific settings.

## Usage

In your package's `tsconfig.json`:

```json
{
  "extends": "@ucmp/tsconfig/nextjs.json",
  "compilerOptions": {
    "outDir": "dist",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```
