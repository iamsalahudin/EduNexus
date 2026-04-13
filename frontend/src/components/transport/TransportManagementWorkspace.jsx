'use client'

import { useEffect, useMemo, useState } from 'react'
import transportService from '@/services/transportService'
import studentsService from '@/services/studentsService'
import directoryService from '@/services/directoryService'
import { Button, Card, Input, PageHeader, Select, Skeleton, Textarea } from '@/components/ui'

function fmtDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function paymentBadge(status) {
  if (status === 'paid') return 'border-green-300 bg-green-50 text-green-700'
  if (status === 'partial') return 'border-blue-300 bg-blue-50 text-blue-700'
  if (status === 'overdue') return 'border-red-300 bg-red-50 text-red-700'
  return 'border-yellow-300 bg-yellow-50 text-yellow-700'
}

function requestBadge(status) {
  if (status === 'approved') return 'border-green-300 bg-green-50 text-green-700'
  if (status === 'rejected') return 'border-red-300 bg-red-50 text-red-700'
  if (status === 'cancelled') return 'border-gray-300 bg-gray-100 text-gray-700'
  return 'border-yellow-300 bg-yellow-50 text-yellow-700'
}

export default function TransportManagementWorkspace({
  title,
  subtitle,
  canManageRoutes,
  canManageReports,
  canDelete,
  canManagePayments
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [routes, setRoutes] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [requests, setRequests] = useState([])
  const [payments, setPayments] = useState([])

  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])

  const [routeForm, setRouteForm] = useState({
    name: '',
    code: '',
    pickupPoint: '',
    dropoffPoint: '',
    fee: '',
    vehicleNumber: '',
    driverName: '',
    driverPhone: ''
  })

  const [subjectRole, setSubjectRole] = useState('Student')
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedTeacherUserId, setSelectedTeacherUserId] = useState('')
  const [enrollmentNotes, setEnrollmentNotes] = useState('')

  const [summary, setSummary] = useState(null)
  const [routeCounts, setRouteCounts] = useState([])
  const [defaulters, setDefaulters] = useState([])
  const [revenueTrend, setRevenueTrend] = useState([])

  const selectedRouteFee = useMemo(() => {
    const route = routes.find((row) => String(row._id) === String(selectedRouteId))
    return Number(route?.fee || 0)
  }, [routes, selectedRouteId])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [routesRes, enrollmentsRes, requestsRes, paymentsRes] = await Promise.all([
        transportService.listRoutes({ limit: 200 }),
        transportService.listEnrollments({ limit: 100 }),
        transportService.listRequests({ limit: 100 }),
        transportService.listPayments({ limit: 100 })
      ])
      setRoutes(Array.isArray(routesRes?.routes) ? routesRes.routes : [])
      setEnrollments(Array.isArray(enrollmentsRes?.enrollments) ? enrollmentsRes.enrollments : [])
      setRequests(Array.isArray(requestsRes?.requests) ? requestsRes.requests : [])
      setPayments(Array.isArray(paymentsRes?.payments) ? paymentsRes.payments : [])

      if (canManageReports) {
        const [summaryRes, routeCountsRes, defaultersRes, trendRes] = await Promise.all([
          transportService.getPaymentSummaryReport(),
          transportService.getRouteCountsReport(),
          transportService.getDefaultersReport(),
          transportService.getRevenueTrendReport()
        ])
        setSummary(summaryRes || null)
        setRouteCounts(Array.isArray(routeCountsRes?.routes) ? routeCountsRes.routes : [])
        setDefaulters(Array.isArray(defaultersRes?.defaulters) ? defaultersRes.defaulters : [])
        setRevenueTrend(Array.isArray(trendRes?.trend) ? trendRes.trend : [])
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load transport data')
    } finally {
      setLoading(false)
    }
  }

  async function loadPeople() {
    try {
      const [sRes, tRes] = await Promise.all([
        studentsService.listStudents({ limit: 200 }),
        directoryService.listUsers({ role: 'Teacher', limit: 200 })
      ])
      setStudents(Array.isArray(sRes?.students) ? sRes.students : [])
      setTeachers(Array.isArray(tRes?.users) ? tRes.users : [])
    } catch {
      setStudents([])
      setTeachers([])
    }
  }

  useEffect(() => {
    loadAll()
    loadPeople()
  }, [])

  async function createRoute() {
    setError('')
    setSuccess('')
    try {
      await transportService.createRoute({
        ...routeForm,
        fee: Number(routeForm.fee || 0)
      })
      setSuccess('Route created')
      setRouteForm({
        name: '',
        code: '',
        pickupPoint: '',
        dropoffPoint: '',
        fee: '',
        vehicleNumber: '',
        driverName: '',
        driverPhone: ''
      })
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to create route')
    }
  }

  async function editRoute(route) {
    setError('')
    setSuccess('')
    const name = window.prompt('Route name', String(route?.name || ''))
    if (name === null) return
    const pickupPoint = window.prompt('Pickup point', String(route?.pickupPoint || ''))
    if (pickupPoint === null) return
    const dropoffPoint = window.prompt('Dropoff point', String(route?.dropoffPoint || ''))
    if (dropoffPoint === null) return
    const fee = window.prompt('Fee', String(route?.fee ?? 0))
    if (fee === null) return
    const code = window.prompt('Code', String(route?.code || ''))
    if (code === null) return
    const vehicleNumber = window.prompt('Vehicle number', String(route?.vehicleNumber || ''))
    if (vehicleNumber === null) return
    const driverName = window.prompt('Driver name', String(route?.driverName || ''))
    if (driverName === null) return
    const driverPhone = window.prompt('Driver phone', String(route?.driverPhone || ''))
    if (driverPhone === null) return
    const active = window.confirm('Keep this route active? Click Cancel to mark inactive.')

    try {
      await transportService.updateRoute(route._id, {
        name: String(name).trim(),
        pickupPoint: String(pickupPoint).trim(),
        dropoffPoint: String(dropoffPoint).trim(),
        fee: Number(fee),
        code: String(code).trim() || undefined,
        vehicleNumber: String(vehicleNumber).trim() || undefined,
        driverName: String(driverName).trim() || undefined,
        driverPhone: String(driverPhone).trim() || undefined,
        active
      })
      setSuccess('Route updated')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update route')
    }
  }

  async function enrollNow() {
    setError('')
    setSuccess('')
    try {
      const payload = {
        routeId: selectedRouteId,
        subjectRole,
        notes: enrollmentNotes || undefined
      }
      if (subjectRole === 'Student') payload.studentId = selectedStudentId
      if (subjectRole === 'Teacher') payload.teacherUserId = selectedTeacherUserId
      await transportService.createEnrollment(payload)
      setSuccess('Enrollment saved')
      setEnrollmentNotes('')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to enroll')
    }
  }

  async function editEnrollment(row) {
    setError('')
    setSuccess('')
    const nextRouteId = window.prompt('Route ID', String(row?.route?._id || row?.route || ''))
    if (nextRouteId === null) return
    const nextStatus = window.prompt('Status (enrolled/inactive)', String(row?.status || 'enrolled'))
    if (nextStatus === null) return
    const nextNotes = window.prompt('Notes', String(row?.notes || ''))
    if (nextNotes === null) return

    try {
      await transportService.updateEnrollment(row._id, {
        routeId: String(nextRouteId).trim() || undefined,
        status: String(nextStatus).trim(),
        notes: String(nextNotes).trim() || undefined
      })
      setSuccess('Enrollment updated')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update enrollment')
    }
  }

  async function setRequestStatus(requestId, status) {
    setError('')
    setSuccess('')
    try {
      await transportService.updateRequestStatus(requestId, { status })
      setSuccess(`Request ${status}`)
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update request')
    }
  }

  async function setPaymentStatus(paymentId, status, existing) {
    setError('')
    setSuccess('')
    try {
      const payload = {
        status,
        amountDue: Number(existing?.amountDue || 0),
        amountPaid: status === 'paid' ? Number(existing?.amountDue || existing?.amountPaid || 0) : Number(existing?.amountPaid || 0),
        paidOn: status === 'paid' ? new Date().toISOString() : null
      }
      await transportService.updatePayment(paymentId, payload)
      setSuccess('Payment status updated')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update payment')
    }
  }

  async function editPayment(row) {
    setError('')
    setSuccess('')
    const amountDue = window.prompt('Amount due', String(row?.amountDue ?? 0))
    if (amountDue === null) return
    const amountPaid = window.prompt('Amount paid', String(row?.amountPaid ?? 0))
    if (amountPaid === null) return
    const status = window.prompt('Status (paid/pending/partial/overdue)', String(row?.status || 'pending'))
    if (status === null) return
    const remarks = window.prompt('Remarks', String(row?.remarks || ''))
    if (remarks === null) return
    const dueDate = window.prompt('Due date (ISO or blank)', row?.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : '')
    if (dueDate === null) return
    const paidOn = window.prompt('Paid on (ISO or blank)', row?.paidOn ? new Date(row.paidOn).toISOString().slice(0, 10) : '')
    if (paidOn === null) return

    try {
      await transportService.updatePayment(row._id, {
        amountDue: Number(amountDue),
        amountPaid: Number(amountPaid),
        status: String(status).trim(),
        remarks: String(remarks).trim() || undefined,
        dueDate: String(dueDate).trim() || null,
        paidOn: String(paidOn).trim() || null
      })
      setSuccess('Payment updated')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update payment')
    }
  }

  async function createCurrentMonthPayment(enrollmentId) {
    setError('')
    setSuccess('')
    try {
      const now = new Date()
      await transportService.createPayment({
        enrollmentId,
        periodMonth: now.getMonth() + 1,
        periodYear: now.getFullYear(),
        amountDue: selectedRouteFee,
        amountPaid: 0,
        status: 'pending'
      })
      setSuccess('Current month payment generated')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate payment')
    }
  }

  async function deleteRoute(routeId) {
    if (!canDelete) return
    if (!window.confirm('Delete this route?')) return
    setError('')
    setSuccess('')
    try {
      await transportService.deleteRoute(routeId)
      setSuccess('Route deleted')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to delete route')
    }
  }

  async function deactivateEnrollment(enrollmentId) {
    setError('')
    setSuccess('')
    try {
      await transportService.updateEnrollment(enrollmentId, { status: 'inactive' })
      setSuccess('Enrollment deactivated')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to deactivate enrollment')
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={<Button onClick={loadAll} disabled={loading}>Refresh</Button>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      {loading ? <div className="mt-6"><Skeleton className="h-40" /></div> : null}

      {canManageRoutes ? (
        <Card className="mt-6">
          <h2 className="font-medium">Route Configuration</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            <Input placeholder="Route Name" value={routeForm.name} onChange={(e) => setRouteForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Code" value={routeForm.code} onChange={(e) => setRouteForm((p) => ({ ...p, code: e.target.value }))} />
            <Input placeholder="Pickup Point" value={routeForm.pickupPoint} onChange={(e) => setRouteForm((p) => ({ ...p, pickupPoint: e.target.value }))} />
            <Input placeholder="Dropoff Point" value={routeForm.dropoffPoint} onChange={(e) => setRouteForm((p) => ({ ...p, dropoffPoint: e.target.value }))} />
            <Input type="number" placeholder="Fee" value={routeForm.fee} onChange={(e) => setRouteForm((p) => ({ ...p, fee: e.target.value }))} />
            <Input placeholder="Vehicle Number" value={routeForm.vehicleNumber} onChange={(e) => setRouteForm((p) => ({ ...p, vehicleNumber: e.target.value }))} />
            <Input placeholder="Driver Name" value={routeForm.driverName} onChange={(e) => setRouteForm((p) => ({ ...p, driverName: e.target.value }))} />
            <Input placeholder="Driver Phone" value={routeForm.driverPhone} onChange={(e) => setRouteForm((p) => ({ ...p, driverPhone: e.target.value }))} />
          </div>
          <div className="mt-3">
            <Button variant="primary" onClick={createRoute} disabled={!routeForm.name || !routeForm.pickupPoint || !routeForm.dropoffPoint}>Add Route</Button>
          </div>

          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Route</th>
                  <th className="py-2 pr-3">Pickup</th>
                  <th className="py-2 pr-3">Dropoff</th>
                  <th className="py-2 pr-3">Fee</th>
                  <th className="py-2 pr-3">Driver</th>
                  <th className="py-2 pr-3">Vehicle</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2 pr-3">{r.name} {r.code ? `(${r.code})` : ''}</td>
                    <td className="py-2 pr-3">{r.pickupPoint}</td>
                    <td className="py-2 pr-3">{r.dropoffPoint}</td>
                    <td className="py-2 pr-3">{r.fee}</td>
                    <td className="py-2 pr-3">{r.driverName || '—'}</td>
                    <td className="py-2 pr-3">{r.vehicleNumber || '—'}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => editRoute(r)}>Edit</Button>
                        {canDelete ? <Button variant="outline" size="sm" onClick={() => deleteRoute(r._id)}>Delete</Button> : <span className="text-xs text-gray-500">No delete permission</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h2 className="font-medium">Enrollment Management</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
          <Select value={subjectRole} onChange={(e) => setSubjectRole(e.target.value)}>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
          </Select>
          <Select value={selectedRouteId} onChange={(e) => setSelectedRouteId(e.target.value)}>
            <option value="">Select route</option>
            {routes.map((r) => <option key={r._id} value={r._id}>{r.name} ({r.fee})</option>)}
          </Select>
          {subjectRole === 'Student' ? (
            <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
              <option value="">Select student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.studentId} - {(s.user?.name || s.fullName || 'Student')}</option>)}
            </Select>
          ) : (
            <Select value={selectedTeacherUserId} onChange={(e) => setSelectedTeacherUserId(e.target.value)}>
              <option value="">Select teacher</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.username})</option>)}
            </Select>
          )}
          <Textarea placeholder="Notes" value={enrollmentNotes} onChange={(e) => setEnrollmentNotes(e.target.value)} textareaClassName="min-h-[42px]" />
          <Button variant="primary" onClick={enrollNow} disabled={!selectedRouteId || (subjectRole === 'Student' ? !selectedStudentId : !selectedTeacherUserId)}>Enroll</Button>
        </div>

        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-3">Person</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Updated</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((row) => (
                <tr key={row._id} className="border-t">
                  <td className="py-2 pr-3">{row?.user?.name || row?.student?.studentId || row?.teacher?.employeeId || '—'}</td>
                  <td className="py-2 pr-3">{row.subjectRole}</td>
                  <td className="py-2 pr-3">{row?.route?.name || '—'}</td>
                  <td className="py-2 pr-3">{row.status}</td>
                  <td className="py-2 pr-3">{fmtDate(row.updatedAt)}</td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => editEnrollment(row)}>Edit</Button>
                      {row.status === 'enrolled' ? <Button size="sm" variant="outline" onClick={() => deactivateEnrollment(row._id)}>Deactivate</Button> : <span className="text-xs text-gray-500">Inactive</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Enrollment Requests</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-3">Requester</th>
                <th className="py-2 pr-3">For</th>
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((row) => (
                <tr key={row._id} className="border-t">
                  <td className="py-2 pr-3">{row?.requester?.name || '—'}</td>
                  <td className="py-2 pr-3">{row?.forUser?.name || '—'} ({row.subjectRole})</td>
                  <td className="py-2 pr-3">{row?.route?.name || '—'}</td>
                  <td className="py-2 pr-3"><span className={`text-xs px-2 py-1 border rounded ${requestBadge(row.status)}`}>{row.status}</span></td>
                  <td className="py-2 pr-3">{fmtDate(row.createdAt)}</td>
                  <td className="py-2 pr-3">
                    {row.status === 'pending' ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setRequestStatus(row._id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="outline" onClick={() => setRequestStatus(row._id, 'rejected')}>Reject</Button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">Reviewed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {canManagePayments ? (
        <Card className="mt-6">
          <h2 className="font-medium">Payment Status</h2>
          <div className="mt-3 overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Route</th>
                  <th className="py-2 pr-3">Period</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Paid</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((row) => (
                  <tr key={row._id} className="border-t">
                    <td className="py-2 pr-3">{row?.user?.name || '—'}</td>
                    <td className="py-2 pr-3">{row.subjectRole}</td>
                    <td className="py-2 pr-3">{row?.route?.name || '—'}</td>
                    <td className="py-2 pr-3">{row.periodMonth}/{row.periodYear}</td>
                    <td className="py-2 pr-3">{row.amountDue}</td>
                    <td className="py-2 pr-3">{row.amountPaid}</td>
                    <td className="py-2 pr-3"><span className={`text-xs px-2 py-1 border rounded ${paymentBadge(row.status)}`}>{row.status}</span></td>
                    <td className="py-2 pr-3">
                        <div className="flex gap-1 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => editPayment(row)}>Edit</Button>
                          <Button size="sm" variant="outline" onClick={() => setPaymentStatus(row._id, 'paid', row)}>Paid</Button>
                          <Button size="sm" variant="outline" onClick={() => setPaymentStatus(row._id, 'pending', row)}>Pending</Button>
                        </div>
                    </td>
                  </tr>
                ))}
                {enrollments.filter((e) => e.status === 'enrolled').slice(0, 10).map((row) => (
                  <tr key={`${row._id}-gen`} className="border-t bg-gray-50">
                    <td className="py-2 pr-3">{row?.user?.name || '—'}</td>
                    <td className="py-2 pr-3">{row.subjectRole}</td>
                    <td className="py-2 pr-3">{row?.route?.name || '—'}</td>
                    <td className="py-2 pr-3">Current</td>
                    <td className="py-2 pr-3">{row?.route?.fee || 0}</td>
                    <td className="py-2 pr-3">—</td>
                    <td className="py-2 pr-3">not generated</td>
                    <td className="py-2 pr-3"><Button size="sm" variant="outline" onClick={() => createCurrentMonthPayment(row._id)}>Generate</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {canManageReports ? (
        <Card className="mt-6">
          <h2 className="font-medium">Reports and Export</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            <div className="border rounded p-3">
              <div className="text-gray-500">Total Records</div>
              <div className="text-xl font-semibold">{summary?.totals?.records ?? 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">Amount Due</div>
              <div className="text-xl font-semibold">{summary?.totals?.amountDue ?? 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">Amount Paid</div>
              <div className="text-xl font-semibold">{summary?.totals?.amountPaid ?? 0}</div>
            </div>
            <div className="border rounded p-3">
              <div className="text-gray-500">Defaulters</div>
              <div className="text-xl font-semibold">{defaulters.length}</div>
            </div>
          </div>

          <div className="mt-4 text-sm">
            <a className="text-blue-600 underline" href={transportService.exportPaymentsCsvUrl()} target="_blank" rel="noreferrer">Export Payments CSV</a>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">Route-wise Enrollment Count</h3>
              <div className="mt-2 space-y-1 text-sm">
                {routeCounts.map((r) => (
                  <div key={String(r.routeId)} className="flex justify-between border-b pb-1">
                    <span>{r.routeName || 'Unknown Route'}</span>
                    <span>{r.totalEnrolled} (S:{r.students}, T:{r.teachers})</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium">Monthly Revenue Trend</h3>
              <div className="mt-2 space-y-1 text-sm">
                {revenueTrend.map((row) => (
                  <div key={`${row.year}-${row.month}`} className="flex justify-between border-b pb-1">
                    <span>{row.month}/{row.year}</span>
                    <span>Paid {row.paidTotal} / Due {row.dueTotal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
