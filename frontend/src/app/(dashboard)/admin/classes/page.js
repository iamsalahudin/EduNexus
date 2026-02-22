"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea, ToggleBox } from '@/components/ui'

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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Create
  const [newName, setNewName] = useState('')
  const [newLevel, setNewLevel] = useState('')
  const [newNoSections, setNewNoSections] = useState(false)
  const [newSectionsText, setNewSectionsText] = useState('')

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

  useEffect(() => {
    loadClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createPayload = useMemo(() => {
    const payload = { name: String(newName || '').trim() }

    if (newLevel) payload.level = newLevel

    if (newNoSections) {
      payload.sections = []
    } else {
      const parsed = parseSections(newSectionsText)
      // If sections is omitted, backend defaults to Boys/Girls
      if (parsed.length > 0) payload.sections = parsed
    }

    return payload
  }, [newName, newLevel, newNoSections, newSectionsText])

  async function createClass(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await classesService.createClass(createPayload)
      setSuccess('Class created')
      setNewName('')
      setNewLevel('')
      setNewNoSections(false)
      setNewSectionsText('')
      await loadClasses()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to create class')
    }
  }

  function startEdit(c) {
    setSelected(c)
    setEditName(c?.name || '')
    setEditLevel(c?.level || '')
    setEditActive(typeof c?.active === 'boolean' ? c.active : true)
    const secs = Array.isArray(c?.sections) ? c.sections : []
    setEditNoSections(secs.length === 0)
    setEditSectionsText(sectionsToText(secs))
  }

  const editPayload = useMemo(() => {
    const payload = {
      name: String(editName || '').trim(),
      active: !!editActive,
      level: editLevel || undefined
    }

    if (editNoSections) {
      payload.sections = []
    } else {
      payload.sections = parseSections(editSectionsText)
    }

    return payload
  }, [editName, editLevel, editActive, editNoSections, editSectionsText])

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
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-medium">Create Class</h2>
          <p className="text-sm text-gray-600 mt-1">If you leave sections blank, default sections are Boys and Girls.</p>

          <form className="mt-4 space-y-3" onSubmit={createClass}>
            <Input
              placeholder="Class name (e.g., Grade 1)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />

            <Select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
              <option value="">Level (optional)</option>
              <option value="pre-primary">Pre-primary</option>
              <option value="primary">Primary</option>
              <option value="middle">Middle</option>
            </Select>

            <div className="flex items-center gap-2 text-sm">
              <ToggleBox
                active={newNoSections}
                onToggle={(next) => {
                  setNewNoSections(next)
                  if (next) setNewSectionsText('')
                }}
              >
                Create with no sections
              </ToggleBox>
            </div>

            <Textarea
              textareaClassName="min-h-[96px]"
              placeholder={'Sections (one per line)\nBoys\nGirls'}
              value={newSectionsText}
              onChange={(e) => setNewSectionsText(e.target.value)}
              disabled={newNoSections}
            />
            <Button variant="primary" type="submit">
              Create
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Class Master</h2>
              <p className="text-sm text-gray-600 mt-1">Edit, deactivate, or delete classes.</p>
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
                    <tr key={c._id} className="border-t">
                      <td className="py-2 pr-3 whitespace-nowrap">{c.name}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{c.level || <span className="text-gray-500">(none)</span>}</td>
                      <td className="py-2 pr-3">
                        {Array.isArray(c.sections) && c.sections.length > 0 ? c.sections.join(', ') : <span className="text-gray-500">(none)</span>}
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
              {classes.length === 0 ? <div className="text-sm text-gray-600 mt-3">No classes found.</div> : null}
            </div>
          )}

          {selected ? (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium">Edit Class</h3>
              <form className="mt-3 space-y-3" onSubmit={saveEdit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  <div className="flex items-center gap-2 text-sm">
                    <ToggleBox active={editActive} onToggle={(next) => setEditActive(next)}>
                      Active
                    </ToggleBox>
                  </div>
                </div>

                <Select value={editLevel} onChange={(e) => setEditLevel(e.target.value)}>
                  <option value="">Level (optional)</option>
                  <option value="pre-primary">Pre-primary</option>
                  <option value="primary">Primary</option>
                  <option value="middle">Middle</option>
                </Select>

                <div className="flex items-center gap-2 text-sm">
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
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  )
}

