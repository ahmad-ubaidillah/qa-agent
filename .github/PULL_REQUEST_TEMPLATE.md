## Summary
<!-- What changed and why (1–3 bullets) -->

-

## Type
- [ ] Bug fix
- [ ] Enhancement / feature
- [ ] Docs / skills
- [ ] Installer / tooling
- [ ] CI / tests

## Test plan
- [ ] `node scripts/doctor.js`
- [ ] `node scripts/store.test.js`
- [ ] `cd .cursor/skills/qa-visual-test/scripts && npm ci && node compare.test.js` (if visual changes)
- [ ] Manual: briefly describe chat/@qa check if skill behavior changed

## Checklist
- [ ] `AGENTS.md` is still the single source of truth (no duplicated protocol in `qa.md`)
- [ ] MCP tool names match `.cursor/MCP_TOOLS.md`
- [ ] `CHANGELOG.md` / `VERSION` updated if user-facing
- [ ] No secrets or `.cursor/qa-memory/` committed
