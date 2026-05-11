<<<<<<< HEAD
export const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const SHORT_TO_FULL_DAY = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
}

const FULL_TO_SHORT_DAY = Object.fromEntries(
  Object.entries(SHORT_TO_FULL_DAY).map(([shortDay, fullDay]) => [fullDay, shortDay])
)

function sortByStartTime(a, b) {
  const aStart = String(a || '').split('-')[0]?.trim() || ''
  const bStart = String(b || '').split('-')[0]?.trim() || ''
  return aStart.localeCompare(bStart)
}

export function buildClassColumnId(className, section) {
  const cls = String(className || '').trim()
  const sec = String(section || '').trim()
  return sec ? `${cls}::${sec}` : cls
}

export function buildClassDisplayName(className, section) {
  const cls = String(className || '').trim()
  const sec = String(section || '').trim()
  return sec ? `${cls} - ${sec}` : cls
}

function toDisplayValue(entity) {
  if (!entity) return null
  if (typeof entity === 'string') {
    return { id: entity, label: entity }
  }

  const id = String(entity._id || entity.id || '').trim()
  const label = String(entity.name || entity.label || id).trim()
  if (!id && !label) return null
  return { id: id || label, label: label || id }
}

export function parseSlotLabel(label) {
  const [startTime, endTime] = String(label || '').split('-').map((v) => String(v || '').trim())
  if (!startTime || !endTime) return null
  return { startTime, endTime }
}

export function parseAcademicYearToNumber(value) {
  const m = String(value || '').match(/\d{4}/)
  return m ? Number(m[0]) : new Date().getFullYear()
}

export function buildTimetableConfigFromApi(timetable) {
  const slots = Array.isArray(timetable?.slots) ? timetable.slots : []

  const classMap = new Map()
  slots.forEach((s) => {
    const className = String(s?.class || '').trim()
    const section = String(s?.section || '').trim()
    if (!className) return

    const id = buildClassColumnId(className, section)
    if (classMap.has(id)) return

    classMap.set(id, {
      id,
      name: buildClassDisplayName(className, section),
      className,
      section
    })
  })

  const classes = [...classMap.values()].sort((a, b) => {
    if (a.className !== b.className) return a.className.localeCompare(b.className)
    return String(a.section || '').localeCompare(String(b.section || ''))
  })

  const timeLabels = [...new Set(slots
    .map((s) => {
      const start = String(s?.startTime || '').trim()
      const end = String(s?.endTime || '').trim()
      if (!start || !end) return ''
      return `${start} - ${end}`
    })
    .filter(Boolean))]
    .sort(sortByStartTime)

  const timeSlots = timeLabels.map((label) => ({ label }))

  const weeklyGrids = {}
  SHORT_DAYS.forEach((day) => {
    weeklyGrids[day] = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      periods: Object.fromEntries(timeLabels.map((label) => [
        label,
        { subject: null, teacher: null, room: null },
      ])),
    }))
  })

  slots.forEach((slot) => {
    const shortDay = FULL_TO_SHORT_DAY[String(slot?.day || '').trim()]
    if (!shortDay || !weeklyGrids[shortDay]) return

    const className = String(slot?.class || '').trim()
    const section = String(slot?.section || '').trim()
    const classId = buildClassColumnId(className, section)
    const start = String(slot?.startTime || '').trim()
    const end = String(slot?.endTime || '').trim()
    if (!classId || !start || !end) return

    const label = `${start} - ${end}`
    const classRow = weeklyGrids[shortDay].find((c) => c.id === classId)
    if (!classRow || !classRow.periods[label]) return

    classRow.periods[label] = {
      subject: toDisplayValue(slot?.subject),
      teacher: toDisplayValue(slot?.teacher),
      room: String(slot?.room || '').trim() || null,
    }
  })

  return {
    _id: String(timetable?._id || ''),
    level: String(timetable?.level || '').trim(),
    year: Number(timetable?.year || new Date().getFullYear()),
    classes,
    timeSlots,
    weeklyGrids,
  }
}

