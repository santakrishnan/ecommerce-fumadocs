# Features

Each subfolder is a self-contained **feature module** — components, hooks, services, data, lib, and tests, all in one place. We follow the "screaming architecture" pattern: the folder names tell you what the app does, not what kind of code is inside.

```
src/features/
├── landing/            # example feature — replace or extend
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── data/
│   ├── lib/
│   ├── __tests__/
│   ├── index.ts        # public surface — only export what others may use
│   └── README.md
└── README.md           # this file
```

## Adding a new feature

1. Create the folder shape: `mkdir -p apps/web/src/features/your-feature/{components,hooks,services,data,lib,__tests__}`
2. Add a public `index.ts` and only re-export what's intentionally public.
3. Add a short `README.md` explaining what this feature owns.
4. Consume from anywhere via `@features/your-feature`.

## Boundaries

- Features may import from `@shared/*`, `@config/*`, `@layout/*`, and the packages.
- Features must **not** import from `app/*` or from another feature's internals.
- Cross-feature use goes through the other feature's `index.ts` only.

## Mocking and data

Mock data lives inside each feature's `data/` folder. Promote shared mock data to `@shared/data/` only when 2+ features need it.

## Tests

Co-locate tests in `__tests__/` next to the code they test. Use `@ucmp/vitest-config/test-utils` for the `render` / `screen` / `userEvent` exports.
