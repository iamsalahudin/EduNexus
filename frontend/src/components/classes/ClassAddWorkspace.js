'use client'

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Textarea, ToggleBox } from '@/components/ui'

function parseSections(text) {
  const raw = String(text || '')
  return raw
    .split(/\r?\n|,/g)
    .map((section) => String(section || '').trim())
    .filter(Boolean)
}

export default function ClassAddWorkspace({
  roleBase = '/admin',
  title = 'Add Class',
  subtitle = 'Create a new class and configure its sections.'
}) {
  const [classes, setClasses] = useState([])
  const [levels, setLevels] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [newName, setNewName] = useState('')
  const [newLevel, setNewLevel] = useState('')
  const [newNoSections, setNewNoSections] = useState(false)
  const [newSectionsText, setNewSectionsText] = useState('')

  async function loadLevels() {
    try {
      const { levels: list } = await classesService.listLevels()
      setLevels(Array.isArray(list) ? list : [])
    } catch {
      setLevels([])
    }
  }

  async function loadClasses() {
    try {
      const { classes: list } = await classesService.listClasses()
      setClasses(Array.isArray(list) ? list : [])
    } catch {
      setClasses([])
    }
  }

  useEffect(() => {
    loadLevels()
    loadClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelOptions = useMemo(() => {
    const values = [
      ...levels,
      ...classes.map((item) => item?.level).filter(Boolean),
      newLevel,
    ].filter(Boolean)
    return [...new Set(values.map((value) => String(value).trim().toLowerCase()).filter(Boolean))]
  }, [levels, classes, newLevel])

  const createPayload = useMemo(() => {
    const payload = { name: String(newName || '').trim() }

    if (newLevel) payload.level = newLevel

    if (newNoSections) {
      payload.sections = []
    } else {
      const parsed = parseSections(newSectionsText)
      if (parsed.length > 0) payload.sections = parsed
    }

    return payload
  }, [newName, newLevel, newNoSections, newSectionsText])

  async function createClass(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    try {
      await classesService.createClass(createPayload)
      setSuccess('Class created')
      setNewName('')
      setNewLevel('')
      setNewNoSections(false)
      setNewSectionsText('')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create class')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<ButtonLink href={`${roleBase}/classes`}>Back to Classes</ButtonLink>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card>
        <h2 className="font-medium">Class Details</h2>
        <p className="text-sm text-gray-600 mt-1">
          If you leave sections blank, default sections are Boys and Girls.
        </p>

        <form className="mt-4 space-y-3" onSubmit={createClass}>
          <Input
            placeholder="Class name (e.g., Grade 1)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />

          <Select value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
            <option value="">Level (optional)</option>
            {levelOptions.map((level) => (
              <option key={level} value={level}>{level}</option>
            ))}
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

          <div className="flex gap-2">
            <Button variant="primary" type="submit">
              Create Class
            </Button>
            <ButtonLink href={`${roleBase}/classes`}>
              Cancel
            </ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  )
}
