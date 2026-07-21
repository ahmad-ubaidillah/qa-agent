# MCP guide

QA Agent uses Cursor MCP for Ticket / TestRail / docs / UI runners. Git, k6 CLI, and Maven/Karate are **not** required as MCP (skills use shell + `paths.*`).

## Files

| Path | Role |
|------|------|
| `~/.cursor/mcp.json` | **Active** servers Cursor loads |
| `~/.qa-agent/mcp/catalog.json` | Full catalog for profile switching (may contain secrets) |
| `~/.qa-agent/mcp/catalog.redacted.json` | Safe copy from scrub script |
| `~/.qa-agent/mcp/backups/` | Automatic backups before profile switch |
| `mcp.json.example` | Template for the recommended **full** set (6) |
| `mcp.json.optional.example` | Optional **k6** + **karate** |

Never commit personal mcp/catalog files.

## Profiles (`mcp-mode.js`)

```bash
node scripts/mcp-mode.js status
node scripts/mcp-mode.js full      # recommended
node scripts/mcp-mode.js lite
node scripts/mcp-mode.js optional  # full + k6 + karate
node scripts/mcp-mode.js all       # every key in catalog (e.g. github extras)
```

| Profile | Servers |
|---------|---------|
| lite | shortcut, testrail, glean |
| full | + context7, cypress, playwright |
| optional | full + k6, karate |
| all | entire catalog |
| normal | alias of **full** |

### Full always means 6

When you run `full` or `optional`, QA Agent **merges missing keys** from `mcp.json.example` into the catalog (placeholders only). Existing tokens are **not** overwritten. Then it activates that profile into `mcp.json`.

If Context7/Cypress/Playwright were missing from an old catalog, they appear after `mcp-mode.js full`. Fill empty keys:

```bash
node scripts/setup-mcp.js --full
```

## Setup flow

```bash
node scripts/setup-mcp.js              # prompts + writes mcp.json + syncs catalog
node scripts/mcp-mode.js full          # ensure 6 + activate
# Reload Cursor window
```

Path prefs auto-fill when set:

- `paths.ui_tests` → Cypress `CYPRESS_PROJECT_PATH`
- `paths.perf_tests` → k6 `K6_PROJECT_PATH`
- `paths.api_tests` → karate `KARATE_PROJECT_PATH`

```bash
node scripts/setup-prefs.js
```

## Optional k6 / Karate MCP

See [mcp.json.optional.md](../mcp.json.optional.md).

| Default skill path | Need MCP? |
|--------------------|-----------|
| `@qa-perf-test` + k6 CLI in `paths.perf_tests` | No |
| `@qa-api-test` + Maven in `paths.api_tests` | No |
| Want `k6 x mcp` / `karate mcp --stdio` in Cursor | Yes (`--with-optional`) |

## Secrets hygiene

Catalog often holds live API keys. Doctor and `mcp-mode status` **warn** (field names only, never values).

```bash
node scripts/mcp-catalog-scrub.js
node scripts/mcp-catalog-scrub.js --write-redacted
node scripts/mcp-catalog-scrub.js --mcp
```

`--write-redacted` writes `catalog.redacted.json` and leaves the original alone.

**Do not** paste catalog/mcp.json into chat, tickets, or PRs.

## Auth notes

| Server | Typical auth |
|--------|----------------|
| Shortcut | OAuth / Cursor MCP login |
| Glean | Org URL + SSO in Cursor |
| TestRail | username + API key in env |
| Context7 | API key in headers |
| Cypress | project path env |
| Playwright | npx server, usually no key |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Profile full but only 3 servers | `node scripts/mcp-mode.js full` then Reload |
| Placeholder TestRail | `node scripts/setup-mcp.js` |
| k6 MCP fails | Install k6 (`setup-tooling.js`) or remove k6 from mcp.json |
| karate MCP fails | Use Maven path instead, or install karate CLI |
| Stale catalog | Re-run `setup-mcp.js` (merge) or backup + reseed carefully |

Related: [SETUP.md](SETUP.md) · [MCP_TOOLS.md](../.cursor/MCP_TOOLS.md)
