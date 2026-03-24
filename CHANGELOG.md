# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
