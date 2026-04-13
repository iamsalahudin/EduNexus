'use client'

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import { Button, ButtonLink, Card, Input, PageHeader, Skeleton } from '@/components/ui'

function normalize(value) {
  return String(value || '').trim()
}

export default function PrincipalClassRoomsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rooms, setRooms] = useState([])
  const [newRoom, setNewRoom] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await classesService.listRooms()
      setRooms(Array.isArray(res?.rooms) ? res.rooms : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load room settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const hasDuplicates = useMemo(() => {
    const seen = new Set()
    for (const room of rooms) {
      const key = normalize(room).toLowerCase()
      if (!key) continue
      if (seen.has(key)) return true
      seen.add(key)
    }
    return false
  }, [rooms])

  function addRoom() {
    const candidate = normalize(newRoom)
    if (!candidate) return
    if (rooms.some((r) => normalize(r).toLowerCase() === candidate.toLowerCase())) {
      setError('Room already exists')
      return
    }
    setRooms((prev) => [...prev, candidate])
    setNewRoom('')
    setError('')
  }

  function updateRoomAt(index, value) {
    setRooms((prev) => prev.map((room, i) => (i === index ? value : room)))
  }

  function removeRoomAt(index) {
    setRooms((prev) => prev.filter((_, i) => i !== index))
  }

  async function saveRooms() {
    const cleaned = rooms.map(normalize).filter(Boolean)
    if (cleaned.length === 0) {
      setError('At least one room is required')
      return
    }
    if (new Set(cleaned.map((r) => r.toLowerCase())).size !== cleaned.length) {
      setError('Duplicate rooms are not allowed')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await classesService.updateRooms({ rooms: cleaned })
      setRooms(Array.isArray(res?.rooms) ? res.rooms : cleaned)
      setSuccess('Room settings updated')
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save room settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Class Room Settings"
        subtitle="Manage the rooms list used by timetable creation and editing."
        actions={<ButtonLink href="/principal/classes">Back to Classes</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}
      {hasDuplicates ? <div className="mt-4 text-sm text-amber-700">Duplicate room values found. Please fix before saving.</div> : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="space-y-3">
            {rooms.map((room, index) => (
              <div key={`${room}-${index}`} className="flex items-center gap-2">
                <Input
                  value={room}
                  onChange={(e) => updateRoomAt(index, e.target.value)}
                  placeholder="Room name"
                />
                <Button type="button" variant="outline" onClick={() => removeRoomAt(index)}>
                  Remove
                </Button>
              </div>
            ))}

            {rooms.length === 0 ? <div className="text-sm text-gray-600">No rooms configured yet.</div> : null}

            <div className="pt-4 border-t flex flex-col sm:flex-row gap-2">
              <Input
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="Add new room (e.g., Room 13)"
              />
              <Button type="button" onClick={addRoom}>Add Room</Button>
            </div>

            <div className="pt-2">
              <Button type="button" variant="primary" onClick={saveRooms} disabled={saving || loading || hasDuplicates}>
                {saving ? 'Saving...' : 'Save Rooms'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
