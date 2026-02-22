"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import studentsService from '@/services/studentsService'
import notificationsService from '@/services/notificationsService'
import {
  Button,
  ButtonLink,
  Card,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  ToggleBox,
} from '@/components/ui'

function badgeClass(category) {
  if (category === 'critical') return 'border-red-300 text-red-800 bg-red-50'
  if (category === 'warning') return 'border-yellow-300 text-yellow-800 bg-yellow-50'
  if (category === 'pending') return 'border-yellow-300 text-yellow-800 bg-yellow-50'
  if (category === 'reminder') return 'border-blue-300 text-blue-800 bg-blue-50'
  if (category === 'info') return 'border-blue-300 text-blue-800 bg-blue-50'
  if (category === 'success') return 'border-green-300 text-green-800 bg-green-50'
  return 'border-gray-300 text-gray-800 bg-gray-50'
}

function statusBadgeClass(status) {
  if (status === 'pending') return 'border-yellow-300 text-yellow-800 bg-yellow-50'
  if (status === 'replied') return 'border-blue-300 text-blue-800 bg-blue-50'
  if (status === 'closed') return 'border-gray-300 text-gray-700 bg-gray-50'
  return 'border-gray-300 text-gray-700 bg-gray-50'
}

function fmtDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

export default function Page() {
  const [bootLoading, setBootLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [classes, setClasses] = useState([])

  const [globalList, setGlobalList] = useState([])
  const [roleList, setRoleList] = useState([])
  const [targetedList, setTargetedList] = useState([])
  const [requests, setRequests] = useState([])
  const [reqStatus, setReqStatus] = useState('')

  // Create: global
  const [gCategory, setGCategory] = useState('normal')
  const [gTitle, setGTitle] = useState('')
  const [gBody, setGBody] = useState('')
  const [gExpireHours, setGExpireHours] = useState('')

  // Create: role
  const [rCategory, setRCategory] = useState('normal')
  const [rTitle, setRTitle] = useState('')
  const [rBody, setRBody] = useState('')
  const [rRoles, setRRoles] = useState(['Teacher', 'Student', 'Parent'])
  const [rExpireHours, setRExpireHours] = useState('')

  // Create: targeted
  const [tCategory, setTCategory] = useState('normal')
  const [tTitle, setTTitle] = useState('')
  const [tBody, setTBody] = useState('')
  const [tExpireHours, setTExpireHours] = useState('')
  const [targetType, setTargetType] = useState('class')
  const [recipientRoles, setRecipientRoles] = useState(['Student'])
  const [level, setLevel] = useState('')
  const [cls, setCls] = useState('')
  const [section, setSection] = useState('')
  const [studentQuery, setStudentQuery] = useState('')
  const [studentResults, setStudentResults] = useState([])
  const [studentId, setStudentId] = useState('')

  const selectedClass = useMemo(() => classes.find((c) => String(c?.name) === String(cls)) || null, [classes, cls])
  const sections = useMemo(() => (Array.isArray(selectedClass?.sections) ? selectedClass.sections : []), [selectedClass])

  useEffect(() => {
    if (!cls) {
      if (section) setSection('')
      return
    }
    if (sections.length === 0) {
      if (section) setSection('')
      return
    }
    if (section && !sections.includes(section)) setSection('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls, sections])

  async function boot() {
    setBootLoading(true)
    setError('')
    try {
      const cRes = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load')
    } finally {
      setBootLoading(false)
    }
  }

  async function loadAll() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const [g, r, t, req] = await Promise.all([
        notificationsService.adminListBroadcast({ scope: 'global', limit: 50 }),
        notificationsService.adminListBroadcast({ scope: 'role', limit: 50 }),
        notificationsService.adminListBroadcast({ scope: 'targeted', limit: 50 }),
        notificationsService.listRequests({ status: reqStatus || undefined, limit: 50 })
      ])
      setGlobalList(Array.isArray(g?.notifications) ? g.notifications : [])
      setRoleList(Array.isArray(r?.notifications) ? r.notifications : [])
      setTargetedList(Array.isArray(t?.notifications) ? t.notifications : [])
      setRequests(Array.isArray(req?.requests) ? req.requests : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!bootLoading) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqStatus])

  async function createGlobal() {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const gHours = Number(gExpireHours)
      const expiresAt = gHours > 0 ? new Date(Date.now() + gHours * 3600 * 1000).toISOString() : undefined
      await notificationsService.adminCreateBroadcast({ scope: 'global', category: gCategory, title: gTitle, body: gBody, expiresAt })
      setSuccess('Global notification created')
      setGTitle('')
      setGBody('')
      setGExpireHours('')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  async function createRole() {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const rHours = Number(rExpireHours)
      const expiresAt = rHours > 0 ? new Date(Date.now() + rHours * 3600 * 1000).toISOString() : undefined
      await notificationsService.adminCreateBroadcast({ scope: 'role', category: rCategory, title: rTitle, body: rBody, roles: rRoles, expiresAt })
      setSuccess('Role notification created')
      setRTitle('')
      setRBody('')
      setRExpireHours('')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  async function searchStudents() {
    setError('')
    try {
      const res = await studentsService.listStudents({ q: studentQuery || undefined, limit: 50 })
      setStudentResults(Array.isArray(res?.students) ? res.students : [])
    } catch {
      setStudentResults([])
    }
  }

  async function createTargeted() {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const payload = {
        scope: 'targeted',
        category: tCategory,
        title: tTitle,
        body: tBody,
        targetType,
        recipientRoles
      }
      if (tExpireHours) payload.expiresAt = new Date(Date.now() + Number(tExpireHours) * 3600 * 1000).toISOString()
      if (targetType === 'level') payload.level = level
      const tHours = Number(tExpireHours)
      if (tHours > 0) payload.expiresAt = new Date(Date.now() + tHours * 3600 * 1000).toISOString()
      if (targetType === 'section') {
        payload.class = cls
        payload.section = section
      }
      if (targetType === 'student') payload.studentId = studentId

      await notificationsService.adminCreateBroadcast(payload)
      setSuccess('Targeted notification created')
      setTTitle('')
      setTBody('')
      setTExpireHours('')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  async function deleteBroadcast(id) {
    const ok = window.confirm('Delete this notification?')
    if (!ok) return
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await notificationsService.adminDeleteBroadcast(id)
      setSuccess('Notification deleted')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  function toggleRole(list, role) {
    const set = new Set(list)
    if (set.has(role)) set.delete(role)
    else set.add(role)
    return Array.from(set)
  }

  const allRoles = ['Admin', 'Principal', 'Finance', 'HR', 'Reception', 'Teacher', 'Student', 'Parent']

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle="Manage global, role-based, targeted notifications, and user requests."
        actions={
          <Button type="button" onClick={loadAll} disabled={loading || bootLoading}>
            Refresh
          </Button>
        }
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      {bootLoading ? (
        <div className="mt-6"><Skeleton className="h-40" /></div>
      ) : (
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card>
            <h2 className="font-medium">1) Global</h2>
            <div className="mt-3 space-y-2">
              <Select value={gCategory} onChange={(e) => setGCategory(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="reminder">Reminder</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </Select>
              <Input placeholder="Title" value={gTitle} onChange={(e) => setGTitle(e.target.value)} />
              <Textarea
                textareaClassName="min-h-[90px]"
                placeholder="Message"
                value={gBody}
                onChange={(e) => setGBody(e.target.value)}
              />
              <Input
                type="number"
                min="1"
                placeholder="Expire in hours (optional)"
                value={gExpireHours}
                onChange={(e) => setGExpireHours(e.target.value)}
              />
              <Button
                variant="primary"
                type="button"
                onClick={createGlobal}
                disabled={loading || !gTitle.trim()}
              >
                Create
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="font-medium">2) Role-based</h2>
            <div className="mt-3 space-y-2">
              <Select value={rCategory} onChange={(e) => setRCategory(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="reminder">Reminder</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </Select>
              <Input placeholder="Title" value={rTitle} onChange={(e) => setRTitle(e.target.value)} />
              <Textarea
                textareaClassName="min-h-[90px]"
                placeholder="Message"
                value={rBody}
                onChange={(e) => setRBody(e.target.value)}
              />
              <Input
                type="number"
                min="1"
                placeholder="Expire in hours (optional)"
                value={rExpireHours}
                onChange={(e) => setRExpireHours(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {allRoles.map((role) => (
                  <ToggleBox
                    key={role}
                    active={rRoles.includes(role)}
                    onToggle={() => setRRoles((prev) => toggleRole(prev, role))}
                  >
                    {role}
                  </ToggleBox>
                ))}
              </div>
              <Button
                variant="primary"
                type="button"
                onClick={createRole}
                disabled={loading || !rTitle.trim() || rRoles.length === 0}
              >
                Create
              </Button>
            </div>
          </Card>

          <Card>
            <h2 className="font-medium">3) Targeted</h2>
            <div className="mt-3 space-y-2">
              <Select value={tCategory} onChange={(e) => setTCategory(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="reminder">Reminder</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
              </Select>

              <Select value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                <option value="class">By Class</option>
                <option value="section">By Section</option>
                <option value="level">By Level</option>
                <option value="student">Single Student</option>
              </Select>

              <div className="flex flex-wrap gap-3 text-sm">
                <ToggleBox active={recipientRoles.includes('Student')} onToggle={() => setRecipientRoles((prev) => toggleRole(prev, 'Student'))}>
                  Students
                </ToggleBox>
                <ToggleBox active={recipientRoles.includes('Parent')} onToggle={() => setRecipientRoles((prev) => toggleRole(prev, 'Parent'))}>
                  Parents
                </ToggleBox>
              </div>

              {targetType === 'level' ? (
                <Select value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="">Select level</option>
                  <option value="pre-primary">Pre-primary</option>
                  <option value="primary">Primary</option>
                  <option value="middle">Middle</option>
                </Select>
              ) : null}

              {targetType === 'class' || targetType === 'section' ? (
                <>
                  <Select value={cls} onChange={(e) => setCls(e.target.value)}>
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c._id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  {targetType === 'section' ? (
                    <Select
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      disabled={!cls || sections.length === 0}
                    >
                      <option value="">{!cls ? 'Select class first' : sections.length === 0 ? 'No sections' : 'Select section'}</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  ) : null}
                </>
              ) : null}

              {targetType === 'student' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input
                      className="md:col-span-2"
                      placeholder="Search student (id/name)"
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                    />
                    <Button type="button" onClick={searchStudents}>
                      Search
                    </Button>
                  </div>
                  <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                    <option value="">Select student</option>
                    {studentResults.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.studentId} - {s.firstName} {s.lastName} ({s.class}-{s.section})
                      </option>
                    ))}
                  </Select>
                </>
              ) : null}

              <Input placeholder="Title" value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
              <Textarea
                textareaClassName="min-h-[90px]"
                placeholder="Message"
                value={tBody}
                onChange={(e) => setTBody(e.target.value)}
              />
              <Input
                type="number"
                min="1"
                placeholder="Expire in hours (optional)"
                value={tExpireHours}
                onChange={(e) => setTExpireHours(e.target.value)}
              />
              <Button
                variant="primary"
                type="button"
                onClick={createTargeted}
                disabled={
                  loading ||
                  !tTitle.trim() ||
                  recipientRoles.length === 0 ||
                  (targetType === 'level' && !level) ||
                  (targetType === 'class' && !cls) ||
                  (targetType === 'section' && (!cls || !section)) ||
                  (targetType === 'student' && !studentId)
                }
              >
                Create
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="font-medium">Requests (Teachers/Students/Parents)</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Select value={reqStatus} onChange={(e) => setReqStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="replied">Replied</option>
            <option value="closed">Closed</option>
          </Select>
          <div className="sm:col-span-2 text-sm text-gray-600 flex items-center">
            Filter affects the requests table only.
          </div>
        </div>
        <div className="mt-3 overflow-auto">
          {loading ? (
            <Skeleton className="h-40" />
          ) : requests.length === 0 ? (
            <div className="text-sm text-gray-600">No requests.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Category</th>
                  <th className="py-2 pr-3">From</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Updated</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 border rounded ${statusBadgeClass(r.status)}`}>{r.status}</span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 border rounded ${badgeClass(r.category)}`}>{r.category}</span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">{r?.requester?.name || '—'} ({r?.requester?.role || '—'})</td>
                    <td className="py-2 pr-3">{r.title}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.updatedAt || r.createdAt)}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      <ButtonLink href={`/admin/notifications/requests/${r._id}`} variant="outline" size="sm">
                        Open
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <h2 className="font-medium">Recent Global</h2>
          <div className="mt-3 space-y-2">
            {globalList.slice(0, 6).map((n) => (
              <div key={n._id} className="border rounded p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{n.title}</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => deleteBroadcast(n._id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                  <span>{fmtDateTime(n.createdAt)}</span>
                  <span className={`text-[11px] px-2 py-0.5 border rounded ${badgeClass(n.category)}`}>{n.category}</span>
                </div>
                {n.expiresAt ? <div className="text-xs text-gray-600 mt-1">Expires: {fmtDateTime(n.expiresAt)}</div> : null}
              </div>
            ))}
            {globalList.length === 0 ? <div className="text-sm text-gray-600">No global notifications.</div> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-medium">Recent Role-based</h2>
          <div className="mt-3 space-y-2">
            {roleList.slice(0, 6).map((n) => (
              <div key={n._id} className="border rounded p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{n.title}</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => deleteBroadcast(n._id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                  <span>{fmtDateTime(n.createdAt)}</span>
                  <span className={`text-[11px] px-2 py-0.5 border rounded ${badgeClass(n.category)}`}>{n.category}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">Roles: {(n.targetRoles || []).join(', ') || '—'}</div>
                {n.expiresAt ? <div className="text-xs text-gray-600 mt-1">Expires: {fmtDateTime(n.expiresAt)}</div> : null}
              </div>
            ))}
            {roleList.length === 0 ? <div className="text-sm text-gray-600">No role notifications.</div> : null}
          </div>
        </Card>
        <Card>
          <h2 className="font-medium">Recent Targeted</h2>
          <div className="mt-3 space-y-2">
            {targetedList.slice(0, 6).map((n) => (
              <div key={n._id} className="border rounded p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">{n.title}</div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => deleteBroadcast(n._id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
                <div className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                  <span>{fmtDateTime(n.createdAt)}</span>
                  <span className={`text-[11px] px-2 py-0.5 border rounded ${badgeClass(n.category)}`}>{n.category}</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Target: {n.targetClass ? `${n.targetClass}${n.targetSection ? `-${n.targetSection}` : ''}` : Array.isArray(n.targetLevels) && n.targetLevels.length ? `Level: ${n.targetLevels.join(', ')}` : Array.isArray(n.targetStudents) && n.targetStudents.length ? 'Student' : '—'}
                </div>
                {n.expiresAt ? <div className="text-xs text-gray-600 mt-1">Expires: {fmtDateTime(n.expiresAt)}</div> : null}
              </div>
            ))}
            {targetedList.length === 0 ? <div className="text-sm text-gray-600">No targeted notifications.</div> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}


