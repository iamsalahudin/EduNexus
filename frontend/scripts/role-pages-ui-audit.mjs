import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

function dashboardRootFor(frontendRoot) {
  return path.join(frontendRoot, 'src', 'app', '(dashboard)')
}

function detectFrontendRoot() {
  const cwd = path.resolve(process.cwd())

  // 1) If invoked from within `frontend/`
  if (fs.existsSync(dashboardRootFor(cwd))) return cwd

  // 2) If invoked from repo root
  const nested = path.join(cwd, 'frontend')
  if (fs.existsSync(dashboardRootFor(nested))) return nested

  // 3) If invoked from another working directory, try resolving relative to this script
  const scriptDir = path.dirname(fileURLToPath(import.meta.url))
  const scriptFrontendRoot = path.resolve(scriptDir, '..')
  if (fs.existsSync(dashboardRootFor(scriptFrontendRoot))) return scriptFrontendRoot

  // Fallback: keep previous behavior
  return cwd
}

const FRONTEND_ROOT = detectFrontendRoot()
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src')
const DASHBOARD_ROOT = dashboardRootFor(FRONTEND_ROOT)

const OUT_FILE = path.join(FRONTEND_ROOT, 'ROLE_UI_PAGES_AUDIT.md')

const UI_NAMES = [
  'PageHeader',
  'Card',
  'Button',
  'ButtonLink',
  'Input',
  'Select',
  'Textarea',
  'Skeleton',
  'EmptyState',
  'ToggleBox',
  'StatCard',
]

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) out.push(...walk(p))
    else if (ent.isFile() && ent.name === 'page.js') out.push(p)
  }
  return out
}

function read(p) {
  return fs.readFileSync(p, 'utf8')
}

function rel(p) {
  return path.relative(FRONTEND_ROOT, p).replace(/\\/g, '/')
}

function findImportStatements(text) {
  const out = []
  const re = /\bimport\s+([\s\S]*?)\s+from\s+['\"]([^'\"]+)['\"];?/g
  let m
  while ((m = re.exec(text))) out.push({ clause: m[1].trim(), spec: m[2] })
  return out
}

function parseNamedImports(clause) {
  const m = clause.match(/\{([\s\S]*?)\}/)
  if (!m) return []
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.split(/\s+as\s+/i)[0].trim())
}

function uiImports(stmts) {
  const used = new Set()
  for (const s of stmts) {
    if (s.spec === '@/components/ui' || s.spec === '@/components/ui/index') {
      for (const n of parseNamedImports(s.clause)) used.add(n)
    }
    const m = s.spec.match(/^@\/components\/ui\/(.+)$/)
    if (m) used.add(m[1])
  }
  return Array.from(used).filter((n) => UI_NAMES.includes(n)).sort()
}

function countTag(text, tag) {
  const re = new RegExp(`<${tag}\\b`, 'g')
  return (text.match(re) || []).length
}

function listRoleDirs() {
  if (!fs.existsSync(DASHBOARD_ROOT)) return []
  return fs
    .readdirSync(DASHBOARD_ROOT, { withFileTypes: true })
    .filter((ent) => ent.isDirectory())
    .map((ent) => ent.name)
    .filter((name) => name !== 'admin')
    .sort()
}

const roles = listRoleDirs()

const rows = []
for (const role of roles) {
  const roleRoot = path.join(DASHBOARD_ROOT, role)
  const files = walk(roleRoot)
  for (const fileAbs of files) {
    const text = read(fileAbs)
    const stmts = findImportStatements(text)

    const raw = {
      button: countTag(text, 'button'),
      input: countTag(text, 'input'),
      select: countTag(text, 'select'),
      textarea: countTag(text, 'textarea'),
    }

    const used = uiImports(stmts)

    const missing = []
    if (raw.button && !used.includes('Button') && !used.includes('ButtonLink')) missing.push('Button')
    if (raw.input && !used.includes('Input')) missing.push('Input')
    if (raw.select && !used.includes('Select')) missing.push('Select')
    if (raw.textarea && !used.includes('Textarea')) missing.push('Textarea')

    rows.push({
      role,
      file: rel(fileAbs),
      raw,
      used,
      missing,
    })
  }
}

rows.sort((a, b) => {
  // Prioritize missing primitives, then raw tag volume.
  const aRaw = a.raw.button + a.raw.input + a.raw.select + a.raw.textarea
  const bRaw = b.raw.button + b.raw.input + b.raw.select + b.raw.textarea
  const aScore = a.missing.length * 1000 + aRaw
  const bScore = b.missing.length * 1000 + bRaw
  if (bScore !== aScore) return bScore - aScore
  if (a.role !== b.role) return a.role.localeCompare(b.role)
  return a.file.localeCompare(b.file)
})

let md = ''
md += '# Role Dashboards UI Audit\n\n'
md += 'Audit for non-Admin dashboards under `src/app/(dashboard)/*/**/page.js` (excluding `admin`).\n'
md += 'For each file, shows raw element counts and which shared UI primitives are already imported.\n\n'
md += `Generated: ${new Date().toISOString()}\n\n`
md += '| Role | File | Raw (btn/inp/sel/txt) | UI Imports (already used) | Missing For Raw Tags |\n'
md += '|---|---|---:|---|---|\n'
for (const r of rows) {
  const rawStr = `${r.raw.button}/${r.raw.input}/${r.raw.select}/${r.raw.textarea}`
  md += `| ${r.role} | ${r.file} | ${rawStr} | ${r.used.length ? r.used.join(', ') : '—'} | ${r.missing.length ? r.missing.join(', ') : '—'} |\n`
}

md += '\n## Notes\n\n'
md += '- A page may still contain raw tags even if it imports primitives (mixed usage).\n'
md += '- “Missing For Raw Tags” means the page has raw tags but does not import the corresponding primitive yet.\n'

fs.writeFileSync(OUT_FILE, md, 'utf8')
console.log(`Wrote ${path.basename(OUT_FILE)} with ${rows.length} role pages across ${roles.length} roles.`)
