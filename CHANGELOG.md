# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-03-30

### Added
- **Global Paste Listener**: Enabled pasting logs directly via `Ctrl+V` without needing to focus the application explicitly.

### Changed
- **Layout Space Optimization**: Removed the static application footer and integrated it into the LogAnalyzer's empty state, giving full vertical space to the log timelines.
- **Session Explorer UI**: Pre-calculated metadata directly via computed properties, saving redundant function calls during view rendering. Hidden `UNKNOWN` tag instances for cleaner UI.

### Fixed
- **Formats Reactivity Issue**: Fixed a bug where supported parsing formats weren't dynamically updated when changing from `Checkout` to `REST` tabs.

## [1.1.0] - 2026-03-24

### Added
- **Floating Session Focus**: Relocated the session navigation pill to a premium floating fixed footer "above the block" for improved accessibility and to avoid content clashing.
- **Session Explorer Sidebar**: Extracted the session list into a dedicated `SessionExplorer` component for better modularity.
- **Enhanced Glassmorphism**: Updated the UI with richer backdrop blurs, ring borders, and multi-layered shadows for a more high-end feel.

### Changed
- **Modular Architecture**: Significant refactoring of `CheckoutTimeline.vue`:
  - Extracted core session logic into the `useCheckoutSessions` composable.
  - Deployed new sub-components: `SessionExplorer.vue` and `SessionFocusPill.vue`.
  - Reduced main component complexity and file size by over 60%.


## [1.0.1] - 2026-03-24

### Changed
- **UI/UX Overhaul**: Completely redesigned the core visualization components for a more premium, modern, and navigable experience:
  - `LogCard.vue`: Improved typography, layout, and added smooth CSS Grid accordion animations.
  - `CheckoutBody.vue`: Replaced the tags UI with structured data grids, visual state transition pipelines, and Mac-style terminal code blocks for payloads.
  - `LogUploader.vue`: Added a clear empty-state dropzone with drag-and-drop support, loading feedback for large files, and designated raw data areas.
  - `LogTimeline.vue`: Transformed into an "Explorer Layout" with a left sidebar for sessions and a sticky floating navigation pill for the active session.

## [1.0.0] - 2026-03-24

### Added
- Initial release of the Log Trace P2P analyzer.
- Support for Checkout and REST log parsing.
- BiomeJS integration for linting and formatting.
- GitHub Actions CI/CD pipeline with automated tags and releases.
- Vitest setup for unit testing.
- Type-safe log parsing integration with `@andrextor_ia11012/p2p-log-parser`.