export function extractEntityId(value) {
  if (!value) return undefined
  if (typeof value === 'string') return /^[a-f\d]{24}$/i.test(value) ? value : undefined
  if (typeof value === 'object') {
    const candidate = String(value.id || value._id || '').trim()
    return /^[a-f\d]{24}$/i.test(candidate) ? candidate : undefined
  }
  return undefined
}

export function buildApiSlotsFromWeeklyGrid({ weeklyGrids, days = SHORT_DAYS, classes, timeSlots }) {
  const classMetaById = {}
  ;(Array.isArray(classes) ? classes : []).forEach((c) => {
    const id = String(c?.id || '').trim()
    if (!id) return
    classMetaById[id] = {
      className: String(c?.className || c?.name || c?.id || '').trim(),
      section: String(c?.section || '').trim()
    }
  })

  const classSet = new Set(Object.keys(classMetaById))
  const labels = (Array.isArray(timeSlots) ? timeSlots : []).map((ts) => String(ts?.label || '').trim()).filter(Boolean)
  const slots = []

  ;(Array.isArray(days) ? days : []).forEach((shortDay) => {
    const fullDay = SHORT_TO_FULL_DAY[shortDay]
    if (!fullDay) return

    const dayGrid = Array.isArray(weeklyGrids?.[shortDay]) ? weeklyGrids[shortDay] : []
    dayGrid.forEach((cls) => {
      const classId = String(cls?.id || '').trim()
      if (!classId || !classSet.has(classId)) return

      const classMeta = classMetaById[classId] || {}
      const className = String(classMeta?.className || classId).trim()
      const section = String(classMeta?.section || '').trim()

      labels.forEach((label) => {
        const parsed = parseSlotLabel(label)
        if (!parsed) return
        const cell = cls?.periods?.[label] || {}

        slots.push({
          day: fullDay,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          class: className,
          section: section || undefined,
          room: cell?.room || undefined,
          subject: extractEntityId(cell?.subject),
          teacher: extractEntityId(cell?.teacher),
        })
      })
    })
  })

  return slots
}
=======
export const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const SHORT_TO_FULL_DAY = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
}

const FULL_TO_SHORT_DAY = Object.fromEntries(
  Object.entries(SHORT_TO_FULL_DAY).map(([shortDay, fullDay]) => [fullDay, shortDay])
)

function sortByStartTime(a, b) {
  const aStart = String(a || '').split('-')[0]?.trim() || ''
  const bStart = String(b || '').split('-')[0]?.trim() || ''
  return aStart.localeCompare(bStart)
}

export function buildClassColumnId(className, section) {
  const cls = String(className || '').trim()
  const sec = String(section || '').trim()
  return sec ? `${cls}::${sec}` : cls
}

export function buildClassDisplayName(className, section) {
  const cls = String(className || '').trim()
  const sec = String(section || '').trim()
  return sec ? `${cls} - ${sec}` : cls
}

function toDisplayValue(entity) {
  if (!entity) return null
  if (typeof entity === 'string') {
    return { id: entity, label: entity }
  }

  const id = String(entity._id || entity.id || '').trim()
  const label = String(entity.name || entity.label || id).trim()
  if (!id && !label) return null
  return { id: id || label, label: label || id }
}

export function parseSlotLabel(label) {
  const [startTime, endTime] = String(label || '').split('-').map((v) => String(v || '').trim())
  if (!startTime || !endTime) return null
  return { startTime, endTime }
}

export function parseAcademicYearToNumber(value) {
  const m = String(value || '').match(/\d{4}/)
  return m ? Number(m[0]) : new Date().getFullYear()
}

