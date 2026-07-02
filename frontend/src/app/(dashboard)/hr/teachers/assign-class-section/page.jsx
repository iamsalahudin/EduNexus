'use client'

import { useEffect, useMemo, useState } from 'react'
import { DndContext, closestCenter, useDroppable } from '@dnd-kit/core'
import { Button, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import DraggableItem from '@/components/timetable/DraggableItem'
import teacherService from '@/services/teacher.service'
import classesService from '@/services/classesService'

const LEVELS = [
  { key: 'pre-primary', label: 'Pre-Primary' },
  { key: 'primary', label: 'Primary' },
  { key: 'middle', label: 'Middle' },
  { key: 'high', label: 'High' },
]

function normalizeLevel(level) {
  return String(level || '').trim().toLowerCase()
}

function formatClassSection(className, sectionName) {
  return `${className} - ${sectionName}`
}

function parseStrictClassSection(value) {
  const raw = String(value || '').trim()
  const parts = raw.split(' - ')
  if (parts.length !== 2) return null

  const className = parts[0].trim()
  const sectionName = parts[1].trim()
  if (!className || !sectionName) return null

  return { className, sectionName }
}

function normalizeKeyPart(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function DroppableClassCell({ id, className, onDropClass, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded border p-3 bg-white ${isOver ? 'ring-2 ring-primary/50 border-primary' : 'border-gray-200'}`}
      onDoubleClick={onDropClass}
      title={`Drop teacher here to assign all sections of ${className}`}
    >
      {children}
    </div>
  )
}

function DroppableSectionPill({ id, className, sectionName, teacher, onClear, canClear }) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded border px-2 py-2 min-h-[70px] flex flex-col gap-2 ${
        isOver ? 'ring-2 ring-primary/50 border-primary bg-primary/5' : 'border-gray-200 bg-gray-50'
      }`}
      title={`Drop teacher to assign ${className} - ${sectionName}`}
    >
      <div className="text-xs font-medium text-gray-700">{sectionName}</div>
      {teacher ? (
        <div className="flex items-center justify-between gap-2 rounded bg-white border px-2 py-1 text-xs">
          <span className="font-medium truncate">{teacher.user?.name || '-'}</span>
          {canClear ? (
            <button
              type="button"
              className="text-red-600 hover:text-red-700"
              onClick={onClear}
              aria-label={`Clear assignment for ${className} - ${sectionName}`}
            >
              x
            </button>
          ) : null}
        </div>
      ) : (
        <div className="text-[11px] text-gray-400">Drop teacher</div>
      )}
    </div>
  )
}

export default function AssignTeacherToClassPage() {
  const [bootstrapping, setBootstrapping] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [teachers, setTeachers] = useState([])
  const [classes, setClasses] = useState([])

  const [assignments, setAssignments] = useState({})
  const [savedAssignments, setSavedAssignments] = useState({})
  const [activeTeacherId, setActiveTeacherId] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [teacherSearch, setTeacherSearch] = useState('')

  const teacherById = useMemo(() => {
    const map = {}
    teachers.forEach((t) => {
      map[t._id] = t
    })
    return map
  }, [teachers])

  const isDirty = useMemo(() => {
    const normalize = (obj) => {
      const rows = Object.entries(obj || {})
        .filter(([k, v]) => String(k || '').trim() && String(v || '').trim())
        .map(([k, v]) => `${String(k).trim()}=>${String(v).trim()}`)
        .sort()
      return rows.join('|')
    }
    return normalize(assignments) !== normalize(savedAssignments)
  }, [assignments, savedAssignments])

  const classesByLevel = useMemo(() => {
    const grouped = {
      'pre-primary': [],
      primary: [],
      middle: [],
      high: [],
    }

    classes.forEach((cls) => {
      const level = normalizeLevel(cls.level)
      if (grouped[level]) grouped[level].push(cls)
    })

    return grouped
  }, [classes])

  const classLevelByName = useMemo(() => {
    const map = {}
    classes.forEach((cls) => {
      const className = String(cls.name || '').trim()
      if (!className) return
      map[className] = normalizeLevel(cls.level)
    })
    return map
  }, [classes])

  const assignmentCountByTeacherId = useMemo(() => {
    const map = {}
    Object.values(assignments).forEach((teacherId) => {
      const tid = String(teacherId || '').trim()
      if (!tid) return
      map[tid] = (map[tid] || 0) + 1
    })
    return map
  }, [assignments])

  const assignedLevelsByTeacherId = useMemo(() => {
    const map = {}
    Object.entries(assignments).forEach(([strictClassSection, teacherId]) => {
      const tid = String(teacherId || '').trim()
      if (!tid) return

      const parsed = parseStrictClassSection(strictClassSection)
      if (!parsed) return

      const level = classLevelByName[parsed.className]
      if (!level) return

      if (!map[tid]) map[tid] = new Set()
      map[tid].add(level)
    })
    return map
  }, [assignments, classLevelByName])

  const teacherWarningById = useMemo(() => {
    const warningMap = {}

    teachers.forEach((teacher) => {
      const tid = String(teacher._id)
      const homeLevel = normalizeLevel(teacher.department)
      const levelsSet = assignedLevelsByTeacherId[tid] || new Set()
      const assignedLevels = Array.from(levelsSet)

      const hasCrossLevel = assignedLevels.some((lvl) => lvl && lvl !== homeLevel)
      warningMap[tid] = {
        hasCrossLevel,
        assignedLevels,
      }
    })

    return warningMap
  }, [teachers, assignedLevelsByTeacherId])

  const teachersByLevel = useMemo(() => {
    const grouped = {
      'pre-primary': [],
      primary: [],
      middle: [],
      high: [],
    }

    const needle = String(teacherSearch || '').trim().toLowerCase()

    teachers.forEach((teacher) => {
      if (needle) {
        const name = String(teacher.user?.name || '').toLowerCase()
        const employeeId = String(teacher.employeeId || '').toLowerCase()
        if (!name.includes(needle) && !employeeId.includes(needle)) return
      }

      const level = normalizeLevel(teacher.department)
      if (grouped[level]) grouped[level].push(teacher)
    })

    return grouped
  }, [teacherSearch, teachers])

  function buildAssignmentsFromTeachers(teacherRows, classRows) {
    const canonicalMap = new Map()
    classRows.forEach((c) => {
      const className = String(c.name || '').trim()
      const sections = Array.isArray(c.sections) ? c.sections : []
      sections.forEach((s) => {
        const sectionName = String(s || '').trim()
        if (!className || !sectionName) return
        const normalized = `${normalizeKeyPart(className)}||${normalizeKeyPart(sectionName)}`
        canonicalMap.set(normalized, formatClassSection(className, sectionName))
      })
    })

    const next = {}

    for (const teacher of teacherRows) {
      const teacherId = String(teacher._id)
      const list = Array.isArray(teacher.classesAssigned) ? teacher.classesAssigned : []

      list.forEach((value) => {
        const parsed = parseStrictClassSection(value)
        if (!parsed) return
        const normalized = `${normalizeKeyPart(parsed.className)}||${normalizeKeyPart(parsed.sectionName)}`
        const key = canonicalMap.get(normalized)
        if (!key) return

        next[key] = teacherId
      })
    }

    return next
  }

  function normalizeAssignments(rawAssignments, classRows, teacherRows) {
    const validTeacherIds = new Set((teacherRows || []).map((t) => String(t._id)))
    const validStrict = new Set()

    ;(classRows || []).forEach((cls) => {
      const className = String(cls.name || '').trim()
      const sections = Array.isArray(cls.sections) ? cls.sections : []
      sections.forEach((sec) => {
        const sectionName = String(sec || '').trim()
        if (!className || !sectionName) return
        validStrict.add(formatClassSection(className, sectionName))
      })
    })

    const normalized = {}
    Object.entries(rawAssignments || {}).forEach(([strict, teacherId]) => {
      const key = String(strict || '').trim()
      const tid = String(teacherId || '').trim()
      if (!key || !tid) return
      if (!validStrict.has(key)) return
      if (!validTeacherIds.has(tid)) return
      normalized[key] = tid
    })

    return normalized
  }

  async function fetchAllTeachersForAssignments() {
    const all = []
    let page = 1
    let totalPages = 1

    do {
      const res = await teacherService.listTeachers({
        page,
        limit: 200,
        sortBy: 'name',
        sortOrder: 'asc',
      })

      const rows = Array.isArray(res?.teachers) ? res.teachers : []
      all.push(...rows)

      const pagination = res?.pagination || {}
      totalPages = Number(pagination.totalPages || 1)
      page += 1
    } while (page <= totalPages)

    return all
  }

  async function hydrateTeachersWithAssignments(teacherRows) {
    const rows = Array.isArray(teacherRows) ? teacherRows : []
    if (rows.length === 0) return []

    const hydrated = await Promise.all(
      rows.map(async (teacher) => {
        const current = Array.isArray(teacher?.classesAssigned) ? teacher.classesAssigned : null
        if (current) return teacher

        try {
          const detail = await teacherService.getTeacher(teacher._id)
          const detailAssignments = Array.isArray(detail?.teacher?.classesAssigned)
            ? detail.teacher.classesAssigned
            : []

          return {
            ...teacher,
            classesAssigned: detailAssignments,
          }
        } catch {
          return {
            ...teacher,
            classesAssigned: [],
          }
        }
      })
    )

    return hydrated
  }

  async function loadData({ silent = false } = {}) {
    if (silent) setLoading(true)
    else setBootstrapping(true)

    setError('')
    setSuccess('')

    try {
      const [teachersRes, classesRes] = await Promise.all([
        teacherService.listTeachers({ limit: 500, sortBy: 'name', sortOrder: 'asc' }),
        classesService.listClasses({ active: true }),
      ])

      const teacherRows = Array.isArray(teachersRes?.teachers) ? teachersRes.teachers : []
      const classRows = Array.isArray(classesRes?.classes) ? classesRes.classes : []
      const teacherRowsWithAssignments = await hydrateTeachersWithAssignments(teacherRows)

      setTeachers(teacherRowsWithAssignments)
      setClasses(classRows)
      const normalizedAssignments = normalizeAssignments(
        buildAssignmentsFromTeachers(teacherRowsWithAssignments, classRows),
        classRows,
        teacherRowsWithAssignments
      )
      setAssignments(normalizedAssignments)
      setSavedAssignments(normalizedAssignments)
      setIsEditing(false)
      setActiveTeacherId(null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teachers/classes')
    } finally {
      if (silent) setLoading(false)
      else setBootstrapping(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function assignToSingleSection(className, sectionName, teacherId) {
    const key = formatClassSection(className, sectionName)
    setAssignments((prev) => ({ ...prev, [key]: String(teacherId) }))
    setSuccess('')
  }

  function assignToWholeClass(classItem, teacherId) {
    const sections = Array.isArray(classItem.sections) && classItem.sections.length > 0 ? classItem.sections : []
    if (sections.length === 0) return

    setAssignments((prev) => {
      const next = { ...prev }

      Object.keys(next).forEach((key) => {
        if (key.startsWith(`${classItem.name} - `)) {
          delete next[key]
        }
      })

      sections.forEach((sectionName) => {
        const strict = formatClassSection(classItem.name, sectionName)
        next[strict] = String(teacherId)
      })

      return next
    })
    setSuccess('')
  }

  function clearSingleSection(className, sectionName) {
    const key = formatClassSection(className, sectionName)
    setAssignments((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setSuccess('')
  }

  function onDragEnd({ active, over }) {
    if (!isEditing) return
    if (!active?.id || !over?.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    if (!activeId.startsWith('teacher:')) return
    const teacherId = activeId.replace('teacher:', '')
    if (!teacherById[teacherId]) return

    if (overId.startsWith('section:')) {
      const payload = overId.replace('section:', '')
      const parts = payload.split('|')
      if (parts.length !== 2) return

      const className = decodeURIComponent(parts[0])
      const sectionName = decodeURIComponent(parts[1])
      assignToSingleSection(className, sectionName, teacherId)
      return
    }

    if (overId.startsWith('class:')) {
      const className = decodeURIComponent(overId.replace('class:', ''))
      const classItem = classes.find((c) => c.name === className)
      if (!classItem) return

      assignToWholeClass(classItem, teacherId)
    }
  }

  async function saveAssignments() {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const allTeachers = await fetchAllTeachersForAssignments()
      const stableAssignments = normalizeAssignments(assignments, classes, allTeachers)

      const byTeacher = {}
      Object.entries(stableAssignments).forEach(([strictClassSection, teacherId]) => {
        const tid = String(teacherId || '').trim()
        if (!tid) return
        if (!byTeacher[tid]) byTeacher[tid] = []
        byTeacher[tid].push(strictClassSection)
      })

      Object.keys(byTeacher).forEach((tid) => {
        byTeacher[tid] = Array.from(new Set(byTeacher[tid])).sort((a, b) => a.localeCompare(b))
      })

      const requests = allTeachers.map((teacher) => {
        const list = byTeacher[String(teacher._id)] || []
        return teacherService.updateTeacher(teacher._id, { classesAssigned: list })
      })

      await Promise.all(requests)
      setSuccess('Class-section assignments saved successfully.')
      setSavedAssignments(stableAssignments)
      setAssignments(stableAssignments)
      setIsEditing(false)
      setActiveTeacherId(null)
      await loadData({ silent: true })
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save class-section assignments')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Class-Section"
        subtitle="Drag teachers by level and drop on class/section cells. Drop on class to assign all its sections."
      />

      <div className="flex flex-wrap items-center gap-2">
        {!isEditing ? (
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              setAssignments(savedAssignments)
              setIsEditing(true)
              setError('')
              setSuccess('')
            }}
            disabled={bootstrapping || loading}
          >
            Edit
          </Button>
        ) : (
          <>
            <Button type="button" variant="primary" onClick={saveAssignments} disabled={saving || bootstrapping || loading}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAssignments(savedAssignments)
                setIsEditing(false)
                setActiveTeacherId(null)
                setError('')
                setSuccess('')
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </>
        )}

        <Button type="button" variant="outline" onClick={() => loadData({ silent: true })} disabled={saving || bootstrapping || loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}
      {isEditing ? (
        <div className={`text-xs ${isDirty ? 'text-amber-700' : 'text-gray-500'}`}>
          {isDirty ? 'Unsaved changes' : 'No pending changes'}
        </div>
      ) : null}

      {bootstrapping ? (
        <div className="grid grid-cols-1 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      ) : (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={({ active }) => {
            const id = String(active?.id || '')
            if (id.startsWith('teacher:')) setActiveTeacherId(id.replace('teacher:', ''))
          }}
          onDragCancel={() => setActiveTeacherId(null)}
          onDragEnd={(event) => {
            onDragEnd(event)
            setActiveTeacherId(null)
          }}
        >
          <Card>
            <h2 className="font-semibold text-gray-900">Teachers</h2>
            <p className="text-sm text-gray-600 mt-1">Grouped by class level from backend school classes.</p>

            <div className="mt-3">
              <input
                type="text"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
                placeholder="Search teacher by name or employee ID"
                className="w-full md:w-[340px] rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {LEVELS.map((level) => {
                const laneTeachers = teachersByLevel[level.key] || []

                return (
                  <div key={level.key} className="rounded border border-gray-200 p-3">
                    <div className="text-sm font-semibold text-gray-800 mb-2">{level.label}</div>

                    {laneTeachers.length === 0 ? (
                      <div className="text-sm text-gray-500">No teacher found</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {laneTeachers.map((teacher) => {
                          const isActive = activeTeacherId === String(teacher._id)
                          const warningMeta = teacherWarningById[String(teacher._id)] || { hasCrossLevel: false, assignedLevels: [] }
                          const assignedCount = assignmentCountByTeacherId[String(teacher._id)] || 0
                          const warningLabel = warningMeta.hasCrossLevel
                            ? `Cross-level assignment: ${warningMeta.assignedLevels.join(', ')}`
                            : ''

                          return (
                            <div key={teacher._id} className={isActive ? 'ring-2 ring-primary/50 rounded' : ''}>
                              <DraggableItem
                                id={`teacher:${teacher._id}`}
                                label={`${teacher.user?.name || teacher.employeeId || 'Teacher'} (${assignedCount})`}
                                disabled={!isEditing}
                              />

                              {warningMeta.hasCrossLevel ? (
                                <div
                                  className="mt-1 text-[11px] text-amber-700 font-medium"
                                  title={warningLabel}
                                >
                                  ! cross-level
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {LEVELS.map((level) => {
            const levelClasses = classesByLevel[level.key] || []

            return (
              <Card key={`grid-${level.key}`}>
                <h3 className="font-semibold text-gray-900">{level.label} Classes</h3>
                <p className="text-xs text-gray-500 mt-1">Drop on class card to assign all sections, or drop on a single section cell.</p>

                {levelClasses.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState title="No class found for this level" />
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {levelClasses.map((cls) => {
                      const classDropId = `class:${encodeURIComponent(cls.name)}`
                      const sectionList = Array.isArray(cls.sections) ? cls.sections.filter(Boolean) : []

                      return (
                        <DroppableClassCell
                          key={cls._id || cls.name}
                          id={classDropId}
                          className={cls.name}
                          onDropClass={() => {
                            if (!isEditing || !activeTeacherId) return
                            assignToWholeClass(cls, activeTeacherId)
                          }}
                        >
                          <div className="font-semibold text-gray-900">{cls.name}</div>

                          {sectionList.length === 0 ? (
                            <div className="mt-2 text-xs text-gray-500">No section available</div>
                          ) : (
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {sectionList.map((sectionName) => {
                                const strict = formatClassSection(cls.name, sectionName)
                                const assignedTeacherId = assignments[strict]
                                const assignedTeacher = assignedTeacherId ? teacherById[assignedTeacherId] : null
                                const sectionDropId = `section:${encodeURIComponent(cls.name)}|${encodeURIComponent(sectionName)}`

                                return (
                                  <DroppableSectionPill
                                    key={`${cls.name}-${sectionName}`}
                                    id={sectionDropId}
                                    className={cls.name}
                                    sectionName={sectionName}
                                    teacher={assignedTeacher}
                                    canClear={isEditing}
                                    onClear={() => clearSingleSection(cls.name, sectionName)}
                                  />
                                )
                              })}
                            </div>
                          )}
                        </DroppableClassCell>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </DndContext>
      )}
    </div>
  )
}
