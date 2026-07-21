#!/usr/bin/env node
/**
 * Scan MCP catalog / mcp.json for secret-looking values.
 * Never prints secret values. Writes redacted copy on request.
 *
 * Usage:
 *   node scripts/mcp-catalog-scrub.js
 *   node scripts/mcp-catalog-scrub.js --write-redacted
 *   node scripts/mcp-catalog-scrub.js --mcp   # scan ~/.cursor/mcp.json too
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  CATALOG_PATH,
  MCP_PATH,
  QA_MCP_DIR,
  readJsonSafe,
  scanSecrets,
  redactSecrets,
} = require('./mcp-lib');

const writeRedacted = process.argv.includes('--write-redacted');
const scanMcp = process.argv.includes('--mcp');
const help = process.argv.includes('--help') || process.argv.includes('-h');

if (help) {
  console.log(`Usage: node scripts/mcp-catalog-scrub.js [--write-redacted] [--mcp]

  Scans catalog for live-looking secrets (field names only).
  --write-redacted  Write ~/.qa-agent/mcp/catalog.redacted.json
  --mcp             Also scan ~/.cursor/mcp.json`);
  process.exit(0);
}

function report(label, p) {
  if (!fs.existsSync(p)) {
    console.log(`${label}: missing (${p})`);
    return null;
  }
  const cfg = readJsonSafe(p, { mcpServers: {} });
  const hits = scanSecrets(cfg);
  console.log(`${label}: ${p}`);
  if (!hits.length) {
    console.log('  No secret-looking values detected (heuristic).');
  } else {
    console.log(`  Possible secrets in: ${hits.join(', ')}`);
    console.log('  Do not commit or paste this file into chat/PRs.');
  }
  return cfg;
}

const catalog = report('Catalog', CATALOG_PATH);
if (scanMcp) report('mcp.json', MCP_PATH);

if (writeRedacted && catalog) {
  fs.mkdirSync(QA_MCP_DIR, { recursive: true });
  const out = path.join(QA_MCP_DIR, 'catalog.redacted.json');
  fs.writeFileSync(out, JSON.stringify(redactSecrets(catalog), null, 2) + '\n', 'utf8');
  console.log('Wrote redacted copy:', out);
  console.log('(Original catalog unchanged.)');
}
