import fs from 'fs'
import path from 'path'

const FRONTEND_ROOT = path.resolve(process.cwd())
const SRC_ROOT = path.join(FRONTEND_ROOT, 'src')
const APP_ROOT = path.join(SRC_ROOT, 'app')
const COMPONENTS_ROOT = path.join(SRC_ROOT, 'components')

const OUT_FILE = path.join(FRONTEND_ROOT, 'UI_COMPONENTS_GAPS.md')

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      // Skip Next build output and our UI primitives themselves.
      if (ent.name === '.next') continue
      if (p.startsWith(path.join(COMPONENTS_ROOT, 'ui'))) continue
      out.push(...walk(p))
    } else {
      if (!/\.(js|jsx|ts|tsx)$/.test(ent.name)) continue
      out.push(p)
    }
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
  const re = /\bimport\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"];?/g
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

function hasUiImport(stmts, name) {
  // True if file imports {name} from the ui barrel or directly from ui module.
  for (const s of stmts) {
    if (s.spec === '@/components/ui' || s.spec === '@/components/ui/index') {
      if (parseNamedImports(s.clause).includes(name)) return true
    }
    if (s.spec === `@/components/ui/${name}`) return true
    if (s.spec.endsWith(`/components/ui/${name}.js`)) return true
  }
  return false
}

function countTag(text, tag) {
  const re = new RegExp(`<${tag}\\b`, 'g')
  return (text.match(re) || []).length
}

function findSpecials(text) {
  const specials = {
    inputFile: 0,
    inputRef: 0,
    selectMultiple: 0,
    selectRef: 0,
    textareaRef: 0,
    buttonRef: 0,
  }

  // Very small heuristics; we’re not doing full JSX parsing.
  const inputTags = text.match(/<input\b[\s\S]*?>/g) || []
  for (const t of inputTags) {
    if (/\btype\s*=\s*['"]file['"]/i.test(t)) specials.inputFile++
    if (/\bref\s*=\s*/.test(t)) specials.inputRef++
  }

  const selectTags = text.match(/<select\b[\s\S]*?>/g) || []
  for (const t of selectTags) {
    if (/\bmultiple\b/.test(t)) specials.selectMultiple++
    if (/\bref\s*=\s*/.test(t)) specials.selectRef++
  }

  const textareaTags = text.match(/<textarea\b[\s\S]*?>/g) || []
  for (const t of textareaTags) {
    if (/\bref\s*=\s*/.test(t)) specials.textareaRef++
  }

  const buttonTags = text.match(/<button\b[\s\S]*?>/g) || []
  for (const t of buttonTags) {
    if (/\bref\s*=\s*/.test(t)) specials.buttonRef++
  }

  return specials
}

const files = [...walk(APP_ROOT), ...walk(COMPONENTS_ROOT)]

const rows = []
for (const fileAbs of files) {
  const text = read(fileAbs)
  const stmts = findImportStatements(text)

  const raw = {
    button: countTag(text, 'button'),
    input: countTag(text, 'input'),
    select: countTag(text, 'select'),
    textarea: countTag(text, 'textarea'),
  }

  const uses = {
    Button: hasUiImport(stmts, 'Button'),
    Input: hasUiImport(stmts, 'Input'),
    Select: hasUiImport(stmts, 'Select'),
    Textarea: hasUiImport(stmts, 'Textarea'),
    ButtonLink: hasUiImport(stmts, 'ButtonLink'),
    Card: hasUiImport(stmts, 'Card'),
    PageHeader: hasUiImport(stmts, 'PageHeader'),
  }

  if (raw.button + raw.input + raw.select + raw.textarea === 0) continue

  const specials = findSpecials(text)

  // Heuristic: flag when raw tag exists but corresponding primitive is not imported.
  const gaps = []
  if (raw.button > 0 && !uses.Button && !uses.ButtonLink) gaps.push('button')
  if (raw.input > 0 && !uses.Input) gaps.push('input')
  if (raw.select > 0 && !uses.Select) gaps.push('select')
  if (raw.textarea > 0 && !uses.Textarea) gaps.push('textarea')

  rows.push({
    file: rel(fileAbs),
    raw,
    uses,
    gaps,
    specials,
  })
}

rows.sort((a, b) => {
  const aScore = a.gaps.length * 1000 + (a.raw.button + a.raw.input + a.raw.select + a.raw.textarea)
  const bScore = b.gaps.length * 1000 + (b.raw.button + b.raw.input + b.raw.select + b.raw.textarea)
  return bScore - aScore
})

function specialsSummary(s) {
  const parts = []
  if (s.inputFile) parts.push(`file-input:${s.inputFile}`)
  if (s.selectMultiple) parts.push(`select-multiple:${s.selectMultiple}`)
  if (s.inputRef) parts.push(`input-ref:${s.inputRef}`)
  if (s.selectRef) parts.push(`select-ref:${s.selectRef}`)
  if (s.textareaRef) parts.push(`textarea-ref:${s.textareaRef}`)
  if (s.buttonRef) parts.push(`button-ref:${s.buttonRef}`)
  return parts.length ? parts.join(', ') : '—'
}

let md = ''
md += '# UI Primitive Gaps (Raw Elements vs Shared Components)\n\n'
md += 'This report finds raw `<button>`, `<input>`, `<select>`, and `<textarea>` usage across `src/app` and `src/components` (excluding `src/components/ui`).\n'
md += 'It highlights where shared primitives (`Button`, `Input`, `Select`, `Textarea`, etc.) are *not* currently used and flags special cases where primitives may not be drop-in (e.g., `ref`, `type="file"`, `multiple`).\n\n'
md += `Generated: ${new Date().toISOString()}\n\n`

md += '| File | Raw (btn/inp/sel/txt) | Missing Primitive For | Special Cases |\n'
md += '|---|---:|---|---|\n'

for (const r of rows) {
  const rawStr = `${r.raw.button}/${r.raw.input}/${r.raw.select}/${r.raw.textarea}`
  const gapStr = r.gaps.length ? r.gaps.join(', ') : '—'
  md += `| ${r.file} | ${rawStr} | ${gapStr} | ${specialsSummary(r.specials)} |\n`
}

md += '\n## Interpretation\n\n'
md += '- **Missing Primitive For**: raw tags exist in the file, but the corresponding shared primitive is not imported. This usually means refactoring is straightforward.\n'
md += '- **Special Cases**:\n'
md += '  - `*-ref`: these spots will *not* be drop-in unless we upgrade primitives to `forwardRef`.\n'
md += '  - `file-input`: can use `Input`, but ensure we don\'t accidentally pass a controlled `value`.\n'
md += '  - `select-multiple`: can use `Select` (it forwards `...rest`), but the UI may need different styling/UX.\n'

fs.writeFileSync(OUT_FILE, md, 'utf8')
console.log(`Wrote ${path.basename(OUT_FILE)} with ${rows.length} rows.`)
