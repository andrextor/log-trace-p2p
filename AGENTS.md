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
- Complex logic goes in composables within the relevant domain, or in `src/shared/ui/LogUIHelper.ts` when two domains need it; Vue components should stay presentational.

See `.agents/workflows/p2p-viwer.md` for full naming and code-style conventions.

## Store Gotchas

- Events use `shallowRef<LogEvent[]>([])` — only array reference changes trigger reactivity. Mutating in place won't update the UI.
- Batch processing: BATCH_SIZE = 5000, hard cap at MAX_STORE_LIMIT = 20000 lines. Events deduplicated via `processedHashes` Set (timestamp + first 60 chars of message).

## Tooling Quirks

- **Biome**: indentation is **tabs**, quotes are **double**, rules are **recommended**. Uses `.gitignore` for file ignores.
- **Vitest**: environment `jsdom`. `globals: true` is set, but **import `describe` / `it` / `expect` from `"vitest"` anyway**: the tsconfig does not declare `vitest/globals`, so relying on the globals compiles under Vitest and then fails `pnpm typecheck`, which runs before the tests in CI.
- **Tests**: `src/shared/utils/placeholder.test.ts` (trivial, satisfies CI) and `src/shared/ui/LogUIHelper.test.ts` (status badge + request/response pairing). No test setup file.
- **TypeScript**: extends `astro/tsconfigs/strict`. No `any` allowed.
- `test_parse.ts` at root is a standalone smoke-test script — not part of the test suite, not run by CI.

## pnpm-workspace.yaml

`allowBuilds` must hold real booleans. It once shipped with pnpm's placeholder
text as the value, and pnpm then aborted every command with
`ERR_PNPM_IGNORED_BUILDS`, leaving biome, esbuild and sharp without the
postinstall that fetches their native binary.

## Deploy

Cloudflare Pages via `wrangler.jsonc` → output dir is `./dist/`. CI auto-creates GitHub Releases on push to main using `package.json` version and `CHANGELOG.md`.
