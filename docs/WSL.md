# WSL install (Cursor on Windows + Linux shell)

Cursor **can** work with WSL. Recommended pattern: Cursor app on Windows, project opened via **WSL remote** (or `\\wsl$\...`).

## What runs where

| Piece | Typical location |
|-------|------------------|
| Cursor UI | Windows |
| Agent terminal / `node` scripts | **WSL** (if folder opened as WSL) |
| `~/.qa-agent/` memory | WSL home (`/home/<you>/.qa-agent`) when install runs in WSL |
| `~/.cursor/mcp.json` | Often still **Windows** `%USERPROFILE%\.cursor\mcp.json` (Cursor host) |
| UI/API/perf test repos | Prefer Linux paths inside WSL (`/home/...`) |

MCP servers started by Cursor usually inherit the **host** Node/`npx`. Paths in MCP env (e.g. `CYPRESS_PROJECT_PATH`) must be reachable from that process. If Cypress runs only in WSL, prefer WSL paths and a WSL Node on PATH, or keep the UI test repo on a path both can see.

## Install in WSL

```bash
# Inside WSL
git clone https://github.com/ahmadcsgi/qa-agent.git
cd qa-agent
chmod +x install.sh && ./install.sh
node scripts/onboard-wizard.js   # or /qa onboard after Reload
```

Open the same folder in Cursor: **Remote-WSL: Open Folder** → `/home/.../qa-agent`.

Then: **Reload Window**.

## Windows-only install (alternative)

If you stay on Windows filesystem (`C:\...`) without Remote-WSL:

```powershell
.\install.ps1
```

Do **not** mix: install memory on Windows then expect WSL `~/.qa-agent` to match (different homes).

## Path prefs

Use absolute **WSL** paths when the agent shell is Linux:

```text
/home/you/work/ui-tests
/home/you/work/api-tests
```

Multi: `pathA|pathB` still works.

## Checklist

1. WSL2 + Node 18+ inside WSL (`node -v`)
2. `install.sh` in WSL
3. Open folder via Remote-WSL
4. Reload
5. `/qa onboard` → fill paths as WSL absolut paths
6. If MCP TestRail fails: confirm tokens in the mcp.json Cursor actually loads (often Windows `~/.cursor/mcp.json`)

Related: [FIRST_RUN.md](FIRST_RUN.md) · [MCP.md](MCP.md)
