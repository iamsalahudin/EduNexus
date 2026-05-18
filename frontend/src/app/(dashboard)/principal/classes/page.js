"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton, Textarea, ToggleBox } from '@/components/ui'

function parseSections(text) {
  const raw = String(text || '')
  return raw
    .split(/\r?\n|,/g)
    .map((s) => String(s || '').trim())
    .filter(Boolean)
}

function sectionsToText(sections) {
  if (!Array.isArray(sections) || sections.length === 0) return ''
  return sections.join('\n')
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [levels, setLevels] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Edit
  const [selected, setSelected] = useState(null)
  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editNoSections, setEditNoSections] = useState(false)
  const [editSectionsText, setEditSectionsText] = useState('')

  async function loadClasses() {
    setLoading(true)
    setError('')
    try {
      const { classes: list } = await classesService.listClasses()
      setClasses(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load classes')
    } finally {
      setLoading(false)
    }
  }

  async function loadLevels() {
    try {
      const { levels: list } = await classesService.listLevels()
      setLevels(Array.isArray(list) ? list : [])
    } catch {
      setLevels([])
    }
  }

  useEffect(() => {
    loadClasses()
    loadLevels()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelOptions = useMemo(() => {
    const values = [
      ...levels,
      ...classes.map((c) => c?.level).filter(Boolean),
      editLevel,
    ].filter(Boolean)
    return [...new Set(values.map((v) => String(v).trim().toLowerCase()).filter(Boolean))]
  }, [levels, classes, editLevel])

  const editPayload = useMemo(() => {
    const payload = {
      name: String(editName || '').trim(),
      active: !!editActive,
      level: editLevel || undefined,
    }

    if (editNoSections) {
      payload.sections = []
    } else {
      payload.sections = parseSections(editSectionsText)
    }

    return payload
  }, [editName, editLevel, editActive, editNoSections, editSectionsText])

  function startEdit(c) {
    setSelected(c)
    setEditName(c?.name || '')
    setEditLevel(c?.level || '')
    setEditActive(typeof c?.active === 'boolean' ? c.active : true)
    const secs = Array.isArray(c?.sections) ? c.sections : []
    setEditNoSections(secs.length === 0)
    setEditSectionsText(sectionsToText(secs))
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!selected?._id) return
    setError('')
    setSuccess('')
    try {
      await classesService.updateClass(selected._id, editPayload)
      setSuccess('Class updated')
      await loadClasses()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to update class')
    }
  }

  async function deleteClass(c) {
    if (!c?._id) return
    setError('')
    setSuccess('')
    const ok = window.confirm(`Delete class "${c?.name || ''}"?`)
    if (!ok) return

    try {
      await classesService.deleteClass(c._id)
      setSuccess('Class deleted')
      if (selected?._id === c._id) setSelected(null)
      await loadClasses()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to delete class')
    }
  }

  return (
    <div>
      <PageHeader
        title="Classes/Sections"
        subtitle="Manage classes and their sections (e.g., Boys/Girls)."
        actions={(
          <div className="flex gap-2">
            <ButtonLink href="/principal/classes/add">Add Class</ButtonLink>
            <ButtonLink href="/principal/classes/rooms">Manage Rooms</ButtonLink>
            <ButtonLink href="/principal/classes/levels">Manage Levels</ButtonLink>
          </div>
        )}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Master Table */}
        <Card className="lg:col-span-2 ">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Class Master</h2>
              <p className="text-sm text-gray-600 mt-1">Click Edit to update a class on the right.</p>
            </div>
            <Button type="button" onClick={loadClasses}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="mt-4"><Skeleton className="h-24" /></div>
          ) : (
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Level</th>
                    <th className="py-2 pr-3">Sections</th>
                    <th className="py-2 pr-3">Active</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((c) => (
                    <tr
                      key={c._id}
                      className={`border-t ${selected?._id === c._id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="py-2 pr-3 whitespace-nowrap">{c.name}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {c.level || <span className="text-gray-500">(none)</span>}
                      </td>
                      <td className="py-2 pr-3">
                        {Array.isArray(c.sections) && c.sections.length > 0
                          ? c.sections.join(', ')
                          : <span className="text-gray-500">(none)</span>}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{String(c.active ?? true)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(c)}>
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => deleteClass(c)}>
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {classes.length === 0 ? (
                <div className="text-sm text-gray-600 mt-3">No classes found.</div>
              ) : null}
            </div>
          )}
        </Card>

        {/* Right: Edit Panel */}
        <Card>
          <h2 className="font-medium">Edit Class</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selected
              ? `Editing: ${selected.name}`
              : 'Select a class from the table to edit it here.'}
          </p>

          {selected ? (
            <form className="mt-4 space-y-3" onSubmit={saveEdit}>
              <Input
                placeholder="Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />

              <Select value={editLevel} onChange={(e) => setEditLevel(e.target.value)}>
                <option value="">Level (optional)</option>
                {levelOptions.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </Select>

              <div className="flex items-center gap-4 text-sm">
                <ToggleBox active={editActive} onToggle={(next) => setEditActive(next)}>
                  Active
                </ToggleBox>
                <ToggleBox
                  active={editNoSections}
                  onToggle={(next) => {
                    setEditNoSections(next)
                    if (next) setEditSectionsText('')
                  }}
                >
                  No sections
                </ToggleBox>
              </div>

              <Textarea
                textareaClassName="min-h-[96px]"
                placeholder={'Sections (one per line)\nBoys\nGirls'}
                value={editSectionsText}
                onChange={(e) => setEditSectionsText(e.target.value)}
                disabled={editNoSections}
              />

              <div className="flex gap-2">
                <Button variant="primary" type="submit">
                  Save
                </Button>
                <Button type="button" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex items-center justify-center h-48 border-2 border-dashed border-gray-200 rounded-lg">
              <p className="text-sm text-gray-400">No class selected</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}