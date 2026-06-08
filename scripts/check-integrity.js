#!/usr/bin/env node
/**
 * Integrity guard against JS malware injection.
 *
 * Scans the repository for known obfuscated-payload signatures — the kind that
 * appends a `require`/`module`-hijacking blob to config files such as
 * next.config.js or jest.config.js and self-executes whenever Node loads them.
 *
 * Wired into npm "pre" scripts (predev / prebuild / prestart / pretest) so it
 * runs automatically before the app or tests start. Exits with code 1 (which
 * aborts the triggering command) if anything suspicious is found.
 *
 * Run manually any time:  node scripts/check-integrity.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Directories we never scan (generated, vendored, or large binary output).
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'coverage',
  'uploads', '.turbo', 'out', '.cache'
]);

// Only text/code files can carry this payload.
const SCAN_EXT = new Set([
  '.js', '.cjs', '.mjs', '.jsx', '.ts', '.tsx', '.json'
]);

// Signatures of the known injection. A single match flags the file.
const SIGNATURES = [
  /global\s*\[\s*['"]!['"]\s*\]\s*=/,                       // global['!']=
  /var\s+_\$_\w+\s*=\s*\(\s*function\s*\(\s*l\s*,\s*e\s*\)/, // var _$_xxxx=(function(l,e)
  /global\s*\[[^\]]+\]\s*=\s*require\s*;/,                  // global[...]=require;
];

const infected = [];

function scanFile(file) {
  // Skip this scanner itself — it necessarily contains the very patterns it
  // searches for (signature regexes + example comments).
  if (path.resolve(file) === path.resolve(__filename)) return;
  let content;
  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  if (SIGNATURES.some((sig) => sig.test(content))) {
    infected.push(file);
  }
}

function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) walk(path.join(dir, entry.name));
    } else if (entry.isFile() && SCAN_EXT.has(path.extname(entry.name))) {
      scanFile(path.join(dir, entry.name));
    }
  }
}

walk(ROOT);

if (infected.length > 0) {
  console.error('\n\x1b[31m✖ SECURITY: malware-injection signature detected!\x1b[0m');
  console.error('  The following files contain a known obfuscated payload:\n');
  for (const f of infected) console.error('   - ' + path.relative(ROOT, f));
  console.error('\n  Aborting. Remove the injected code (everything after the legitimate');
  console.error('  module.exports / config object) before running. See SECURITY.md.\n');
  process.exit(1);
}

console.log('✓ Integrity check passed — no injection signatures found.');
