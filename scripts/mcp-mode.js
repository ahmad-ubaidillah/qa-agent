#!/usr/bin/env node
/**
 * Switch Cursor MCP profile: lite | full | optional | all | status
 *
 * Before full/optional: merges missing servers from mcp.json.example into catalog
 * (keeps existing secrets). Warns if catalog looks like it contains live tokens.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir();
const REPO_LIB = path.join(__dirname, 'mcp-lib.js');
const HOME_LIB = path.join(HOME, '.qa-agent', 'lib', 'mcp-lib.js');
const lib = require(fs.existsSync(REPO_LIB) ? REPO_LIB : HOME_LIB);

const {
  MCP_PATH,
  QA_MCP_DIR,
  CATALOG_PATH,
  FULL,
  resolveProfileKeys,
  readJsonSafe,
  seedCatalogFromExamples,
  ensureProfileServersInCatalog,
  scanSecrets,
} = lib;

const backupDir = path.join(QA_MCP_DIR, 'backups');
const statePath = path.join(QA_MCP_DIR, 'active-profile.txt');

function repoRoot() {
  if (fs.existsSync(path.join(__dirname, '..', 'mcp.json.example'))) {
    return path.resolve(__dirname, '..');
  }
  // installed under ~/.qa-agent/lib — find via env or cwd
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'mcp.json.example'))) return cwd;
  return path.resolve(__dirname, '..');
}

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function ensureCatalog() {
  fs.mkdirSync(QA_MCP_DIR, { recursive: true });
  fs.mkdirSync(backupDir, { recursive: true });
  if (fs.existsSync(CATALOG_PATH)) return;
  const seeded = seedCatalogFromExamples(repoRoot());
  if (seeded.seeded) {
    console.log('Catalog seeded from mcp.json.example (+ optional):', CATALOG_PATH);
    return;
  }
  if (fs.existsSync(MCP_PATH)) {
    fs.copyFileSync(MCP_PATH, path.join(backupDir, `mcp.${stamp()}.json`));
    fs.copyFileSync(MCP_PATH, CATALOG_PATH);
    console.log('Catalog created from current mcp.json:', CATALOG_PATH);
    return;
  }
  console.error('Missing catalog and mcp.json. Run: node scripts/setup-mcp.js');
  process.exit(1);
}

function warnSecrets(label, cfg) {
  const hits = scanSecrets(cfg);
  if (!hits.length) return;
  console.log(`Warning: ${label} may contain live secrets (${hits.length} field(s)).`);
  console.log('  Do not commit or share this file. Redacted copy:');
  console.log('  node scripts/mcp-catalog-scrub.js');
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function normalizeMode(raw) {
  let mode = (raw || 'status').toLowerCase();
  if (mode === 'normal' || mode === 'pro' || mode === 'ultra') {
    console.log(`Note: '${mode}' → full (recommended 6-server set). Use 'all' for entire catalog.`);
    mode = 'full';
  }
  return mode;
}

function applyProfile(profile) {
  if (profile === 'full' || profile === 'optional') {
    const ens = ensureProfileServersInCatalog(repoRoot(), {
      optional: profile === 'optional',
    });
    if (ens.added.length) {
      console.log('Catalog filled missing servers:', ens.added.join(', '));
      console.log('  (placeholders from mcp.json.example — fill keys via setup-mcp if needed)');
    }
  }

  const catalog = readJsonSafe(CATALOG_PATH, { mcpServers: {} });
  warnSecrets('catalog', catalog);

  let keys = resolveProfileKeys(profile, catalog);
  if (profile === 'full' && keys.length < FULL.length) {
    console.error(
      `full profile incomplete (${keys.length}/${FULL.length}). Missing:`,
      FULL.filter((k) => !keys.includes(k)).join(', ')
    );
    process.exit(1);
  }
  if (!keys.length) {
    console.error('Profile resolved to zero servers:', profile);
    console.error('Catalog keys:', Object.keys(catalog.mcpServers || {}).join(', ') || '(none)');
    process.exit(1);
  }
  if (fs.existsSync(MCP_PATH)) {
    fs.copyFileSync(MCP_PATH, path.join(backupDir, `mcp.before-${profile}.${stamp()}.json`));
  }
  const mcpServers = {};
  for (const k of keys) mcpServers[k] = catalog.mcpServers[k];
  fs.mkdirSync(path.dirname(MCP_PATH), { recursive: true });
  writeJson(MCP_PATH, { mcpServers });
  fs.writeFileSync(statePath, profile, 'utf8');
  console.log('MCP profile:', profile);
  console.log('Active servers:', keys.join(', '));
  console.log('Reload Cursor window for this to take effect.');
}

function status() {
  ensureCatalog();
  ensureProfileServersInCatalog(repoRoot(), { optional: false });
  const catalog = readJsonSafe(CATALOG_PATH, { mcpServers: {} });
  warnSecrets('catalog', catalog);
  const active = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8').trim() : '(unknown)';
  let current = [];
  if (fs.existsSync(MCP_PATH)) {
    current = Object.keys(readJsonSafe(MCP_PATH, {}).mcpServers || {});
  }
  console.log('Active profile file:', active);
  console.log(`mcp.json servers (${current.length}):`, current.join(', ') || '(none)');
  console.log('Catalog:', Object.keys(catalog.mcpServers || {}).join(', ') || '(none)');
  console.log(`Full set ready: ${FULL.every((k) => (catalog.mcpServers || {})[k]) ? 'yes' : 'no'}`);
  console.log('Profiles: lite | full (default set) | optional (+k6/karate) | all (entire catalog)');
}

const mode = normalizeMode(process.argv[2]);
const PROFILES = { lite: 1, full: 1, optional: 1, all: 1, status: 1 };

if (mode === 'status' || mode === 'help' || mode === '-h' || mode === '--help') {
  if (mode !== 'status') {
    console.log(`Usage: node scripts/mcp-mode.js [lite|full|optional|all|status]

  lite       Shortcut, TestRail, Glean
  full       + Context7, Cypress, Playwright (ensures catalog has all 6)
  optional   full + k6 + karate (if/ensured in catalog)
  all        every key in catalog
  normal     alias of full
  status     show active / catalog`);
    process.exit(0);
  }
  status();
  process.exit(0);
}

ensureCatalog();
if (!PROFILES[mode]) {
  console.error('Usage: node scripts/mcp-mode.js [lite|full|optional|all|status]');
  process.exit(1);
}
applyProfile(mode);
