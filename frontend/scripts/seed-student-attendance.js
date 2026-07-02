/*
  Seed random student attendance for today and the previous 5 days.
  Usage (PowerShell):
    $env:NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"; \
    $env:ACCESS_TOKEN="<jwt>"; \
    node ./scripts/seed-student-attendance.js

  Or with username/password (if your backend supports /auth/login returning { accessToken }):
    $env:NEXT_PUBLIC_API_BASE_URL="http://localhost:4000/api"; \
    $env:AUTH_USERNAME="admin"; \
    $env:AUTH_PASSWORD="admin123"; \
    node ./scripts/seed-student-attendance.js
*/

const axios = require('axios')

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function pastNDates(n) {
  const out = []
  const today = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    out.push(toInputDate(d))
  }
  return out
}

function pickStatus() {
  // Weighted random: present 90%, absent 4%, late 4%, excused 2%
  const r = Math.random()
  if (r < 0.90) return 'present'
  if (r < 0.94) return 'absent'
  if (r < 0.98) return 'late'
  return 'excused'
}

function chunk(arr, size) {
  const ch = []
  for (let i = 0; i < arr.length; i += size) ch.push(arr.slice(i, i + size))
  return ch
}

async function main() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN || ''
  const AUTH_USERNAME = process.env.AUTH_USERNAME || ''
  const AUTH_PASSWORD = process.env.AUTH_PASSWORD || ''

  const api = axios.create({ baseURL: API_BASE, timeout: 60000 })

  // Prefer token; else try to login (if supported by backend)
  if (ACCESS_TOKEN) {
    api.defaults.headers.common.Authorization = `Bearer ${ACCESS_TOKEN}`
  } else if (AUTH_USERNAME && AUTH_PASSWORD) {
    try {
      const { data } = await api.post('/auth/login', { username: AUTH_USERNAME, password: AUTH_PASSWORD })
      if (data && data.accessToken) {
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
        console.log('Authenticated via /auth/login')
      } else {
        console.warn('Login response did not include accessToken; proceeding without Authorization header (may fail)')
      }
    } catch (err) {
      console.error('Login failed:', err?.response?.data || err.message)
      process.exit(1)
    }
  } else {
    console.warn('No ACCESS_TOKEN or AUTH credentials provided — requests may be unauthorized (401).')
  }

  // 1) Get all students
  let students = []
  try {
    const { data } = await api.get('/students', { params: { limit: 100000 } })
    students = Array.isArray(data?.students) ? data.students : []
  } catch (err) {
    console.error('Failed to fetch students:', err?.response?.data || err.message)
    process.exit(1)
  }

  if (students.length === 0) {
    console.log('No students found — nothing to seed.')
    return
  }

  console.log(`Seeding attendance for ${students.length} students...`)

  const dates = pastNDates(6) // today + last 5 days
  for (const date of dates) {
    const entries = students.map((s) => ({ studentId: s._id || s.id, status: pickStatus() }))

    // Send in chunks to avoid very large payloads
    const chunks = chunk(entries, 800)
    let successCount = 0

    for (let idx = 0; idx < chunks.length; idx++) {
      const part = chunks[idx]
      try {
        const { data } = await api.post('/attendance', { date, entries: part })
        const invalid = Array.isArray(data?.invalid) ? data.invalid.length : 0
        successCount += part.length - invalid
        process.stdout.write(`\r  [${date}] chunk ${idx + 1}/${chunks.length} ok (invalid: ${invalid})   `)
      } catch (err) {
        console.error(`\n  [${date}] chunk ${idx + 1} failed:`, err?.response?.data || err.message)
      }
    }

    console.log(`\n  [${date}] seeded ~${successCount}/${entries.length}`)
  }

  console.log('Done.')
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
