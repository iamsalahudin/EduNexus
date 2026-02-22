"use client"

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, ToggleBox } from '@/components/ui'
import hrTeachersService from '@/services/hrTeachersService'
import classesService from '@/services/classesService'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [classes, setClasses] = useState([])

  // Create form
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newClass, setNewClass] = useState('')
  const [newSection, setNewSection] = useState('')

  // Edit form
  const [selected, setSelected] = useState(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editClass, setEditClass] = useState('')
  const [editSection, setEditSection] = useState('')

  const newSections = (() => {
    const c = classes.find((x) => String(x?.name) === String(newClass))
    return Array.isArray(c?.sections) ? c.sections : []
  })()

  const editSections = (() => {
    const c = classes.find((x) => String(x?.name) === String(editClass))
    return Array.isArray(c?.sections) ? c.sections : []
  })()

  async function loadClasses() {
    try {
      const { classes: list } = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(list) ? list : [])
    } catch (e) {
      setClasses([])
    }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { users } = await hrTeachersService.listTeachers({ q: q || undefined, limit: 200 })
      setTeachers(Array.isArray(users) ? users : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    loadClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!newClass) {
      if (newSection) setNewSection('')
      return
    }
    if (newSections.length > 0 && newSection && !newSections.includes(newSection)) {
      setNewSection('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newClass, classes])

  useEffect(() => {
    if (!editClass) {
      if (editSection) setEditSection('')
      return
    }
    if (editSections.length > 0 && editSection && !editSections.includes(editSection)) {
      setEditSection('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editClass, classes])

  async function createTeacher(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await hrTeachersService.createTeacher({
        name: newName,
        email: newEmail,
        password: newPassword,
        active: true,
        profile: {
          ...(newClass ? { class: newClass } : {}),
          ...(newSection ? { section: newSection } : {})
        }
      })
      setSuccess('Teacher created')
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewClass('')
      setNewSection('')
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to create teacher')
    }
  }

  function startEdit(t) {
    setSelected(t)
    setEditName(t?.name || '')
    setEditEmail(t?.email || '')
    setEditActive(typeof t?.active === 'boolean' ? t.active : true)
    setEditClass(t?.profile?.class || '')
    setEditSection(t?.profile?.section || '')
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!selected?._id) return
    setError('')
    setSuccess('')
    try {
      await hrTeachersService.updateTeacher(selected._id, {
        name: editName,
        email: editEmail,
        active: editActive,
        profile: { class: editClass, section: editSection }
      })
      setSuccess('Teacher updated')
      await load()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to update teacher')
    }
  }

  return (
    <div>
      <PageHeader title="Teachers" subtitle="HR teacher management (teachers only)." />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-medium">Create Teacher</h2>
          <form className="mt-4 space-y-3" onSubmit={createTeacher}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <Input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              <Input
                placeholder="Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Select value={newClass} onChange={(e) => setNewClass(e.target.value)}>
                <option value="">Class (optional)</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                disabled={!newClass || newSections.length === 0}
              >
                <option value="">
                  {!newClass ? 'Select class first' : newSections.length === 0 ? 'No sections' : 'Section (optional)'}
                </option>
                {newSections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="primary" type="submit">
              Create
            </Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Teacher Master</h2>
              <p className="text-sm text-gray-600 mt-1">Search and edit teachers.</p>
            </div>
            <Button onClick={load}>Refresh</Button>
          </div>

          <div className="mt-4 flex gap-2">
            <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
            <Button onClick={load}>Search</Button>
          </div>

          {loading ? (
            <div className="mt-4"><Skeleton className="h-24" /></div>
          ) : (
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Class</th>
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 pr-3">Active</th>
                    <th className="py-2 pr-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t._id} className="border-t">
                      <td className="py-2 pr-3 whitespace-nowrap">{t.name}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{t.email}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{t.profile?.class || ''}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{t.profile?.section || ''}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{String(t.active ?? true)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {teachers.length === 0 ? <div className="text-sm text-gray-600 mt-3">No teachers found.</div> : null}
            </div>
          )}

          {selected ? (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-medium">Edit Teacher</h3>
              <form className="mt-3 space-y-3" onSubmit={saveEdit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  <Input placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                  <Select value={editClass} onChange={(e) => setEditClass(e.target.value)}>
                    <option value="">Class (optional)</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Select
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    disabled={!editClass || editSections.length === 0}
                  >
                    <option value="">
                      {!editClass ? 'Select class first' : editSections.length === 0 ? 'No sections' : 'Section (optional)'}
                    </option>
                    {editSections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ToggleBox active={editActive} onToggle={(next) => setEditActive(next)}>Active</ToggleBox>
                </div>
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

