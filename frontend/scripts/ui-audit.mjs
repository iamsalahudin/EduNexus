import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_ROOT = path.resolve(process.cwd());
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src');
const COMPONENTS_ROOT = path.join(SRC_ROOT, 'components');

const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx']);

function walkFiles(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walkFiles(p));
    else if (ent.isFile() && CODE_EXTS.has(path.extname(ent.name))) out.push(p);
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function relFromSrc(absPath) {
  return toPosix(path.relative(SRC_ROOT, absPath));
}

function relFromFrontend(absPath) {
  return toPosix(path.relative(FRONTEND_ROOT, absPath));
}

function componentImportSpec(compRelFromSrc) {
  // compRelFromSrc like: components/ui/Button.js
  const noExt = compRelFromSrc.replace(/\.(js|jsx|ts|tsx)$/, '');
  const fromSrc = `@/${noExt}`;
  const fromComponents = `@/components/${noExt.replace(/^components\//, '')}`;
  // Most code uses @/components/... but keep both.
  return new Set([fromSrc, fromComponents]);
}

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function findImportStatements(text) {
  // Crude but effective. Captures `import ... from 'x'`.
  const out = [];
  const re = /\bimport\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/g;
  let m;
  while ((m = re.exec(text))) {
    out.push({ clause: m[1].trim(), spec: m[2] });
  }
  return out;
}

function isLikelyReactComponentFile(text) {
  // Heuristic: default export of a function/component, or a named function component.
  if (!text.includes('export default')) return false;
  if (/export\s+default\s+function\s+/m.test(text)) return true;
  if (/export\s+default\s*\(/m.test(text)) return true;
  if (/export\s+default\s+[A-Za-z0-9_]+\s*;/m.test(text)) return true;
  if (/return\s*\(\s*</m.test(text)) return true;
  return false;
}

function parseNamedImports(clause) {
  // Supports: { A, B as C }
  const m = clause.match(/\{([\s\S]*?)\}/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const parts = s.split(/\s+as\s+/i).map((p) => p.trim()).filter(Boolean);
      return parts[0];
    });
}

const componentFiles = walkFiles(COMPONENTS_ROOT)
  .filter((p) => !p.endsWith('/index.js') && !p.endsWith('/index.ts'))
  .filter((p) => isLikelyReactComponentFile(readText(p)));

const codeFiles = walkFiles(SRC_ROOT);

const componentRows = [];

for (const compAbs of componentFiles) {
  const compRelSrc = relFromSrc(compAbs); // components/...
  const specs = componentImportSpec(compRelSrc);

  const usedIn = [];
  for (const fileAbs of codeFiles) {
    if (fileAbs === compAbs) continue;
    const text = readText(fileAbs);
    const stmts = findImportStatements(text);

    let used = false;

    // Direct imports: import X from '@/components/...'
    if (stmts.some((s) => specs.has(s.spec))) used = true;

    // Barrel imports: import { Button, Card } from '@/components/ui'
    // Count only for ui components.
    if (!used && compRelSrc.startsWith('components/ui/')) {
      const compName = path.basename(compAbs).replace(/\.(js|jsx|ts|tsx)$/, '');
      for (const s of stmts) {
        if (s.spec === '@/components/ui' || s.spec === '@/components/ui/index') {
          const names = parseNamedImports(s.clause);
          if (names.includes(compName)) {
            used = true;
            break;
          }
        }
      }
    }

    if (used) usedIn.push(relFromFrontend(fileAbs));
  }

  const name = path.basename(compAbs).replace(/\.(js|jsx|ts|tsx)$/, '');
  componentRows.push({
    name,
    componentPath: relFromFrontend(compAbs),
    usageCount: usedIn.length,
    usedIn: usedIn.sort()
  });
}

componentRows.sort((a, b) => b.usageCount - a.usageCount || a.name.localeCompare(b.name));

const lines = [];
lines.push('# UI Component Audit (Reusable Components)');
lines.push('');
lines.push('This report lists reusable / potentially reusable UI components under `frontend/src/components`, along with where they are imported.');
lines.push('');
lines.push(`Generated: ${new Date().toISOString()}`);
lines.push('');
lines.push('| Component | Component File | Usage Count | Used In (files) |');
lines.push('|---|---|---:|---|');

for (const row of componentRows) {
  const usedInList = row.usedIn.length ? row.usedIn.join('<br/>') : '—';
  lines.push(`| ${row.name} | ${row.componentPath} | ${row.usageCount} | ${usedInList} |`);
}

const outPath = path.join(FRONTEND_ROOT, 'UI_COMPONENTS_AUDIT.md');
fs.writeFileSync(outPath, lines.join('\n'), 'utf8');

console.log(`Wrote ${path.relative(FRONTEND_ROOT, outPath)} with ${componentRows.length} components.`);
