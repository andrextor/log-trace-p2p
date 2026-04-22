# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.2] - 2026-04-21

### Changed
- **Timeline Layout**: Transitioned the timeline visualization from a constrained zigzag layout to a full-width vertical backbone, improving screen real estate utilization.
- **Log Cards Aesthetics**: Refined the visual hierarchy of log cards, enlarging primary log messages and softening metadata for cleaner scannability. Added category-specific icons (upload, download, error, user action) for immediate recognition.
- **Log Parsing Engine**: Bumped `p2p-log-parser` dependency to `1.2.3` to incorporate improved "Frontend Request" descriptions and robust source identification.

### Added
- **Interactive Sticky Headers**: Timeline headers are now clickable buttons that trigger smooth scrolling (`scrollIntoView`) back to the start of their corresponding log block.
- **Quick-Copy Metadata**: The "Essential Identifiers" (Trace Hash, Reference, Tenant) at the bottom of the log cards now act as one-click copy buttons with instant visual success feedback, replacing the previous session-filtering behavior.
- **Copy Raw Log**: Introduced a hover-activated button on the raw log indicator to easily copy the unformatted log title directly to the clipboard.

### Fixed
- **UI Styling**: Resolved a typo (`group/terminall`) in the JSON payload viewer component.

## [1.2.1] - 2026-03-30
### Added
- **Timeline Session Context**: The `TimelineHeader` now elegantly displays the extracted `TENANT_DOMAIN` and the current `session_id` as a badge whenever a specific Session is actively filtered or is perfectly singular in the file.

### Fixed
- **Trace Context Extraction**: Enhanced `isMatch` to comprehensively query nested JSON properties (like `context.session_id` or `payload.session_id`), allowing non-standard formats (such as raw Grafana logs) to appropriately funnel down to their respective Sessions Explorer instances.
- **Library Parser Overrides**: Explicitly enforced `appType` bindings inside the log store to prevent the `p2p-log-parser` engine from inadvertently miscategorizing `Checkout` traces into the `REST` domain tabs.
- **Standalone Traces Auto-Selection**: Isolated, standalone logs uploaded without generating dedicated global `metadata` now cleanly fallback by pushing their discovered IDs to the store. This flawlessly triggers the Session UI logic.

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