export function buildTimetableConfigFromApi(timetable) {
  const slots = Array.isArray(timetable?.slots) ? timetable.slots : []

  const classMap = new Map()
  slots.forEach((s) => {
    const className = String(s?.class || '').trim()
    const section = String(s?.section || '').trim()
    if (!className) return

    const id = buildClassColumnId(className, section)
    if (classMap.has(id)) return

    classMap.set(id, {
      id,
      name: buildClassDisplayName(className, section),
      className,
      section
    })
  })

  const classes = [...classMap.values()].sort((a, b) => {
    if (a.className !== b.className) return a.className.localeCompare(b.className)
    return String(a.section || '').localeCompare(String(b.section || ''))
  })

  const timeLabels = [...new Set(slots
    .map((s) => {
      const start = String(s?.startTime || '').trim()
      const end = String(s?.endTime || '').trim()
      if (!start || !end) return ''
      return `${start} - ${end}`
    })
    .filter(Boolean))]
    .sort(sortByStartTime)

  const timeSlots = timeLabels.map((label) => ({ label }))

  const weeklyGrids = {}
  SHORT_DAYS.forEach((day) => {
    weeklyGrids[day] = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      periods: Object.fromEntries(timeLabels.map((label) => [
        label,
        { subject: null, teacher: null, room: null },
      ])),
    }))
  })

  slots.forEach((slot) => {
    const shortDay = FULL_TO_SHORT_DAY[String(slot?.day || '').trim()]
    if (!shortDay || !weeklyGrids[shortDay]) return

    const className = String(slot?.class || '').trim()
    const section = String(slot?.section || '').trim()
    const classId = buildClassColumnId(className, section)
    const start = String(slot?.startTime || '').trim()
    const end = String(slot?.endTime || '').trim()
    if (!classId || !start || !end) return

    const label = `${start} - ${end}`
    const classRow = weeklyGrids[shortDay].find((c) => c.id === classId)
    if (!classRow || !classRow.periods[label]) return

    classRow.periods[label] = {
      subject: toDisplayValue(slot?.subject),
      teacher: toDisplayValue(slot?.teacher),
      room: String(slot?.room || '').trim() || null,
    }
  })

  return {
    _id: String(timetable?._id || ''),
    level: String(timetable?.level || '').trim(),
    year: Number(timetable?.year || new Date().getFullYear()),
    classes,
    timeSlots,
    weeklyGrids,
  }
}

export function extractEntityId(value) {
  if (!value) return undefined
  if (typeof value === 'string') return /^[a-f\d]{24}$/i.test(value) ? value : undefined
  if (typeof value === 'object') {
    const candidate = String(value.id || value._id || '').trim()
    return /^[a-f\d]{24}$/i.test(candidate) ? candidate : undefined
  }
  return undefined
}

export function buildApiSlotsFromWeeklyGrid({ weeklyGrids, days = SHORT_DAYS, classes, timeSlots }) {
  const classMetaById = {}
  ;(Array.isArray(classes) ? classes : []).forEach((c) => {
    const id = String(c?.id || '').trim()
    if (!id) return
    classMetaById[id] = {
      className: String(c?.className || c?.name || c?.id || '').trim(),
      section: String(c?.section || '').trim()
    }
  })

  const classSet = new Set(Object.keys(classMetaById))
  const labels = (Array.isArray(timeSlots) ? timeSlots : []).map((ts) => String(ts?.label || '').trim()).filter(Boolean)
  const slots = []

  ;(Array.isArray(days) ? days : []).forEach((shortDay) => {
    const fullDay = SHORT_TO_FULL_DAY[shortDay]
    if (!fullDay) return

    const dayGrid = Array.isArray(weeklyGrids?.[shortDay]) ? weeklyGrids[shortDay] : []
    dayGrid.forEach((cls) => {
      const classId = String(cls?.id || '').trim()
      if (!classId || !classSet.has(classId)) return

      const classMeta = classMetaById[classId] || {}
      const className = String(classMeta?.className || classId).trim()
      const section = String(classMeta?.section || '').trim()

      labels.forEach((label) => {
        const parsed = parseSlotLabel(label)
        if (!parsed) return
        const cell = cls?.periods?.[label] || {}

        slots.push({
          day: fullDay,
          startTime: parsed.startTime,
          endTime: parsed.endTime,
          class: className,
          section: section || undefined,
          room: cell?.room || undefined,
          subject: extractEntityId(cell?.subject),
          teacher: extractEntityId(cell?.teacher),
        })
      })
    })
  })

  return slots
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
