'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import classesService from '@/services/classesService'
import { ButtonLink, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import ClassEditCard from '@/components/classes/ClassEditCard'

function parseSections(text) {
  const raw = String(text || '')
  return raw
    .split(/\r?\n|,/g)
    .map((section) => String(section || '').trim())
    .filter(Boolean)
}

function sectionsToText(sections) {
  if (!Array.isArray(sections) || sections.length === 0) return ''
  return sections.join('\n')
}

export default function ClassEditWorkspace({
  classId,
  roleBase = '/admin',
  title = 'Edit Class',
  subtitle = 'Update class details and sections.'
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [levels, setLevels] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [notFound, setNotFound] = useState(false)

  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [editNoSections, setEditNoSections] = useState(false)
  const [editSectionsText, setEditSectionsText] = useState('')

  const levelOptions = useMemo(() => {
    const values = [
      ...levels,
      selected?.level,
      editLevel,
    ].filter(Boolean)
    return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))]
  }, [levels, selected, editLevel])

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

  async function load() {
    if (!classId) {
      setError('Class id is missing')
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setNotFound(false)

    try {
      const [classesRes, levelsRes] = await Promise.all([
        classesService.listClasses(),
        classesService.listLevels(),
      ])

      const classes = Array.isArray(classesRes?.classes) ? classesRes.classes : []
      const match = classes.find((item) => String(item?._id) === String(classId))
      setLevels(Array.isArray(levelsRes?.levels) ? levelsRes.levels : [])

      if (!match) {
        setNotFound(true)
        setSelected(null)
        return
      }

      setSelected(match)
      setEditName(match?.name || '')
      setEditLevel(match?.level || '')
      setEditActive(typeof match?.active === 'boolean' ? match.active : true)
      const sections = Array.isArray(match?.sections) ? match.sections : []
      setEditNoSections(sections.length === 0)
      setEditSectionsText(sectionsToText(sections))
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load class data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId])

  async function saveEdit(event) {
    event.preventDefault()
    if (!selected?._id) return
    setError('')
    setSuccess('')
    try {
      await classesService.updateClass(selected._id, editPayload)
      setSuccess('Class updated')
      await load()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update class')
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<ButtonLink href={`${roleBase}/classes`}>Back to Classes</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-48" />
        ) : notFound ? (
          <EmptyState
            title="Class not found"
            description="The class you are looking for does not exist or was removed."
          />
        ) : (
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
            onCancel={() => router.push(`${roleBase}/classes`)}
          />
        )}
      </div>
    </div>
  )
}
