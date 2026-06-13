"use client"

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui'
import hrTeachersService from '@/services/hrTeachersService'
import classesService from '@/services/classesService'
import TeacherCreateCard from '@/components/hr/TeacherCreateCard'
import TeacherMasterCard from '@/components/hr/TeacherMasterCard'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [classes, setClasses] = useState([])

  // Create form
  const [newName, setNewName] = useState('')
  const [newUsername, setNewUsername] = useState('')
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
        username: newUsername,
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
      setNewUsername('')
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
        <TeacherCreateCard
          classes={classes}
          sections={newSections}
          newName={newName}
          newUsername={newUsername}
          newEmail={newEmail}
          newPassword={newPassword}
          newClass={newClass}
          newSection={newSection}
          onNameChange={setNewName}
          onUsernameChange={setNewUsername}
          onEmailChange={setNewEmail}
          onPasswordChange={setNewPassword}
          onClassChange={setNewClass}
          onSectionChange={setNewSection}
          onSubmit={createTeacher}
        />

        <TeacherMasterCard
          loading={loading}
          teachers={teachers}
          q={q}
          onQueryChange={setQ}
          onSearch={load}
          onRefresh={load}
          onEdit={startEdit}
          selected={selected}
          editName={editName}
          editEmail={editEmail}
          editActive={editActive}
          editClass={editClass}
          editSection={editSection}
          editSections={editSections}
          classes={classes}
          onEditNameChange={setEditName}
          onEditEmailChange={setEditEmail}
          onEditClassChange={setEditClass}
          onEditSectionChange={setEditSection}
          onEditActiveToggle={(next) => setEditActive(next)}
          onEditSubmit={saveEdit}
          onEditCancel={() => setSelected(null)}
        />
      </div>
    </div>
  )
}

