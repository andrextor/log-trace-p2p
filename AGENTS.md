# AGENTS.md — Project Quick Reference

## Commands

```bash
pnpm dev          # Astro dev server (localhost:4321)
pnpm lint         # Biome check (lint + format, read-only)
pnpm format       # Biome fix (--write, modifies files)
pnpm typecheck    # astro check && tsc --noEmit
pnpm test:run     # vitest run (single-shot, no watch)
pnpm build        # Production build → ./dist/
```

Run a single test: `pnpm vitest run path/to/test.test.ts`
Run tests matching pattern: `pnpm vitest run -t "pattern"`

## CI Gate Order

CI runs sequentially: `pnpm lint` → `pnpm typecheck` → `pnpm test:run` → `pnpm build`. Typecheck must pass before tests.

## Architecture: Astro + Vue 3 Hybrid

- Astro is the site shell; a single Vue 3 SPA mounts via `client:load`.
- Pinia is not installed from a `main.ts` — it's set up in `src/app.ts` and configured as `appEntrypoint` in `astro.config.mjs`.
- `src/app.ts` = Vue createApp + Pinia install. `src/pages/index.astro` = the single Astro page that mounts it.

## DDD Directory Conventions

- `src/logic/types.ts` — single source of truth for all domain types (never duplicate interfaces).
- `src/store/` — Pinia store (application/state layer).
- `src/shared/` — cross-cutting types, UI helpers, common components.
- `src/domains/checkout/`, `src/domains/rest/` — domain-specific composables and components.
- Complex logic goes in composables within the relevant domain or `src/logic/`; Vue components should stay presentational.

See `.agents/workflows/p2p-viwer.md` for full naming and code-style conventions.

## Store Gotchas

- Events use `shallowRef<LogEvent[]>([])` — only array reference changes trigger reactivity. Mutating in place won't update the UI.
- The store overrides `event.appType` to match the targeted upload type (workaround for parser engine mis-categorization).
- Batch processing: BATCH_SIZE = 5000, hard cap at MAX_STORE_LIMIT = 20000 lines. Events deduplicated via `processedHashes` Set (timestamp + first 60 chars of message).

## Tooling Quirks

- **Biome**: indentation is **tabs**, quotes are **double**, rules are **recommended**. Uses `.gitignore` for file ignores.
- **Vitest**: `globals: true` — `describe`, `it`, `expect` are available without imports. Environment: `jsdom`.
- **Only test file**: `src/shared/utils/placeholder.test.ts` (trivial 1+1=2, satisfies CI). No test setup file.
- **TypeScript**: extends `astro/tsconfigs/strict`. No `any` allowed.
- `test_parse.ts` at root is a standalone smoke-test script — not part of the test suite, not run by CI.

## Deploy

Cloudflare Pages via `wrangler.jsonc` → output dir is `./dist/`. CI auto-creates GitHub Releases on push to main using `package.json` version and `CHANGELOG.md`.
