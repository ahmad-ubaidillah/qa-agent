# QA Agent — Demo Walkthrough

End-to-end smoke path after install. No tickets are created unless you explicitly approve.

## 0. Prerequisites

```bash
# From repo root
./install.sh          # or .\install.ps1 on Windows
node scripts/doctor.js
```

1. Copy `mcp.json.example` → `~/.cursor/mcp.json` and fill credentials (never commit that file).
2. Restart Cursor.
3. Select **@qa** in the agent dropdown.

## 1. Health check

In a terminal:

```bash
node scripts/doctor.js
```

Expect checks for Node, `store.js`, skills, references, agent, and MCP config presence.

## 2. Project mapping (first time in a real app repo)

In Cursor chat (`@qa`):

```
scan project structure
```

Confirm `.cursor/qa-memory/project-context/current.md` is filled (or start from the install template).

## 3. Search tickets (read-only)

```
search tickets about NullPointerException in quote generation
```

Expected agent behavior:
1. Expand queries → `cache hash` / `cache get`
2. Call Shortcut `stories-search`
3. If empty/error → Glean `search` fallback
4. Show scored table (see `@qa-search-tickets` rubric)
5. Ask: APPROVE / NARROW / EXPAND — no writes without approval

## 4. Visual regression (optional, local Node)

```bash
cd .cursor/skills/qa-visual-test/scripts
npm install
npx playwright install chromium
node run.js init
# edit visual-test.config.json → your staging URL
node run.js --update-baselines   # first run
node run.js
```

Or in chat: `run visual test on the login page`.

## 5. Test case generation (preview only)

```
create test cases for story <ID> — positive + negative, preview only
```

Approve only if you want cases saved to TestRail.

## Done

You have verified: install → doctor → skills routing → memory cache path → MCP search → approval gates.

More: `README.md`, `AGENTS.md`, `.cursor/MCP_TOOLS.md`.
