# WSL for **k6 runs** (optional fallback — not for installing QA Agent)

QA Agent installs on the **host** (Windows / macOS / Linux).

**Adaptive rule:** use **host `k6`** whenever it is on PATH. Use **WSL** only on Windows when host k6 is missing or blocked (corporate policy), or when pref `tooling.k6_runner=wsl`.

```bash
node scripts/resolve-k6.js          # see which runner wins
node scripts/resolve-k6.js --run -- run script.js
```

## Split (when WSL is needed)

| What | Where |
|------|--------|
| Cursor + QA Agent + MCP | Host OS |
| `k6 run …` | Host if available, else **WSL** Ubuntu on Windows |

macOS / Linux teammates: install k6 on the host. No WSL required.

## Onboard: host or WSL

During `/qa onboard` tooling (Windows):

- **`2`** = k6 on Windows host (use if install is allowed)
- **`6`** = k6 in WSL (fallback when host install fails / blocked)

```bash
node scripts/setup-tooling.js                    # host tools
node scripts/setup-wsl-tooling.js --status
node scripts/setup-wsl-tooling.js --install --only k6
# alias:
node scripts/setup-tooling.js --wsl --install --only k6
```

Does **not** auto-install Docker (enable Docker Desktop → WSL integration if you need it).

## Run a test (WSL path)

```bash
wsl -d Ubuntu -- bash -lc "cd /path/to/perf-repo && k6 run script.js"
```

Set `paths.perf_tests` to a path reachable from the chosen runner (host path, or `/home/...` / `/mnt/c/...` for WSL).

## Checklist (Windows + blocked host k6)

1. WSL2 + Ubuntu (`wsl --install -d Ubuntu` if needed)
2. Onboard → tooling → pick **6** (or host **2** if allowed)
3. Verify: `node scripts/resolve-k6.js` (or `wsl -- k6 version`)
4. Point `paths.perf_tests` at the perf repo

Related: [FIRST_RUN.md](FIRST_RUN.md) · [MCP.md](MCP.md) · `@qa-perf-test` · `scripts/resolve-k6.js`
