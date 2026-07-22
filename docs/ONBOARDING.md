# Onboarding distribution (public vs private)

## How teammates get `/qa` the first time

1. Clone + open **qa-agent** in Cursor  
2. Run installer (`install.ps1` on Windows, `install.sh` on macOS/Linux/**WSL**)  
3. **Reload Window**  
4. `/qa onboard` (chat wizard)  

Or terminal: `node scripts/onboard-wizard.js`

WSL: see [WSL.md](WSL.md).

Without step 2–3, slash command / agent often missing. See [FIRST_RUN.md](FIRST_RUN.md).

Dry-run only: `node scripts/onboard-status.js` or `onboard-progress.js --resume`

## Primary path: onboard wizard

| Step | What |
|------|------|
| Resume / Ready | `onboard-wizard.js --resume` / `onboard-progress.js` |
| Learn table | Catalog vs active MCP + links from onboard.md |
| Tooling detect | OK/MISS before ask |
| Prefs | Squad + paths (multi `a\|b`) via spaced form or `--apply` |
| MCP | Install **full** into catalog once |
| Auto | `mcp.path_aware` + sessionStart hook + `mcp-mode auto` |
| Part C | Optional **private org** overlay if `onboard.md` present |

Chat (`/qa onboard`): TodoWrite ticks + resume → learn → tools → form → apply.  
Terminal: interactive `onboard-wizard.js`. Preview: `--dry-run`.

## Why two files?

| File | In git? | Audience |
|------|---------|----------|
| [`onboard.example.md`](../onboard.example.md) | Yes | Anyone cloning the repo |
| `onboard.md` | **No** (gitignore) | Org-private process only (share offline) |

Private onboard holds org-specific hubs, triage tone, env portals, and Ready checklists that should **not** live in a public repo.

Wizard parses links from whichever file exists (private preferred) into prefs `links.*` + knowledge.

## How to share private `onboard.md`

1. Maintainer keeps a current `onboard.md` locally (aligned with `VERSION`).
2. Share via **secure channel** only.
3. Recipient places the file at repo root: `qa-agent/onboard.md`.
4. In Cursor: `/qa onboard` or say **run onboard**.

Never:

- Commit `onboard.md`
- Paste passwords into it
- Attach it to a public PR

## Agent behaviour

When the user says **run onboard** / `/qa onboard`:

1. If `~/.qa-agent/lib/store.js` missing → [FIRST_RUN.md](FIRST_RUN.md). Stop.
2. Chat wizard: `--resume` → ask incomplete fields → `--apply`.
3. Prefer private `onboard.md` links if present (auto-parsed).
4. Else `onboard.example.md` + [SETUP.md](SETUP.md).
5. Do not dump secrets or boot JSON.

## Checklist for maintainers (before sharing private overlay)

- [ ] `VERSION` matches shipped tag/commit
- [ ] No live API keys in the private file
- [ ] Recipient told file is gitignored

See also: [SETUP.md](SETUP.md) · [DEMO.md](DEMO.md) · [MCP.md](MCP.md) · [WSL.md](WSL.md)
