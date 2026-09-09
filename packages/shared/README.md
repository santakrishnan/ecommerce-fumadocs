# @ucmp/shared

Shared services, providers, utilities, and hooks for the UCMP monorepo.

## Installation

Add it as a workspace dependency in any app:

```json
{
  "dependencies": {
    "@ucmp/shared": "workspace:*"
  }
}
```

## Usage

### Full import
```typescript
import { useDebounce, useMediaQuery } from "@ucmp/shared";
```

### Targeted imports (tree-shakeable)
```typescript
import { ThemeProvider, useTheme } from "@ucmp/shared/providers";
import { formatCurrency, formatDate } from "@ucmp/shared/utils";
import { useDebounce } from "@ucmp/shared/hooks";
import type { ServiceConfig, Result } from "@ucmp/shared/types";
```

## Package Structure

```
packages/shared/
├── src/
│   ├── index.ts          # Re-exports all modules
│   ├── services/         # API clients, data services, caching
│   ├── providers/        # React context providers
│   ├── utils/            # Pure utility functions
│   ├── hooks/            # Reusable React hooks
│   └── types/            # Shared TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## What belongs here

**Put in `@ucmp/shared`:**
- Authentication / authorization logic
- API client services
- Feature flag infrastructure
- Analytics tracking service
- Common form validation
- Currency / date formatting (locale-aware)
- Error boundary providers
- Generic React hooks (`useDebounce`, `useMediaQuery`)

**Keep app-specific:**
- Business domain logic unique to one app
- Route-specific providers
- Page-level components
- App configuration / environment
- Domain-specific types

## Provider pattern

We follow React 19 patterns with a `state / actions / meta` split on context values, and the `use()` hook over `useContext()`:

```typescript
"use client";

import { createContext, use, useState } from "react";

interface AuthContextValue {
  state: { user: User | null };
  actions: { login: (c: Credentials) => Promise<void>; logout: () => void };
  meta: { isLoading: boolean; error: Error | null };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // …
  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```
