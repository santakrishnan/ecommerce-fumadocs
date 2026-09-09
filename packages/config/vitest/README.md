# @ucmp/vitest-config

Shared Vitest configurations and test utilities for the UCMP monorepo.

## Configurations

### `base.ts`
Base Vitest configuration with common settings. Use for non-React packages.

### `react.ts`
Configuration for React libraries with jsdom environment and React plugin.

### `nextjs.ts`
Configuration for Next.js applications. Includes Next.js-specific mocks (router, Image, etc.).

## Usage

### In a Next.js App

**vitest.config.ts:**
```typescript
import path from "node:path";
import { defineConfig, mergeConfig } from "vitest/config";
import nextjsConfig from "@ucmp/vitest-config/nextjs";

export default defineConfig(
  mergeConfig(nextjsConfig, {
    test: {
      name: "web",
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  })
);
```

**In your tests:**
```typescript
import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { MyComponent } from "./MyComponent";

it("should render", () => {
  render(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

### In a React Library

**vitest.config.ts:**
```typescript
import { defineConfig, mergeConfig } from "vitest/config";
import reactConfig from "@ucmp/vitest-config/react";

export default defineConfig(
  mergeConfig(reactConfig, {
    test: {
      name: "ui",
      setupFiles: ["./test/setup.ts"],
    },
  })
);
```

## Included Mocks

The Next.js config includes mocks for:
- `next/navigation` (useRouter, usePathname, useSearchParams, etc.)
- `next/image` (Image component)
- `window.matchMedia`
- `IntersectionObserver`

## Test Utilities

Import all testing utilities from one place:
```typescript
import {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent,
  vi,
  expect,
  describe,
  it,
} from "@ucmp/vitest-config/test-utils";
```
