#!/usr/bin/env node
/**
 * Adaptive k6 runner:
 *   1. Inside WSL terminal → prioritize local k6 (native, no nested wsl --)
 *   2. Else host PATH k6
 *   3. Else Windows → WSL bridge (wsl -- k6)
 *
 *   node scripts/resolve-k6.js
 *   node scripts/resolve-k6.js --json
 *   node scripts/resolve-k6.js --run -- run script.js
 *
 * Pref: tooling.k6_runner = auto|host|wsl
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

/** True when Node itself is running inside a WSL distro (not Windows host). */
function isInsideWsl() {
  // Windows-hosted Node is never "inside" WSL (even if WSLENV is set for interop)
  if (process.platform === 'win32') return false;
  if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) return true;
  if (process.platform === 'linux') {
    try {
      const ver = fs.readFileSync('/proc/version', 'utf8');
      if (/microsoft|wsl/i.test(ver)) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
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

/** k6 via Windows → WSL bridge (only when not already inside WSL). */
function wslBridgeK6Ok() {
  if (isInsideWsl() || process.platform !== 'win32') return false;
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
 *   invoke: 'native'|'wsl-bridge'|'',
 *   reason: string,
 *   host: boolean,
 *   wsl: boolean,
 *   insideWsl: boolean,
 *   prefer: string,
 *   installHint: string,
 *   runExample: string
 * }}
 */
function resolveK6() {
  const preferRaw = (readPref('tooling.k6_runner') || 'auto').toLowerCase();
  const prefer = ['auto', 'host', 'wsl'].includes(preferRaw) ? preferRaw : 'auto';
  const insideWsl = isInsideWsl();
  const host = hostK6Ok();
  const bridge = wslBridgeK6Ok();
  // "wsl available" for status: local k6 while inside WSL, else bridge
  const wsl = insideWsl ? host : bridge;

  const installHost =
    process.platform === 'win32' && !insideWsl
      ? 'node scripts/setup-tooling.js  (pick k6 / option 2)'
      : process.platform === 'darwin'
        ? 'brew install k6  or  node scripts/setup-tooling.js'
        : 'sudo apt install / Grafana apt, or from Windows: node scripts/setup-wsl-tooling.js --install --only k6';
  const installWsl = 'node scripts/setup-wsl-tooling.js --install --only k6  (onboard tooling 6)';

  const base = { host, wsl, insideWsl, prefer };

  if (prefer === 'host') {
    if (host) {
      return {
        ...base,
        runner: 'host',
        invoke: 'native',
        reason: 'pref tooling.k6_runner=host',
        installHint: '',
        runExample: 'k6 run script.js',
      };
    }
    return {
      ...base,
      runner: 'missing',
      invoke: '',
      reason: 'pref host but k6 not on PATH',
      installHint: installHost,
      runExample: '',
    };
  }

  if (prefer === 'wsl') {
    if (insideWsl && host) {
      return {
        ...base,
        runner: 'wsl',
        invoke: 'native',
        reason: 'pref wsl + inside WSL terminal',
        installHint: '',
        runExample: 'k6 run script.js',
      };
    }
    if (!insideWsl && bridge) {
      return {
        ...base,
        runner: 'wsl',
        invoke: 'wsl-bridge',
        reason: 'pref tooling.k6_runner=wsl',
        installHint: '',
        runExample: "wsl -- bash -lc \"cd '<perf-dir>' && k6 run script.js\"",
      };
    }
    return {
      ...base,
      runner: 'missing',
      invoke: '',
      reason: insideWsl ? 'pref wsl but k6 not on PATH in this distro' : 'pref wsl but k6 not in WSL',
      installHint: insideWsl ? installHost : installWsl,
      runExample: '',
    };
  }

  // auto: inside WSL terminal → prioritize WSL/local k6
  if (insideWsl) {
    if (host) {
      return {
        ...base,
        runner: 'wsl',
        invoke: 'native',
        reason: 'inside WSL terminal',
        installHint: '',
        runExample: 'k6 run script.js',
      };
    }
    return {
      ...base,
      runner: 'missing',
      invoke: '',
      reason: 'inside WSL but k6 not on PATH',
      installHint: installHost,
      runExample: '',
    };
  }

  if (host) {
    return {
      ...base,
      runner: 'host',
      invoke: 'native',
      reason: 'k6 on host PATH',
      installHint: '',
      runExample: 'k6 run script.js',
    };
  }
  if (bridge) {
    return {
      ...base,
      runner: 'wsl',
      invoke: 'wsl-bridge',
      reason: 'host k6 missing, WSL k6 available',
      installHint: '',
      runExample: "wsl -- bash -lc \"cd '<perf-dir>' && k6 run script.js\"",
    };
  }

  const hints = [installHost];
  if (process.platform === 'win32') hints.push(`or fallback: ${installWsl}`);
  return {
    ...base,
    runner: 'missing',
    invoke: '',
    reason: 'no k6 on host' + (process.platform === 'win32' ? ' or WSL' : ''),
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
  if (r.invoke === 'wsl-bridge') {
    cmd = 'wsl';
    args = ['--', 'k6', ...(k6Args.length ? k6Args : ['version'])];
  } else {
    cmd = 'k6';
    args = k6Args.length ? k6Args : ['version'];
    shell = true;
  }
  console.error(`Using k6 via ${r.runner}/${r.invoke || 'native'} (${r.reason})`);
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

Auto order: inside WSL → host PATH → Windows WSL bridge
Pref: tooling.k6_runner = auto | host | wsl`);
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
  console.log(`  prefer:     ${info.prefer}`);
  console.log(`  insideWsl:  ${info.insideWsl ? 'yes' : 'no'}`);
  console.log(`  host:       ${info.host ? 'yes' : 'no'}`);
  console.log(`  wsl:        ${info.wsl ? 'yes' : 'no'}`);
  console.log(`  pick:       ${info.runner}${info.invoke ? '/' + info.invoke : ''}${info.reason ? ` (${info.reason})` : ''}`);
  if (info.runExample) console.log(`  example:    ${info.runExample}`);
  if (info.installHint) console.log(`  install:    ${info.installHint}`);
}

module.exports = {
  resolveK6,
  hostK6Ok,
  wslK6Ok: wslBridgeK6Ok,
  wslBridgeK6Ok,
  isInsideWsl,
};

if (require.main === module) main();
