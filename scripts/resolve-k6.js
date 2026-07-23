#!/usr/bin/env node
/**
 * Adaptive k6 runner: host first, WSL fallback on Windows only.
 *
 *   node scripts/resolve-k6.js           # human status
 *   node scripts/resolve-k6.js --json    # machine-readable
 *   node scripts/resolve-k6.js --run -- script.js [k6 args...]
 *
 * Pref override (optional): tooling.k6_runner = auto|host|wsl
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir();
const STORE = path.join(HOME, '.qa-agent', 'lib', 'store.js');

function readPref(key) {
  if (!fs.existsSync(STORE)) return '';
  const r = spawnSync(process.execPath, [STORE, 'pref', 'get', key, '--project', 'auto'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  return (r.stdout || '').trim().replace(/^"|"$/g, '');
}

function hostK6Ok() {
  for (const args of [['version'], ['--version']]) {
    const r = spawnSync('k6', args, { encoding: 'utf8', shell: true, windowsHide: true });
    if (r.status === 0) return true;
  }
  return false;
}

function wslAvailable() {
  if (process.platform !== 'win32') return false;
  const r = spawnSync('wsl', ['--status'], { encoding: 'utf8', windowsHide: true, timeout: 10000 });
  return r.status === 0 || /subsystem|version/i.test((r.stdout || '') + (r.stderr || ''));
}

function wslK6Ok() {
  if (!wslAvailable()) return false;
  const r = spawnSync('wsl', ['--', 'k6', 'version'], {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 15000,
  });
  const out = ((r.stdout || '') + (r.stderr || '')).trim();
  return r.status === 0 && /k6/i.test(out);
}

/**
 * @returns {{
 *   runner: 'host'|'wsl'|'missing',
 *   reason: string,
 *   host: boolean,
 *   wsl: boolean,
 *   prefer: string,
 *   installHint: string,
 *   runExample: string
 * }}
 */
function resolveK6() {
  const preferRaw = (readPref('tooling.k6_runner') || 'auto').toLowerCase();
  const prefer = ['auto', 'host', 'wsl'].includes(preferRaw) ? preferRaw : 'auto';
  const host = hostK6Ok();
  const wsl = wslK6Ok();

  const installHost =
    process.platform === 'win32'
      ? 'node scripts/setup-tooling.js  (pick k6 / option 2)'
      : process.platform === 'darwin'
        ? 'brew install k6  or  node scripts/setup-tooling.js'
        : 'node scripts/setup-tooling.js  (or Grafana apt)';
  const installWsl = 'node scripts/setup-wsl-tooling.js --install --only k6  (onboard tooling 6)';

  if (prefer === 'host') {
    if (host) {
      return {
        runner: 'host',
        reason: 'pref tooling.k6_runner=host',
        host,
        wsl,
        prefer,
        installHint: '',
        runExample: 'k6 run script.js',
      };
    }
    return {
      runner: 'missing',
      reason: 'pref host but k6 not on PATH',
      host,
      wsl,
      prefer,
      installHint: installHost,
      runExample: '',
    };
  }

  if (prefer === 'wsl') {
    if (wsl) {
      return {
        runner: 'wsl',
        reason: 'pref tooling.k6_runner=wsl',
        host,
        wsl,
        prefer,
        installHint: '',
        runExample: "wsl -- bash -lc \"cd '<perf-dir>' && k6 run script.js\"",
      };
    }
    return {
      runner: 'missing',
      reason: 'pref wsl but k6 not in WSL',
      host,
      wsl,
      prefer,
      installHint: installWsl,
      runExample: '',
    };
  }

  // auto
  if (host) {
    return {
      runner: 'host',
      reason: 'k6 on host PATH',
      host,
      wsl,
      prefer,
      installHint: '',
      runExample: 'k6 run script.js',
    };
  }
  if (wsl) {
    return {
      runner: 'wsl',
      reason: 'host k6 missing, WSL k6 available',
      host,
      wsl,
      prefer,
      installHint: '',
      runExample: "wsl -- bash -lc \"cd '<perf-dir>' && k6 run script.js\"",
    };
  }

  const hints = [installHost];
  if (process.platform === 'win32') hints.push(`or fallback: ${installWsl}`);
  return {
    runner: 'missing',
    reason: 'no k6 on host' + (process.platform === 'win32' ? ' or WSL' : ''),
    host,
    wsl,
    prefer,
    installHint: hints.join(' · '),
    runExample: '',
  };
}

function runWithResolved(k6Args) {
  const r = resolveK6();
  if (r.runner === 'missing') {
    console.error('k6 not found:', r.reason);
    if (r.installHint) console.error('Install:', r.installHint);
    process.exit(1);
  }
  let cmd;
  let args;
  let shell = false;
  if (r.runner === 'host') {
    cmd = 'k6';
    args = k6Args.length ? k6Args : ['version'];
    shell = true;
  } else {
    cmd = 'wsl';
    args = ['--', 'k6', ...(k6Args.length ? k6Args : ['version'])];
  }
  console.error(`Using k6 via ${r.runner} (${r.reason})`);
  const child = spawnSync(cmd, args, { stdio: 'inherit', shell, windowsHide: true });
  process.exit(child.status == null ? 1 : child.status);
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(`Usage:
  node scripts/resolve-k6.js
  node scripts/resolve-k6.js --json
  node scripts/resolve-k6.js --run [--] [k6 args...]

Pref: tooling.k6_runner = auto (default) | host | wsl`);
    return;
  }
  if (argv.includes('--run')) {
    const i = argv.indexOf('--run');
    let rest = argv.slice(i + 1);
    if (rest[0] === '--') rest = rest.slice(1);
    runWithResolved(rest);
    return;
  }
  const info = resolveK6();
  if (argv.includes('--json')) {
    console.log(JSON.stringify(info));
    return;
  }
  console.log('k6 runner (adaptive)');
  console.log(`  prefer:  ${info.prefer}`);
  console.log(`  host:    ${info.host ? 'yes' : 'no'}`);
  console.log(`  wsl:     ${info.wsl ? 'yes' : 'no'}`);
  console.log(`  pick:    ${info.runner}${info.reason ? ` (${info.reason})` : ''}`);
  if (info.runExample) console.log(`  example: ${info.runExample}`);
  if (info.installHint) console.log(`  install: ${info.installHint}`);
}

module.exports = { resolveK6, hostK6Ok, wslK6Ok };

if (require.main === module) main();
