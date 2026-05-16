'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'
import notificationsService from '@/services/notificationsService'
import classesService from '@/services/classesService'

export default function SendNotificationsPage() {
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scope, setScope] = useState('global')
  const [category, setCategory] = useState('info')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [recipientMode, setRecipientMode] = useState('class')
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [recipientRole, setRecipientRole] = useState('Student')
  const [targetLevel, setTargetLevel] = useState('')
  const [targetUserId, setTargetUserId] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [attachments, setAttachments] = useState([])
  const [classes, setClasses] = useState([])
  const [sections, setSections] = useState([])
  const [levels, setLevels] = useState([])

  async function loadBroadcasts() {
    setLoading(true)
    setError('')
    try {
      const res = await notificationsService.listBroadcast({ limit: 50 })
      setBroadcasts(Array.isArray(res?.notifications) ? res.notifications : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function loadClasses() {
    try {
      const res = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(res?.classes) ? res.classes : [])
      const classList = Array.isArray(res?.classes) ? res.classes : []
      setSections([...new Set(classList.map((item) => item?.section).filter(Boolean))])
      setLevels([...new Set(classList.map((item) => item?.level).filter(Boolean))])
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadBroadcasts()
    loadClasses()
  }, [])

  async function handleSend(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const payload = {
        scope,
        category,
        title,
        body: message,
        expiresAt: expiresAt || undefined
      }

      if (scope === 'role') {
        payload.roles = [recipientRole]
      }

      if (scope === 'targeted') {
        payload.targetType = recipientMode
        payload.recipientRoles = recipientMode === 'user' ? [] : [recipientRole]
        if (recipientMode === 'class') payload.class = classId
        if (recipientMode === 'section') {
          payload.class = classId
          payload.section = section
        }
        if (recipientMode === 'level') payload.level = targetLevel
        if (recipientMode === 'user') payload.userId = targetUserId
      }

      const formData = new FormData()
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, item))
          return
        }
        formData.append(key, value)
      })
      attachments.forEach((file) => formData.append('attachments', file))

      await notificationsService.createBroadcast(formData)
      setSuccess('Notification sent')
      setTitle('')
      setMessage('')
      setScope('global')
      setCategory('info')
      setRecipientMode('class')
      setClassId('')
      setSection('')
      setRecipientRole('Student')
      setTargetLevel('')
      setTargetUserId('')
      setExpiresAt('')
      setAttachments([])
      loadBroadcasts()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to send')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Send Notifications" subtitle="Create and send broadcast notifications" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold mb-3">Compose</h2>
          <form onSubmit={handleSend} className="space-y-3 text-sm">
            <Select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="global">Global</option>
              <option value="role">Role</option>
              <option value="targeted">Targeted</option>
            </Select>
            {scope === 'role' ? (
              <Select value={recipientRole} onChange={(e) => setRecipientRole(e.target.value)}>
                <option value="Student">Student</option>
                <option value="Parent">Parent</option>
                <option value="Teacher">Teacher</option>
                <option value="Staff">Staff</option>
              </Select>
            ) : null}
            {scope === 'targeted' ? (
              <div className="space-y-3">
                <Select value={recipientMode} onChange={(e) => setRecipientMode(e.target.value)}>
                  <option value="class">Class</option>
                  <option value="section">Section</option>
                  <option value="level">Level</option>
                  <option value="user">User</option>
                </Select>
                {recipientMode !== 'user' ? (
                  <Select value={recipientRole} onChange={(e) => setRecipientRole(e.target.value)}>
                    <option value="Student">Student</option>
                    <option value="Parent">Parent</option>
                  </Select>
                ) : null}
                {recipientMode === 'class' ? (
                  <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </Select>
                ) : null}
                {recipientMode === 'section' ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select value={classId} onChange={(e) => setClassId(e.target.value)} required>
                      <option value="">Select class</option>
                      {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </Select>
                    <Select value={section} onChange={(e) => setSection(e.target.value)} required>
                      <option value="">Select section</option>
                      {sections.map((item) => <option key={item} value={item}>{item}</option>)}
                    </Select>
                  </div>
                ) : null}
                {recipientMode === 'level' ? (
                  <Select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} required>
                    <option value="">Select level</option>
                    {levels.map((item) => <option key={item} value={item}>{item}</option>)}
                  </Select>
                ) : null}
                {recipientMode === 'user' ? (
                  <Input placeholder="Target user ID" value={targetUserId} onChange={(e) => setTargetUserId(e.target.value)} required />
                ) : null}
              </div>
            ) : null}
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="info">Info</option>
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
              <option value="system">System</option>
            </Select>
            <Input placeholder="Title *" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea rows={4} placeholder="Message *" value={message} onChange={(e) => setMessage(e.target.value)} required />
            <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <Input type="file" multiple onChange={(e) => setAttachments(Array.from(e.target.files || []))} />
            <Button type="submit" variant="primary">Send</Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-semibold mb-3">Recent Broadcasts ({broadcasts.length})</h2>
          {loading ? <Skeleton className="h-40" /> : broadcasts.length === 0 ? <div className="text-xs text-gray-600">No broadcasts yet.</div> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {broadcasts.map((b) => (
                <div key={b._id} className="text-xs border-l-2 border-blue-400 pl-2 py-1">
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-gray-600">{b.body?.substring(0, 60)}</div>
                  <div className="text-gray-500 text-xs mt-1">{new Date(b.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
