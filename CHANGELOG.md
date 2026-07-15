# Changelog

All notable changes to QA Agent are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project uses [SemVer](https://semver.org/).

## [1.1.0] - 2026-07-15

### Added
- `cache hash` CLI on `store.js`; `cor list` supports max score filter
- Project context template (`.cursor/templates/`)
- Installer copies `.cursor/references/` and offers visual npm install on Windows
- `scripts/doctor.js` health check
- `update.ps1` / `update.sh` and `uninstall.ps1` / `uninstall.sh`
- `mcp.json.example` (no secrets)
- `docs/DEMO.md` walkthrough
- Visual compare smoke test + CI job
- `LICENSE` (MIT), `CONTRIBUTING.md`, PR template
- This `CHANGELOG.md` and `VERSION` file

### Changed
- MCP tool names synced to live Shortcut / TestRail / Playwright / Cypress APIs
- Visual temp paths use `os.tmpdir()` (Windows-safe)
- `@qa` agent file is a thin pointer to `AGENTS.md` (single source of truth)
- Org-specific hardcodes replaced with project-memory placeholders
- Token-efficiency section describes design intent (not unverified %)

### Fixed
- Negative correction lookup (`cor list domain -999 -1`)
- Documentation drift (agent filename, Karate roadmap status)

## [1.0.0] - 2026-07-13

### Added
- Initial modular skills, memory store, installers, visual regression skill
