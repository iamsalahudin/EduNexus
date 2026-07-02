'use client'

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import { ButtonLink, PageHeader } from '@/components/ui'
import ClassMasterTable from '@/components/classes/ClassMasterTable'
import ClassEditCard from '@/components/classes/ClassEditCard'

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

export default function ClassManagementWorkspace({
  title = 'Classes/Sections',
  subtitle = 'Manage classes and their sections (e.g., Boys/Girls).',
  roleBase = '/admin'
}) {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [levels, setLevels] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
        title={title}
        subtitle={subtitle}
        actions={(
          <div className="flex gap-2">
            <ButtonLink href={`${roleBase}/classes/add`}>Add Class</ButtonLink>
            <ButtonLink href={`${roleBase}/classes/rooms`}>Manage Rooms</ButtonLink>
            <ButtonLink href={`${roleBase}/classes/levels`}>Manage Levels</ButtonLink>
          </div>
        )}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ClassMasterTable
          loading={loading}
          classes={classes}
          selectedId={selected?._id}
          onEdit={startEdit}
          onDelete={deleteClass}
          onRefresh={loadClasses}
        />

        <ClassEditCard
          selected={selected}
          levelOptions={levelOptions}
          editName={editName}
          editLevel={editLevel}
          editActive={editActive}
          editNoSections={editNoSections}
          editSectionsText={editSectionsText}
          onChangeName={setEditName}
          onChangeLevel={setEditLevel}
          onToggleActive={(next) => setEditActive(next)}
          onToggleNoSections={(next) => {
            setEditNoSections(next)
            if (next) setEditSectionsText('')
          }}
          onChangeSectionsText={setEditSectionsText}
          onSubmit={saveEdit}
          onCancel={() => setSelected(null)}
        />
      </div>
    </div>
  )
}
