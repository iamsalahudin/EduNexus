'use client'

import { useEffect, useMemo, useState } from 'react'
import transportService from '@/services/transportService'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'

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

export default function TransportParentWorkspace() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [children, setChildren] = useState([])
  const [routes, setRoutes] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [payments, setPayments] = useState([])
  const [requests, setRequests] = useState([])

  const [studentId, setStudentId] = useState('')
  const [routeId, setRouteId] = useState('')
  const [reason, setReason] = useState('')

  const selectedChild = useMemo(() => children.find((c) => String(c._id) === String(studentId)) || null, [children, studentId])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [childrenRes, routesRes, enrollRes, paymentsRes, requestsRes] = await Promise.all([
        transportService.listParentChildren(),
        transportService.listRoutes({ active: true, limit: 200 }),
        transportService.listEnrollments({ limit: 100 }),
        transportService.listPayments({ limit: 100 }),
        transportService.listRequests({ limit: 100 })
      ])

      const childrenList = Array.isArray(childrenRes?.children) ? childrenRes.children : []
      setChildren(childrenList)
      setRoutes(Array.isArray(routesRes?.routes) ? routesRes.routes : [])
      setEnrollments(Array.isArray(enrollRes?.enrollments) ? enrollRes.enrollments : [])
      setPayments(Array.isArray(paymentsRes?.payments) ? paymentsRes.payments : [])
      setRequests(Array.isArray(requestsRes?.requests) ? requestsRes.requests : [])

      if (!studentId && childrenList.length) {
        setStudentId(String(childrenList[0]._id))
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load parent transport data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const childEnrollment = useMemo(() => {
    if (!selectedChild) return null
    return enrollments.find((row) => String(row?.student?._id || row?.student) === String(selectedChild._id) && row.status === 'enrolled') || null
  }, [enrollments, selectedChild])

  const childPayments = useMemo(() => {
    if (!selectedChild) return []
    return payments.filter((row) => String(row?.student?._id || row?.student) === String(selectedChild._id))
  }, [payments, selectedChild])

  const childRequests = useMemo(() => {
    if (!selectedChild) return []
    return requests.filter((row) => String(row?.student?._id || row?.student) === String(selectedChild._id))
  }, [requests, selectedChild])

  async function submitChildRequest() {
    setError('')
    setSuccess('')
    try {
      await transportService.createRequest({ routeId, studentId, reason: reason || undefined })
      setSuccess('Request submitted for child')
      setReason('')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to submit request')
    }
  }

  async function cancelRequest(requestId) {
    setError('')
    setSuccess('')
    try {
      await transportService.updateRequestStatus(requestId, { status: 'cancelled' })
      setSuccess('Request cancelled')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to cancel request')
    }
  }

  return (
    <div>
      <PageHeader title="Transport" subtitle="Check available routes and each child transport details/payment history." actions={<Button onClick={loadAll} disabled={loading}>Refresh</Button>} />
      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      {loading ? <div className="mt-6"><Skeleton className="h-40" /></div> : null}

      <Card className="mt-6">
        <h2 className="font-medium">Child</h2>
        <div className="mt-3">
          <Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
            <option value="">Select child</option>
            {children.map((c) => <option key={c._id} value={c._id}>{c.studentId} - {c.name} ({c.class}-{c.section})</option>)}
          </Select>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Available Routes</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Pickup</th>
                <th className="py-2 pr-3">Dropoff</th>
                <th className="py-2 pr-3">Fee</th>
                <th className="py-2 pr-3">Driver</th>
                <th className="py-2 pr-3">Vehicle</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Child Transport Details</h2>
        {!selectedChild ? (
          <div className="mt-3 text-sm text-gray-600">Select a child to view details.</div>
        ) : !childEnrollment ? (
          <div className="mt-3 text-sm text-gray-600">Child is not enrolled. You can submit a route-specific request below.</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Route:</span> {childEnrollment?.route?.name || '—'}</div>
            <div><span className="text-gray-500">Pickup:</span> {childEnrollment?.route?.pickupPoint || '—'}</div>
            <div><span className="text-gray-500">Dropoff:</span> {childEnrollment?.route?.dropoffPoint || '—'}</div>
            <div><span className="text-gray-500">Fee:</span> {childEnrollment?.route?.fee || 0}</div>
            <div><span className="text-gray-500">Driver:</span> {childEnrollment?.route?.driverName || '—'}</div>
            <div><span className="text-gray-500">Vehicle:</span> {childEnrollment?.route?.vehicleNumber || '—'}</div>
          </div>
        )}
      </Card>

      {!childEnrollment && selectedChild ? (
        <Card className="mt-6">
          <h2 className="font-medium">Request Enrollment For Child</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
            <Select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              <option value="">Select route</option>
              {routes.map((r) => <option key={r._id} value={r._id}>{r.name} ({r.fee})</option>)}
            </Select>
            <Input className="md:col-span-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional)" />
          </div>
          <div className="mt-3">
            <Button variant="primary" onClick={submitChildRequest} disabled={!routeId || !studentId}>Submit Request</Button>
          </div>
        </Card>
      ) : null}

      <Card className="mt-6">
        <h2 className="font-medium">Child Payment History</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-3">Period</th>
                <th className="py-2 pr-3">Due</th>
                <th className="py-2 pr-3">Paid</th>
                <th className="py-2 pr-3">Due Date</th>
                <th className="py-2 pr-3">Paid On</th>
                <th className="py-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {childPayments.map((row) => (
                <tr key={row._id} className="border-t">
                  <td className="py-2 pr-3">{row.periodMonth}/{row.periodYear}</td>
                  <td className="py-2 pr-3">{row.amountDue}</td>
                  <td className="py-2 pr-3">{row.amountPaid}</td>
                  <td className="py-2 pr-3">{fmtDate(row.dueDate)}</td>
                  <td className="py-2 pr-3">{fmtDate(row.paidOn)}</td>
                  <td className="py-2 pr-3"><span className={`text-xs px-2 py-1 border rounded ${paymentBadge(row.status)}`}>{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="font-medium">Child Requests</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-3">Route</th>
                <th className="py-2 pr-3">Reason</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {childRequests.map((row) => (
                <tr key={row._id} className="border-t">
                  <td className="py-2 pr-3">{row?.route?.name || '—'}</td>
                  <td className="py-2 pr-3">{row.reason || '—'}</td>
                  <td className="py-2 pr-3"><span className={`text-xs px-2 py-1 border rounded ${requestBadge(row.status)}`}>{row.status}</span></td>
                  <td className="py-2 pr-3">{fmtDate(row.createdAt)}</td>
                  <td className="py-2 pr-3">{row.status === 'pending' ? <Button size="sm" variant="outline" onClick={() => cancelRequest(row._id)}>Cancel</Button> : <span className="text-xs text-gray-500">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
