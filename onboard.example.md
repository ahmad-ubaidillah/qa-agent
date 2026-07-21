# QA Agent onboard (public stub)

> **This file is safe to commit.** It does **not** contain CSG/DGIT private process, Vault paths, or credentials.

## Clone

```bash
git clone https://github.com/ahmadcsgi/qa-agent.git
cd qa-agent
```

| OS | Install |
|----|---------|
| Windows | `.\install.ps1` |
| macOS / Linux | `chmod +x install.sh && ./install.sh` |

## After install

```bash
node scripts/setup-mcp.js          # full MCP (default)
node scripts/setup-git.js
node scripts/setup-tooling.js      # optional: k6, Java, Maven
node scripts/setup-prefs.js        # squad + UI/API/perf paths
node scripts/check-version.js      # local vs remote VERSION
node scripts/doctor.js
```

Reload Cursor. Then `/qa` or `@qa`.

## Private CSG overlay

Teammates who need DGIT/Q&O specifics (triage hub, email tone, env portals, signing wiki) should get the **private** `onboard.md` **offline** (secure share / Confluence attachment / 1:1). That file is **gitignored** and must never be pushed.

| Public (this repo) | Private (offline only) |
|--------------------|------------------------|
| `onboard.example.md` (this file) | `onboard.md` |
| `docs/SETUP.md`, `docs/MCP.md`, `docs/DEMO.md` | Org URLs, Vault, Helix templates |

If you only have this stub: you can still install and use skills. Ask a teammate for private `onboard.md` when you need CSG overlay.

## Version

Local: see [`VERSION`](VERSION). Compare: `node scripts/check-version.js`.

## Next docs

- [docs/SETUP.md](docs/SETUP.md) — install end-to-end
- [docs/MCP.md](docs/MCP.md) — profiles, catalog, secrets
- [docs/DEMO.md](docs/DEMO.md) — smoke prompts
- [docs/ONBOARDING.md](docs/ONBOARDING.md) — how to share private onboard
- [AGENTS.md](AGENTS.md) — agent DNA
