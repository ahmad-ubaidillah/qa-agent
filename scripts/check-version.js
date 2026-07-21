#!/usr/bin/env node
/**
 * Compare local VERSION to remote (default: mine/main or origin/main).
 *
 * Usage:
 *   node scripts/check-version.js
 *   node scripts/check-version.js --remote mine
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const remoteName = (() => {
  const i = process.argv.indexOf('--remote');
  return i >= 0 ? process.argv[i + 1] : null;
})();

function localVersion() {
  const p = path.join(REPO, 'VERSION');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : 'unknown';
}

function pickRemote() {
  if (remoteName) return remoteName;
  const r = spawnSync('git', ['remote'], { encoding: 'utf8', cwd: REPO });
  const remotes = (r.stdout || '').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (remotes.includes('mine')) return 'mine';
  if (remotes.includes('origin')) return 'origin';
  return remotes[0] || null;
}

function remoteVersion(remote) {
  const r = spawnSync(
    'git',
    ['ls-remote', remote, 'refs/heads/main', 'refs/heads/master'],
    { encoding: 'utf8', cwd: REPO }
  );
  if (r.status !== 0) return { ok: false, err: (r.stderr || '').trim() };
  const line = (r.stdout || '').split(/\r?\n/).find((l) => l.includes('refs/heads/'));
  if (!line) return { ok: false, err: 'no main/master on remote' };
  const sha = line.split(/\s+/)[0];
  const show = spawnSync('git', ['show', `${sha}:VERSION`], {
    encoding: 'utf8',
    cwd: REPO,
  });
  // ls-remote only gives sha — local may not have object. Fetch tip file via sparse:
  if (show.status === 0 && (show.stdout || '').trim()) {
    return { ok: true, version: show.stdout.trim(), sha };
  }
  // Fallback: compare to remote-tracking branch if present
  for (const branch of ['main', 'master']) {
    const ref = `${remote}/${branch}`;
    const cat = spawnSync('git', ['show', `${ref}:VERSION`], {
      encoding: 'utf8',
      cwd: REPO,
    });
    if (cat.status === 0 && (cat.stdout || '').trim()) {
      return { ok: true, version: cat.stdout.trim(), sha: ref };
    }
  }
  return {
    ok: false,
    err: 'Could not read remote VERSION. Run: git fetch ' + remote,
    sha,
  };
}

const local = localVersion();
const remote = pickRemote();
console.log('QA Agent version check');
console.log(`  Local:  ${local}`);
if (!remote) {
  console.log('  Remote: (none configured)');
  process.exit(0);
}
console.log(`  Remote: ${remote}`);
const rv = remoteVersion(remote);
if (!rv.ok) {
  console.log(`  Status: unknown (${rv.err})`);
  process.exit(0);
}
console.log(`  Remote VERSION: ${rv.version}`);
if (rv.version === local) {
  console.log('  Status: up to date');
  process.exit(0);
}
console.log('  Status: DIFFERENT. Consider git pull / update.ps1');
process.exit(1);
