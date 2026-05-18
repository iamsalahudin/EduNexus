"use client"

import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import DraggableItem from '@/components/timetable/DraggableItem'
import subjectsService from '@/services/subjectsService'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton } from '@/components/ui'

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase()
}

function DroppableArea({ id, children }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[88px] rounded border border-dashed p-3 ${isOver ? 'bg-theme-[--color-primary]/10' : ''}`}
    >
      {children}
    </div>
  )
}

function SubjectBox({ subject, onRemove }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `subject:${subject._id}` })
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="px-3 py-2 border rounded bg-white text-sm flex items-center gap-2 cursor-grab"
      >
        <span className="font-medium">{subject.name}</span>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-white text-sm flex items-center justify-center"
        title="Remove"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onRemove(subject)
        }}
      >
        ×
      </Button>
    </div>
  )
}

export default function Page({ params }) {
  const className = useMemo(() => decodeURIComponent(String(params?.className || '')), [params])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  )

  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [defaults, setDefaults] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newSubject, setNewSubject] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await subjectsService.listSubjects({ className })
      const list = Array.isArray(res?.subjects) ? res.subjects : []
      list.sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
      setSubjects(list)
      setDefaults(Array.isArray(res?.defaults) ? res.defaults : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className])

  const defaultKeysInClass = useMemo(() => {
    const set = new Set()
    subjects.forEach((s) => set.add(normalizeKey(s?.name)))
    return set
  }, [subjects])

  const defaultsAvailable = useMemo(() => {
    return (defaults || [])
      .filter(Boolean)
      .filter((d) => !defaultKeysInClass.has(normalizeKey(d)))
      .sort((a, b) => String(a).localeCompare(String(b)))
  }, [defaults, defaultKeysInClass])

  const defaultNameKeySet = useMemo(() => new Set((defaults || []).map((d) => normalizeKey(d))), [defaults])

  async function createSubject(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await subjectsService.createSubject({ className, name: newSubject })
      setNewSubject('')
      setSuccess('Subject added')
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to add subject')
    }
  }

  async function applyDefaults() {
    setError('')
    setSuccess('')
    try {
      await subjectsService.applyDefaults({ className })
      setSuccess('Defaults applied (missing only)')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to apply defaults')
    }
  }

  async function applyDefaultsAll() {
    setError('')
    setSuccess('')
    try {
      await subjectsService.applyDefaults({})
      setSuccess('Defaults applied to all classes')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to apply defaults to all classes')
    }
  }

  async function removeSubject(subject) {
    setError('')
    setSuccess('')
    try {
      await subjectsService.deleteSubject(subject._id)
      const isDefault = defaultNameKeySet.has(normalizeKey(subject?.name))
      setSuccess(isDefault ? 'Removed (returned to defaults)' : 'Removed')
      await load()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to remove subject')
    }
  }

  async function onDragEnd(event) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active?.id || '')
    const overId = String(over?.id || '')

    // default -> subjects
    if (activeId.startsWith('default:') && overId === 'subjects-drop') {
      const name = decodeURIComponent(activeId.slice('default:'.length))
      if (!name) return
      try {
        await subjectsService.createSubject({ className, name })
        setSuccess('Subject added')
        await load()
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to add subject')
      }
      return
    }

    // subject -> defaults (remove)
    if (activeId.startsWith('subject:') && overId === 'defaults-drop') {
      const subjectId = activeId.slice('subject:'.length)
      const subject = subjects.find((s) => String(s._id) === String(subjectId))
      if (!subject) return
      await removeSubject(subject)
    }
  }

  return (
    <div>
      <PageHeader
        title={`Subjects — ${className}`}
        subtitle="Drag defaults into subjects. Drag a subject back (or ×) to remove."
        right={
          <ButtonLink href="/principal/subjects" variant="secondary">Back</ButtonLink>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <h2 className="font-medium">Defaults</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" onClick={applyDefaults}>Apply to This Class</Button>
              <Button type="button" onClick={applyDefaultsAll}>Apply to All Classes</Button>
            </div>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-24" />
              ) : (
                <DroppableArea id="defaults-drop">
                  {defaultsAvailable.length === 0 ? (
                    <div className="text-sm text-gray-600">No default subjects available.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {defaultsAvailable.map((d) => (
                        <DraggableItem key={d} id={`default:${encodeURIComponent(d)}`} label={d} />
                      ))}
                    </div>
                  )}
                </DroppableArea>
              )}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">Subjects</h2>
                <p className="text-sm text-gray-600 mt-1">Box style matches timetable pools. Remove with ×.</p>
              </div>
              <Button type="button" onClick={load}>Refresh</Button>
            </div>

            <form className="mt-4 flex gap-2" onSubmit={createSubject}>
              <Input
                className="flex-1"
                inputClassName="w-full"
                placeholder="Add subject and press Enter"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                required
              />
              <Button variant="primary" type="submit">Add</Button>
            </form>

            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-24" />
              ) : (
                <DroppableArea id="subjects-drop">
                  {subjects.length === 0 ? (
                    <div className="text-sm text-gray-600">No subjects yet.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {subjects.map((s) => (
                        <SubjectBox key={s._id} subject={s} onRemove={removeSubject} />
                      ))}
                    </div>
                  )}
                </DroppableArea>
              )}
            </div>
          </Card>
        </div>
      </DndContext>
    </div>
  )
}

