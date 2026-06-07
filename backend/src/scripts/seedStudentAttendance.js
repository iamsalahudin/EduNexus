/*
  Seed student attendance directly in MongoDB (no API/auth needed).

  Defaults:
    - Seeds today + last 5 days (6 days total)
    - Random but deterministic if SEED is provided

  Usage:
    node src/scripts/seedStudentAttendance.js

  Options (env):
    - MONGO_URI: Mongo connection string
    - DAYS: number of days to seed backwards from today (default: 6)
    - SEED: any string/number for deterministic randomness
    - DRY_RUN: set to '1' to preview counts without writing

  Notes:
    - Upserts by (student, date) to avoid duplicates.
*/

const mongoose = require('mongoose')
const config = require('../config')

const { Attendance, Student, User } = require('../models')

const FALLBACK_URI = 'mongodb+srv://hussain:aws%401317@cluster0.nuopsgu.mongodb.net/edu'

function normalizeDay(value) {
  const d = new Date(value)
  d.setHours(0, 0, 0, 0)
  return d
}

function toInputDate(value) {
  const d = normalizeDay(value)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function hashSeed(seed) {
  // Simple string -> 32-bit seed
  const str = String(seed ?? '')
  let h = 2166136261
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a) {
  return function rand() {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pickStatus(r) {
  // Weighted: present 90%, absent 4%, late 4%, excused 2%
  if (r < 0.9) return 'present'
  if (r < 0.94) return 'absent'
  if (r < 0.98) return 'late'
  return 'excused'
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function pickMarkerUserId() {
  const teacher = await User.findOne({ role: 'Teacher' }).select('_id role').lean()
  if (teacher?._id) return teacher._id

  const admin = await User.findOne({ role: 'Admin' }).select('_id role').lean()
  if (admin?._id) return admin._id

  return null
}

async function seed() {
  const uri = process.env.MONGO_URI || config.mongoUri || FALLBACK_URI
  if (!uri) {
    console.error('No MONGO_URI provided. Set MONGO_URI in environment or edit this script.')
    process.exit(1)
  }

  const days = Math.max(1, Number(process.env.DAYS || 6) || 6)
  const dryRun = String(process.env.DRY_RUN || '') === '1'
  const seededRand = mulberry32(hashSeed(process.env.SEED || Date.now()))

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  console.log('Connected to DB for attendance seeding')

  const students = await Student.find({}).select('_id class section').lean()
  if (!students.length) {
    console.log('No students found. Nothing to seed.')
    await mongoose.disconnect()
    return
  }

  const markedById = await pickMarkerUserId()
  console.log(`Students: ${students.length}`)
  console.log(`Days: ${days} (today + ${days - 1} previous)`) 
  console.log(`Marker user: ${markedById ? String(markedById) : '(none)'}`)
  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`)

  const today = normalizeDay(new Date())
  const dates = []
  for (let i = 0; i < days; i += 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(normalizeDay(d))
  }

  const totalOps = students.length * dates.length
  console.log(`Planned upserts: ${totalOps}`)

  if (dryRun) {
    console.log('DRY_RUN=1 set; skipping writes.')
    await mongoose.disconnect()
    return
  }

  // Upsert (student, date)
  const writeChunkSize = 1000
  for (const date of dates) {
    const ops = students.map((s) => {
      const r = seededRand()
      const status = pickStatus(r)
      const setFields = {
        student: s._id,
        date,
        status,
        class: s.class,
        remarks: '',
      }

      if (s.section) setFields.section = s.section
      if (markedById) setFields.teacher = markedById

      return {
        updateOne: {
          filter: { student: s._id, date },
          update: { $set: setFields },
          upsert: true,
        },
      }
    })

    const chunks = chunk(ops, writeChunkSize)
    let written = 0

    for (let i = 0; i < chunks.length; i += 1) {
      const part = chunks[i]
      const res = await Attendance.bulkWrite(part, { ordered: false })
      written += part.length
      process.stdout.write(
        `\r[${toInputDate(date)}] chunk ${i + 1}/${chunks.length} ` +
        `matched=${res.matchedCount} upserted=${res.upsertedCount} modified=${res.modifiedCount}   `
      )
    }

    process.stdout.write('\n')
    console.log(`[${toInputDate(date)}] processed: ${written}`)
  }

  console.log('Attendance seeding complete')
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error('Attendance seeding failed', err)
  process.exit(1)
})
