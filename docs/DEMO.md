# QA Agent - Demo Walkthrough

End-to-end smoke path after install. No tickets are created unless you explicitly approve.

Full setup: [SETUP.md](SETUP.md) · MCP: [MCP.md](MCP.md) · Docs index: [README.md](README.md)

## 0. Prerequisites

```bash
./install.sh          # or .\install.ps1 on Windows
node scripts/setup-mcp.js
node scripts/setup-git.js
node scripts/setup-tooling.js      # optional
node scripts/setup-prefs.js        # squad + paths
node scripts/check-version.js
node scripts/doctor.js
```

Switch profile:

```bash
node scripts/mcp-mode.js full
```

1. Prefer setup scripts over hand-copying templates.
2. Reload Cursor after MCP changes.
3. Select **@qa** or type `/qa`.

> Do **not** commit `~/.cursor/mcp.json` or catalogs with secrets.

## 1. Health check

```bash
node scripts/doctor.js
```

Expect: Node, store, mcp-mode, skills, rules, MCP, Git identity, optional CLI tooling.

## 2. Project mapping (first time)

```
/qa scan project
```

Fill TestRail section map + `paths.*` (or `node scripts/setup-prefs.js`).

## 3. Skill smoke matrix (read-only / draft only)

| Prompt | Skill | Expect |
|--------|-------|--------|
| `search tickets about <error>` | `@qa-search-tickets` | Shortcut hits, citations. No create |
| `triage <incident>` / paste bug | `@qa-defect-triage` | Draft only until ACC |
| `create test cases for story <id>` | `@qa-test-cases` | Plan > ≤5 drafts > wait ACC. Titles `When …, then …` |
| `mark results on plan <id>` | `@qa-test-execution` | Uses TestRail results APIs per skill |
| `automate case C12345` | `@qa-ui-automation` | Needs `paths.ui_tests` |
| `api test for <endpoint>` | `@qa-api-test` | Needs `paths.api_tests` + Java/Maven |
| `perf test for story <id>` | `@qa-perf-test` | Needs `paths.perf_tests` + k6 |
| `visual check <url>` | `@qa-visual-test` | Local Playwright compare |
| `scan project` | `@qa-project-mapping` | Updates project-context |
| `run onboard` | entry / private onboard | Follows onboard.md or example stub |

## 4. Visual regression (optional)

See `@qa-visual-test`. Install visual deps if doctor warns.

## 5. Test cases (ACC gate)

```
/qa create test cases for story <SHORTCUT_ID>
```

Learn > Plan > draft batch ≤5 > **ACC** / EDIT / REJECT / DELETE. No `addCase` until ACC.

## 6. Automation paths

| Skill | Needs |
|-------|--------|
| `@qa-ui-automation` | `paths.ui_tests` |
| `@qa-api-test` | `paths.api_tests` + Java/Maven |
| `@qa-perf-test` | `paths.perf_tests` + k6 |

## 7. Onboard (CSG)

```
/qa onboard
```

Uses private `onboard.md` if present. Else [onboard.example.md](../onboard.example.md) + [ONBOARDING.md](ONBOARDING.md).

## Safety

- Never create Shortcut tickets or TestRail cases without explicit ACC.
- Never paste Vault passwords into chat.
- Never paste mcp.json / catalog into PRs.
