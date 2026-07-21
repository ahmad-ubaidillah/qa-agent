#!/usr/bin/env node
/**
 * Interactive prefs wizard: squad + UI/API/perf paths + project-context hints.
 *
 * Usage:
 *   node scripts/setup-prefs.js
 *   node scripts/setup-prefs.js --non-interactive   # print current only
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { spawnSync } = require('child_process');

const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir();
const STORE = path.join(HOME, '.qa-agent', 'lib', 'store.js');
const REPO = path.resolve(__dirname, '..');

function ask(rl, q, def) {
  const hint = def ? ` [${def}]` : '';
  return new Promise((resolve) => {
    rl.question(`${q}${hint}: `, (ans) => {
      const t = (ans || '').trim();
      resolve(t || def || '');
    });
  });
}

function store(...args) {
  if (!fs.existsSync(STORE)) {
    console.error('Missing', STORE, '- run installer first');
    process.exit(1);
  }
  const r = spawnSync(process.execPath, [STORE, ...args], {
    encoding: 'utf8',
    cwd: process.cwd(),
    env: { ...process.env },
  });
  if (r.status !== 0) {
    console.error((r.stderr || r.stdout || '').trim() || `store failed: ${args.join(' ')}`);
  }
  return (r.stdout || '').trim();
}

function prefGet(key) {
  const out = store('pref', 'get', key, '--project', 'auto');
  if (!out || out === 'null') return '';
  try {
    const j = JSON.parse(out);
    return typeof j === 'string' ? j : String(j);
  } catch {
    return out.replace(/^"|"$/g, '');
  }
}

function prefSet(key, val) {
  store('pref', 'set', key, val, '--project', 'auto');
}

function updateProjectContext({ squad, ui, api, perf }) {
  const ctx = path.join(process.cwd(), '.cursor', 'qa-memory', 'project-context', 'current.md');
  if (!fs.existsSync(ctx)) {
    const tpl = path.join(REPO, '.cursor', 'templates', 'project-context.current.md');
    if (fs.existsSync(tpl)) {
      fs.mkdirSync(path.dirname(ctx), { recursive: true });
      fs.copyFileSync(tpl, ctx);
    } else {
      console.log('No project-context yet. Run from a mapped project or @qa-project-mapping.');
      return;
    }
  }
  let text = fs.readFileSync(ctx, 'utf8');
  const today = new Date().toISOString().slice(0, 10);
  text = text.replace(/\*\*Last updated:\*\*.*/, `**Last updated:** ${today}`);
  if (squad) {
    text = text.replace(
      /\| Squad \/ team[^\|]*\|[^\|]*\|/,
      `| Squad / team (Shortcut + TestRail + PR \`[Squad]\`) | ${squad} |`
    );
  }
  // Best-effort path table lines — append note if blank cells remain
  const note = [
    '',
    '<!-- setup-prefs.js -->',
    squad ? `- squad.name: ${squad}` : '',
    ui ? `- paths.ui_tests: ${ui}` : '',
    api ? `- paths.api_tests: ${api}` : '',
    perf ? `- paths.perf_tests: ${perf}` : '',
    '',
  ]
    .filter(Boolean)
    .join('\n');
  if (!text.includes('<!-- setup-prefs.js -->')) {
    text = text.trimEnd() + '\n' + note + '\n';
  }
  fs.writeFileSync(ctx, text, 'utf8');
  console.log('Updated', ctx);
  store('proj', 'sync');
}

async function main() {
  const nonInteractive = process.argv.includes('--non-interactive') || !process.stdin.isTTY;
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`Usage: node scripts/setup-prefs.js [--non-interactive]

Sets project prefs: squad.name, paths.ui_tests, paths.api_tests, paths.perf_tests.
Also patches .cursor/qa-memory/project-context/current.md when present.`);
    return;
  }

  store('proj', 'ensure');
  const cur = {
    squad: prefGet('squad.name'),
    ui: prefGet('paths.ui_tests'),
    api: prefGet('paths.api_tests'),
    perf: prefGet('paths.perf_tests'),
  };
  console.log('QA Agent prefs wizard');
  console.log(`  Home: ${HOME}`);
  console.log(`  CWD:  ${process.cwd()}`);
  console.log('');
  console.log('Current:');
  console.log(`  squad.name:       ${cur.squad || '(empty)'}`);
  console.log(`  paths.ui_tests:   ${cur.ui || '(empty)'}`);
  console.log(`  paths.api_tests:  ${cur.api || '(empty)'}`);
  console.log(`  paths.perf_tests: ${cur.perf || '(empty)'}`);

  if (nonInteractive) {
    console.log('\nRe-run without --non-interactive to edit.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\nEnter to keep current.\n');
  const squad = await ask(rl, 'Squad / team name', cur.squad);
  const ui = await ask(rl, 'UI tests absolute path', cur.ui);
  const api = await ask(rl, 'API tests absolute path', cur.api);
  const perf = await ask(rl, 'Perf tests absolute path', cur.perf);
  rl.close();

  if (squad) prefSet('squad.name', squad);
  if (ui) prefSet('paths.ui_tests', ui);
  if (api) prefSet('paths.api_tests', api);
  if (perf) prefSet('paths.perf_tests', perf);

  updateProjectContext({ squad, ui, api, perf });
  console.log('\nSaved prefs (project scope). Next: node scripts/doctor.js');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
