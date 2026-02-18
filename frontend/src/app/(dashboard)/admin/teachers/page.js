"use client"

import { useEffect, useState } from 'react'
import userService from '@/services/user.service'
import classesService from '@/services/classesService'
import Skeleton from '@/components/ui/Skeleton'

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
      // Keep teacher management usable even if classes fail to load
      setClasses([])
    }
  }

  async function loadTeachers() {
    setLoading(true)
    setError('')
    try {
      const { users } = await userService.listUsers({ role: 'Teacher', q: q || undefined, limit: 200 })
      setTeachers(Array.isArray(users) ? users : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTeachers()
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
      await userService.createUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: 'Teacher',
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
      await loadTeachers()
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
      await userService.updateUser(selected._id, {
        name: editName,
        email: editEmail,
        active: editActive,
        profile: { class: editClass, section: editSection }
      })
      setSuccess('Teacher updated')
      await loadTeachers()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Failed to update teacher')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Teachers</h1>
      <p className="text-sm text-gray-600 mt-1">Teacher accounts and assignments.</p>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-medium">Create Teacher</h2>
          <form className="mt-4 space-y-3" onSubmit={createTeacher}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <input className="input" placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              <input className="input" placeholder="Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <select className="input" value={newClass} onChange={(e) => setNewClass(e.target.value)}>
                <option value="">Class (optional)</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select
                className="input"
                value={newSection}
                onChange={(e) => setNewSection(e.target.value)}
                disabled={!newClass || newSections.length === 0}
              >
                <option value="">
                  {!newClass ? 'Select class first' : newSections.length === 0 ? 'No sections' : 'Section (optional)'}
                </option>
                {newSections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button className="btn-primary" type="submit">Create</button>
          </form>
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Teacher Master</h2>
              <p className="text-sm text-gray-600 mt-1">Search and edit teacher accounts.</p>
            </div>
            <button className="px-3 py-2 border rounded hover-theme-primary" onClick={loadTeachers}>Refresh</button>
          </div>

          <div className="mt-4 flex gap-2">
            <input className="input" placeholder="Search by name/email" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="px-3 py-2 border rounded hover-theme-primary" onClick={loadTeachers}>Search</button>
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
                        <button className="px-3 py-1 border rounded hover-theme-primary" onClick={() => startEdit(t)}>Edit</button>
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
                  <input className="input" placeholder="Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  <input className="input" placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                  <select className="input" value={editClass} onChange={(e) => setEditClass(e.target.value)}>
                    <option value="">Class (optional)</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={editSection}
                    onChange={(e) => setEditSection(e.target.value)}
                    disabled={!editClass || editSections.length === 0}
                  >
                    <option value="">
                      {!editClass ? 'Select class first' : editSections.length === 0 ? 'No sections' : 'Section (optional)'}
                    </option>
                    {editSections.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                  Active
                </label>
                <div className="flex gap-2">
                  <button className="btn-primary" type="submit">Save</button>
                  <button type="button" className="px-3 py-2 border rounded hover-theme-primary" onClick={() => setSelected(null)}>Cancel</button>
                </div>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
