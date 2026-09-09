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

- Domain types come from `@andrextor_ia11012/p2p-log-parser`, re-exported through `src/shared/types/base.ts`. Never redeclare them locally: the parser derives the data, and a local copy drifts silently (that is exactly how the old `RestParseMetadata` stopped matching what the library emitted).
- `src/store/` — Pinia store (application/state layer).
- `src/shared/` — cross-cutting types, UI helpers, common components.
- `src/domains/checkout/`, `src/domains/rest/` — domain-specific composables and components.
- Complex logic goes in composables within the relevant domain, or in `src/shared/ui/` when two domains need it (`LogUIHelper.ts` for predicates and formatting, `eventBadges.ts`, `facets.ts`, `batchSummary.ts`); Vue components should stay presentational.
- **One way to filter.** Every filter goes through the store: `outcomeFilter`, `search`, `sessionFilter` and `facetFilters`. Panels that offer filtering (`ProviderPanel`, `BatchSummary`) drive the existing facets rather than keeping state of their own — two mechanisms for the same filter end up disagreeing.

See `.agents/workflows/p2p-viwer.md` for full naming and code-style conventions.

## Store Gotchas

- Events use `shallowRef<LogEvent[]>([])` — only array reference changes trigger reactivity. Mutating in place won't update the UI.
- Batch processing: BATCH_SIZE = 5000, hard cap at MAX_STORE_LIMIT = 20000 lines. Events deduplicated via `processedHashes` Set, keyed by `event.id` — which the parser derives from the content (epoch timestamp + full message + trace id), so it neither truncates nor collides across traces.

## Tooling Quirks

- **Biome**: indentation is **tabs**, quotes are **double**, rules are **recommended**. Uses `.gitignore` for file ignores.
- **Vitest**: environment `jsdom`. `globals: true` is set, but **import `describe` / `it` / `expect` from `"vitest"` anyway**: the tsconfig does not declare `vitest/globals`, so relying on the globals compiles under Vitest and then fails `pnpm typecheck`, which runs before the tests in CI.
- **Tests**: unit tests for the shared UI logic (`src/shared/ui/*.test.ts`: badges, facets, batch summary, pairing, predicates) plus component tests mounted in jsdom (`LogUploader`, `ProviderPanel`) and store-level tests (`src/store/logStore.test.ts`). No test setup file.
- **`src/shims-vue.d.ts`** is what lets a `.ts` test import a `.vue` component: `astro check` resolves SFCs, the `tsc --noEmit` that CI runs afterwards does not.
- **TypeScript**: extends `astro/tsconfigs/strict`. No `any` allowed.
- `test_parse.ts` at root is a standalone smoke-test script — not part of the test suite, not run by CI.

## pnpm-workspace.yaml

`allowBuilds` must hold real booleans. It once shipped with pnpm's placeholder
text as the value, and pnpm then aborted every command with
`ERR_PNPM_IGNORED_BUILDS`, leaving biome, esbuild and sharp without the
postinstall that fetches their native binary.

## Deploy

Cloudflare Pages via `wrangler.jsonc` → output dir is `./dist/`. CI auto-creates GitHub Releases on push to main using `package.json` version and `CHANGELOG.md`.
