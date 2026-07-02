'use client'

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton } from '@/components/ui'

function normalize(value) {
  return String(value || '').trim().toLowerCase()
}

export default function ClassLevelsWorkspace({
  roleBase = '/admin',
  title = 'Class Level Settings',
  subtitle = 'View, edit, and add levels used across class forms.'
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [levels, setLevels] = useState([])
  const [newLevel, setNewLevel] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await classesService.listLevels()
      setLevels(Array.isArray(res?.levels) ? res.levels : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load level settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const hasDuplicates = useMemo(() => {
    const seen = new Set()
    for (const level of levels) {
      const key = normalize(level)
      if (!key) continue
      if (seen.has(key)) return true
      seen.add(key)
    }
    return false
  }, [levels])

  function addLevel() {
    const normalized = normalize(newLevel)
    if (!normalized) return
    if (levels.some((level) => normalize(level) === normalized)) {
      setError('Level already exists')
      return
    }
    setLevels((prev) => [...prev, normalized])
    setNewLevel('')
    setError('')
  }

  function updateLevelAt(index, value) {
    setLevels((prev) => prev.map((level, i) => (i === index ? value : level)))
  }

  function removeLevelAt(index) {
    setLevels((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveLevels() {
    const cleaned = levels.map(normalize).filter(Boolean)
    if (cleaned.length === 0) {
      setError('At least one level is required')
      return
    }
    if (new Set(cleaned).size !== cleaned.length) {
      setError('Duplicate levels are not allowed')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await classesService.updateLevels({ levels: cleaned })
      setLevels(Array.isArray(res?.levels) ? res.levels : cleaned)
      setSuccess('Level settings updated')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save level settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={<ButtonLink href={`${roleBase}/classes`} variant="secondary">Back to Classes</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}
      {hasDuplicates ? <div className="mt-4 text-sm text-amber-700">Duplicate values found. Please fix before saving.</div> : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="space-y-3">
            {levels.map((level, index) => (
              <div key={`${level}-${index}`} className="flex items-center gap-2">
                <Input
                  value={level}
                  onChange={(e) => updateLevelAt(index, e.target.value)}
                  placeholder="Level name"
                />
                <Button type="button" variant="outline" onClick={() => removeLevelAt(index)}>
                  Remove
                </Button>
              </div>
            ))}

            {levels.length === 0 ? <div className="text-sm text-gray-600">No levels configured yet.</div> : null}

            <div className="pt-4 border-t flex flex-col sm:flex-row gap-2">
              <Input
                value={newLevel}
                onChange={(e) => setNewLevel(e.target.value)}
                placeholder="Add new level (e.g., high)"
              />
              <Button type="button" onClick={addLevel}>Add Level</Button>
            </div>

            <div className="pt-2">
              <Button type="button" variant="primary" onClick={saveLevels} disabled={saving || loading || hasDuplicates}>
                {saving ? 'Saving...' : 'Save Levels'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
