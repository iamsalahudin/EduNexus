'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from '@/components/ui'
import studentsService from '@/services/studentsService'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

function statusChip(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'alumni') return 'bg-amber-100 text-amber-800 border border-amber-200'
  return 'bg-emerald-100 text-emerald-800 border border-emerald-200'
}

function activeChip(active) {
  return active ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
}

export default function StudentProfilePage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeletePopup, setShowDeletePopup] = useState(false)
  const [row, setRow] = useState(null)
  const [parentProfiles, setParentProfiles] = useState([])
  const [transport, setTransport] = useState(null)
  const [certificates, setCertificates] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [studentRes, certRes] = await Promise.all([
          studentsService.getStudentById(id),
          studentsService.listStudentCertificates(id, { limit: 10 }),
        ])

        setRow(studentRes?.student || null)
        setParentProfiles(Array.isArray(studentRes?.parentProfiles) ? studentRes.parentProfiles : [])
        setTransport(studentRes?.transport || null)
        setCertificates(Array.isArray(certRes?.certificates) ? certRes.certificates : [])
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load student profile')
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  const parents = useMemo(() => {
    if (!row) return []
    if (parentProfiles.length > 0) return parentProfiles

    const fallback = Array.isArray(row.parents) ? row.parents : []
    return fallback.map((parent) => ({
      _id: parent?._id,
      name: parent?.name,
      email: parent?.email,
      phone: parent?.phone,
      relation: parent?.relation,
    }))
  }, [parentProfiles, row])

  async function handleDeleteStudent() {
    setDeleting(true)
    setError('')
    try {
      await studentsService.deleteStudent(id)
      router.push('/principal/students')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete student')
      setDeleting(false)
      setShowDeletePopup(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Profile"
        subtitle="View enrollment, account, parent, and certificate records."
        right={(
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/principal/students" variant="secondary">Back</ButtonLink>
            <ButtonLink href={`/principal/students/edit/${id}`} variant="primary">Edit</ButtonLink>
            <ButtonLink href={`/principal/students/transfer-certificate?studentId=${id}`} variant="outline">Issue TC</ButtonLink>
            <ButtonLink href={`/principal/students/school-leaving-certificate?studentId=${id}`} variant="outline">Issue SLC</ButtonLink>
            <Button type="button" variant="danger" onClick={() => setShowDeletePopup(true)} disabled={loading || deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {loading ? (
        <Skeleton className="h-48" />
      ) : !row ? (
        <EmptyState title="Student not found" />
      ) : (
        <>
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="font-medium text-lg">Core Record</h2>
                <p className="text-sm text-gray-600 mt-1">Primary details and account state.</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 text-xs rounded capitalize ${statusChip(row?.status)}`}>{row?.status || 'incampus'}</span>
                <span className={`px-2 py-1 text-xs rounded ${activeChip(row?.user?.active !== false)}`}>
                  {row?.user?.active !== false ? 'User Active' : 'User Inactive'}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Student Name:</span> {row?.user?.name || '-'}</div>
              <div><span className="text-gray-500">Username:</span> {row?.user?.username || '-'}</div>
              <div><span className="text-gray-500">Email:</span> {row?.user?.email || '-'}</div>

              <div><span className="text-gray-500">Student ID:</span> {row?.studentId || '-'}</div>
              <div><span className="text-gray-500">Registration #:</span> {row?.registrationNumber || '-'}</div>
              <div><span className="text-gray-500">Roll #:</span> {row?.rollNumber || '-'}</div>

              <div><span className="text-gray-500">Class:</span> {row?.class || '-'}</div>
              <div><span className="text-gray-500">Section:</span> {row?.section || '-'}</div>
              <div><span className="text-gray-500">Contact:</span> {row?.contact || '-'}</div>

              <div><span className="text-gray-500">Date of Birth:</span> {formatDate(row?.dob)}</div>
              <div><span className="text-gray-500">Enroll Date:</span> {formatDate(row?.enrollDate)}</div>
              <div><span className="text-gray-500">Gender:</span> {row?.gender || '-'}</div>

              <div><span className="text-gray-500">Blood Group:</span> {row?.bloodGroup || '-'}</div>
              <div><span className="text-gray-500">Transport Flag:</span> {row?.availTransport ? 'Yes' : 'No'}</div>
              <div><span className="text-gray-500">Balance:</span> {row?.balance ?? 0}</div>

              <div className="md:col-span-3"><span className="text-gray-500">Address:</span> {row?.address || '-'}</div>
              <div className="md:col-span-3"><span className="text-gray-500">Health Conditions:</span> {row?.healthConditions || '-'}</div>
              <div className="md:col-span-3"><span className="text-gray-500">Notes:</span> {row?.notes || '-'}</div>
            </div>
          </Card>

          <Card>
            <h2 className="font-medium">Parent Profiles</h2>
            <p className="text-sm text-gray-600 mt-1">Linked guardians and contact details.</p>

            <div className="mt-3">
              {parents.length === 0 ? (
                <EmptyState title="No linked parent profile" />
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableRoot>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Name</TableHeader>
                          <TableHeader>Email</TableHeader>
                          <TableHeader>Phone</TableHeader>
                          <TableHeader>Relation</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {parents.map((parent) => (
                          <TableRow key={parent._id || `${parent.name}-${parent.email}`}>
                            <TableCell>{parent?.name || '-'}</TableCell>
                            <TableCell>{parent?.email || '-'}</TableCell>
                            <TableCell>{parent?.phone || '-'}</TableCell>
                            <TableCell>{parent?.relation || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </TableRoot>
                  </Table>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-medium">Transport</h2>
            {!transport ? (
              <div className="text-sm text-gray-600 mt-2">No transport record configured for this student.</div>
            ) : (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">Route:</span> {transport?.route || '-'}</div>
                <div><span className="text-gray-500">Fee:</span> {transport?.transportFee ?? '-'}</div>
                <div><span className="text-gray-500">Pickup:</span> {transport?.pickupPoint || '-'}</div>
                <div><span className="text-gray-500">Dropoff:</span> {transport?.dropoffPoint || '-'}</div>
                <div><span className="text-gray-500">Active:</span> {transport?.active ? 'Yes' : 'No'}</div>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-medium">Certificate History</h2>
            <p className="text-sm text-gray-600 mt-1">Most recent transfer and school leaving certificates.</p>

            <div className="mt-3">
              {certificates.length === 0 ? (
                <EmptyState title="No certificates issued yet" />
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableRoot>
                      <TableHead>
                        <TableRow>
                          <TableHeader>Certificate #</TableHeader>
                          <TableHeader>Type</TableHeader>
                          <TableHeader>Issue Date</TableHeader>
                          <TableHeader>Issued By</TableHeader>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {certificates.map((cert) => (
                          <TableRow key={cert._id}>
                            <TableCell>{cert?.certificateNumber || '-'}</TableCell>
                            <TableCell className="uppercase">{cert?.type || '-'}</TableCell>
                            <TableCell>{formatDate(cert?.issueDate)}</TableCell>
                            <TableCell>{cert?.issuedBy?.name || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </TableRoot>
                  </Table>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {showDeletePopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md">
            <h2 className="font-semibold text-lg">Delete Student</h2>
            <p className="text-sm text-gray-600 mt-2">
              This will permanently remove the student profile, account access, and linked records.
            </p>
            <p className="text-sm text-gray-700 mt-3">
              Student: <span className="font-medium">{row?.user?.name || '-'}</span>
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeletePopup(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleDeleteStudent} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
