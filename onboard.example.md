# QA Agent onboard (public stub)

> **This file is safe to commit.** It does **not** contain org-private process, vault paths, or credentials.

## First-time (important)

`/qa onboard` only works **after** Cursor loads the QA command. New clones must:

1. Open this **qa-agent** folder in Cursor  
2. Run `.\install.ps1` or `./install.sh` (WSL: see [docs/WSL.md](docs/WSL.md))  
3. **Reload Window**  
4. Then type `/qa onboard`  

Details: [docs/FIRST_RUN.md](docs/FIRST_RUN.md)

```bash
node scripts/onboard-progress.js --resume
node scripts/onboard-status.js
```

## Clone

```bash
git clone https://github.com/ahmadcsgi/qa-agent.git
cd qa-agent
```

| OS | Install |
|----|---------|
| Windows | `.\install.ps1` |
| macOS / Linux / WSL | `chmod +x install.sh && ./install.sh` |

## After install + Reload

**Chat (recommended):** `/qa onboard`  
Flow: resume → learn table → tooling OK/MISS → spaced form → apply → Reload if needed.

**Terminal:**

```bash
node scripts/onboard-wizard.js --resume
node scripts/onboard-wizard.js --print-learn
node scripts/onboard-wizard.js --print-tools
node scripts/onboard-wizard.js --print-form
node scripts/onboard-wizard.js --apply --squad "MyTeam" --ui "/path/to/ui" --tools skip
```

## Private org overlay

Optional `onboard.md` (gitignored) for company-specific hubs / triage. Share offline only. Never push.

| Public (this repo) | Private (offline only) |
|--------------------|------------------------|
| `onboard.example.md` (this file) | `onboard.md` |
| `docs/FIRST_RUN.md`, `docs/SETUP.md`, `docs/WSL.md` | Org URLs, templates |

## Version

Local: [`VERSION`](VERSION). Compare: `node scripts/check-version.js`.

## Next docs

- [docs/FIRST_RUN.md](docs/FIRST_RUN.md)  
- [docs/WSL.md](docs/WSL.md)  
- [docs/SETUP.md](docs/SETUP.md)  
- [docs/MCP.md](docs/MCP.md)  
- [docs/DEMO.md](docs/DEMO.md)  
- [docs/ONBOARDING.md](docs/ONBOARDING.md)  
- [AGENTS.md](AGENTS.md)  
