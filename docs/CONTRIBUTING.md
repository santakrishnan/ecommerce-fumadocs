# Contributing

## Branches

Use short-lived branches off `develop` and include the Jira key:
```
<type>/<ISSUE-KEY>-<issue-description>
```

Allowed `<type>` values:
- `feature`
- `bug`
- `hotfix`
- `fix`
- `chore`
- `refactor`
- `docs`
- `test`

Examples:
```
feature/PEDX01-123-add-settings-panel
bug/PEDX01-456-fix-carousel-jump
hotfix/PEDX01-789-patch-auth-redirect
```

## Commits

[Conventional Commits](https://www.conventionalcommits.org/) with these scopes:
- `web` — `apps/web`
- `ui` — `packages/ui`
- `ui-theme` — `packages/ui-theme`
- `shared` — `packages/shared`
- `config` — `packages/config/*`
- `monorepo` — root config, turbo, biome, husky

Examples:
```
feat(web): add settings feature module
fix(ui): correct dialog backdrop animation
refactor(ui-theme): split semantic colors out of overrides
chore(monorepo): bump turbo to 2.8
```

PR titles follow the same Conventional Commits format and must also include the Jira issue key:
```
feat(web): PEDX01-123 add settings feature module
fix(ui): PEDX01-456 correct dialog backdrop animation
```

## Pre-commit hook

`husky` + `lint-staged` runs:
- `pnpm exec ultracite fix` on staged files
- `vitest related --run --root apps/web <staged files>` for web-app changes
- `biome check --write --no-errors-on-unmatched --staged` on everything else

If the commit fails, fix the issue and create a **new** commit — don't amend.

## Adding a package

1. `mkdir -p packages/<name>/src`
2. Create `package.json` with `"name": "@ucmp/<name>"` and `"private": true`
3. Create `tsconfig.json` extending `@ucmp/tsconfig/react-library.json` (or `base.json`)
4. Add exports to `package.json` (`"main"`, `"types"`, `"exports"`)
5. `pnpm install` from the root to wire it up

## Adding a feature in `apps/web`

```bash
mkdir -p apps/web/src/features/your-feature/{components,hooks,services,data,lib,__tests__}
touch apps/web/src/features/your-feature/{index.ts,README.md}
```

Then consume via `@features/your-feature`.

## Code review checklist

- [ ] No `useMemo`/`useCallback`/`React.memo` (React Compiler handles it)
- [ ] No `forwardRef` in new code — `ref` is a regular prop via `React.ComponentProps<...>`
- [ ] No `<Context.Provider>` or `useContext()` — use `<Context value={...}>` and `use(Context)`
- [ ] No cross-feature internal imports (`@features/x/components/internal-thing.tsx` is a no-go)
- [ ] Brand colors come from `@ucmp/ui-theme` tokens in OKLCH — no hex, HSL, or hardcoded values
- [ ] Styling uses Tailwind utilities or CVA variants — no CSS modules, no styled-components
- [ ] `@apply` only in `@layer base` or on un-componentised HTML (CMS / editor output); never as a component abstraction
- [ ] `style={...}` only for runtime CSS custom properties (`style={{ "--progress": pct }}`); no static inline styling
- [ ] No `tailwind.config.{js,ts}` file; tokens defined in `@theme { }` (use `@theme inline` when referencing `next/font` or other variables)
- [ ] Custom utilities use `@utility`; custom variants use `@custom-variant` / `@variant`
- [ ] Scoped CSS that uses `@apply` includes `@reference` to the theme entry
- [ ] No arbitrary px values for spacing or typography (`p-[14px]`, `text-[15px]`) — use the rem scale
- [ ] No deprecated caching (`unstable_cache`, implicit `fetch()` caching) — use `"use cache"` + `cacheLife()` + `cacheTag()`
- [ ] No `dangerouslySetInnerHTML`; Server Actions validate inputs with Zod
- [ ] Tests co-located under `__tests__/`, fixtures under `__fixtures__/`
- [ ] `pnpm lint && pnpm type-check && pnpm test` all green

## Definition of Done

A change is "done" only when **all** of the following are true:

- [ ] All acceptance criteria from the ticket pass (manual + automated)
- [ ] `pnpm type-check` passes — no new `any`, no `@ts-ignore` without justification
- [ ] `pnpm lint` passes — no new warnings introduced
- [ ] `pnpm test` passes — new components and Server Actions have co-located tests
- [ ] `pnpm build` passes
- [ ] No hydration mismatch in dev or production build
- [ ] No unexpected layout shift (CLS verified) on UI changes
- [ ] No route-level bundle regression (check the `pnpm build` route summary)
- [ ] Visual QA matches the design within ±2px tolerance (for design-driven work)
- [ ] PR description references the ticket and includes the Return Contract (see [`.github/PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md))
- [ ] Code reviewer sign-off

## GitHub Pull Request Best Practices

To support faster delivery and maintain high team velocity, we encourage developers to break work into small, manageable pull requests and to use GitHub ticket reviews as a collaborative step toward progress, not a gate that requires every requirement to be completed in a single PR.

### Core Principles

- Prioritize **small, incremental changes** over large, all-at-once pull requests.
    
- Aim for **prompt reviews** so that work can move forward quickly.
    
- Focus on **unblocking the team** by approving code that is ready to merge, even if related follow-up work is still needed.
    
- Use **subtasks** or **follow-up stories** when a ticket can be delivered in stages.
    
- Keep pull requests scoped to a clear, reviewable unit of work.
    

### Guidance for Creating Pull Requests (PRs)

PRs should encapsulate a single concern with a scope humans can easily reason about (one feature, one migration, one set of type definitions, one test suite, etc)  

If a ticket contains multiple requirements, developers should feel empowered to:
  - create subtasks,
  - split follow-up work into new stories,
  - or defer non-blocking items into future PRs.

The PR description should:
  - Explain WHAT feature/change/coverage your PR implements
  - Explain WHY the code changes are needed
  - Explain HOW your code changes address the concerns of the associated business requirements (usually a story)
  - Explain any exceptions to established patterns, procedures or knowledge
  - Explain any gaps in implementation from the requirements
  - Call out anything that would be exceptionally confusing, unclear or contentious

Your PR should include evidence of validation and testing, such as:
  - New test suites
  - Explanation of test procedures on a dev or local environment
  - Feedback from product
  - For visual changes (UI/UX), the PR should include a visual walkthrough of the change (video or images)

Ensure your commit history is clean and descriptive, your reviewer may crawl the commit history to understand changes over time. See [https://www.conventionalcommits.org/](https://www.conventionalcommits.org/ "https://www.conventionalcommits.org/")
    
Your goal when opening a PR is to **minimize the number of questions a reviewer needs to ask you.** If you’re unsure about something, get feedback before requesting a review. Consider utilizing the draft PR feature.

Remember that your PR may be the only remaining permanent record of why you made a change to the application, as we utilize squash-merges.

### Guidance for Reviewing Pull Requests

When reviewing a PR, be inquisitive and seek to learn from your peers that have introduced new changes to the application. Explore thoroughly and gain an understanding of the change before offering feedback.

Seek to understand:
  - What the PR is attempting to accomplish (associated story, tech debt item, etc)
  - What changes are introduced to the platform with the PR
  - How the changes introduced achieve the stated goals
  - Why the PR owner made the changes in the PR

If you cannot gain a sufficient understanding, consider requesting a meeting with the PR owner and ask for clarification - use this learning to update the PR description.

Do not require every potential enhancement or secondary requirement to be completed in one PR if doing so would reduce clarity, delay delivery, or block others unnecessarily.

Trust that your teammates have good intentions with their changes. PRs are not the time for ideological debates or political conflict.

Leave comments for anything you wish to communicate to the PR owner, including:
  - Required changes
    - These are items that will block the PR (see below)
  - Suggestions and opinions
    - Take the opportunity to cross-train and share knowledge
  - Confusion
    - Consider meeting with the PR owner to resolve proactively   
  - Thoughts about possible follow-up items
    - Feel free to proactively create stories and link them in your comment

The following items should prompt you to request changes to a PR and block approval:
  - PR title does not follow Conventional Commits format or is missing the Jira issue key
  - Failure to follow established conventions when it is possible to do so
  - Failure to pass automated testing, linting, builds
  - Clear misunderstandings of the stated goal(s) in the PR (or the wrong stated goal(s))
  - Failing to achieve the stated goal(s) of the PR
  - Failures to address significant maintenance or security concerns
  - Clear lack of code quality

Otherwise, approve a PR when:
  - None of the above items have explicitly blocked approval
  - You understand the scope and intention of the changes
  - Bugs and tech debt are addressed or captured in follow-up stories
  - You feel comfortable with the code landing in the application
  - You have left appropriate comments on the PR (it is possible none are needed)

Your goal when reviewing a PR is to **approve the PR.** You are searching for items that would prevent you from doing so or make you (or others) feel uncomfortable about doing so.