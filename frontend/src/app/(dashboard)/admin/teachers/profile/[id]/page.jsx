'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import teacherService from '@/services/teacher.service'
import { Button, ButtonLink, Card, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export default function TeacherProfilePage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [removingDoc, setRemovingDoc] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [teacher, setTeacher] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { teacher: row } = await teacherService.getTeacher(id)
        setTeacher(row || null)
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load teacher profile')
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  const docs = Array.isArray(teacher?.documents) ? teacher.documents : []
  const classesAssigned = Array.isArray(teacher?.classesAssigned) ? teacher.classesAssigned : []
  const subjects = Array.isArray(teacher?.subjects) ? teacher.subjects : []
  const assignmentRows = classesAssigned.map((className, idx) => ({
    className,
    subjectName: subjects[idx] || ''
  }))

  async function removeDocument(url) {
    if (!id || !url) return
    setError('')
    setRemovingDoc(url)

    try {
      const { teacher: updated } = await teacherService.updateTeacher(id, {
        removeDocuments: [url]
      })
      setTeacher(updated || null)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to remove document')
    } finally {
      setRemovingDoc('')
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) {
      return
    }

    setError('')
    setDeleting(true)

    try {
      await teacherService.deleteTeacher(id)
      router.push('/admin/teachers')
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete teacher')
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Profile"
        subtitle="View complete teacher account and employment details."
        right={<div className="flex gap-2"><ButtonLink href="/admin/teachers" variant="secondary">Back</ButtonLink><ButtonLink href={`/admin/teachers/edit/${id}`} variant="primary">Edit</ButtonLink><Button type="button" variant="danger" onClick={handleDelete} disabled={deleting || loading}>{deleting ? 'Deleting...' : 'Delete'}</Button></div>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {loading ? (
        <Skeleton className="h-48" />
      ) : !teacher ? (
        <EmptyState title="Teacher not found" />
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-500">Name:</span> {teacher?.user?.name || '-'}</div>
              <div><span className="text-gray-500">Username:</span> {teacher?.user?.username || '-'}</div>
              <div><span className="text-gray-500">Email:</span> {teacher?.user?.email || '-'}</div>
              <div><span className="text-gray-500">Employee ID:</span> {teacher?.employeeId || '-'}</div>

              <div><span className="text-gray-500">Designation:</span> {teacher?.designation || '-'}</div>
              <div><span className="text-gray-500">Department:</span> {teacher?.department || '-'}</div>
              <div><span className="text-gray-500">Status:</span> {teacher?.status || '-'}</div>

              <div><span className="text-gray-500">Joining Date:</span> {teacher?.joiningDate ? String(teacher.joiningDate).slice(0, 10) : '-'}</div>
              <div><span className="text-gray-500">Experience (years):</span> {teacher?.experienceYears ?? 0}</div>
              <div><span className="text-gray-500">Salary:</span> {teacher?.salary ?? '-'}</div>

              <div><span className="text-gray-500">Contact Number:</span> {teacher?.contactNumber || '-'}</div>
              <div><span className="text-gray-500">Emergency Name:</span> {teacher?.emergencyContact?.name || '-'}</div>
              <div><span className="text-gray-500">Emergency Phone:</span> {teacher?.emergencyContact?.phone || '-'}</div>

              <div className="md:col-span-3"><span className="text-gray-500">Address:</span> {teacher?.address || '-'}</div>
              <div className="md:col-span-3"><span className="text-gray-500">Qualification:</span> {teacher?.qualification || '-'}</div>
              <div className="md:col-span-3"><span className="text-gray-500">Certifications:</span> {(teacher?.certifications || []).join(', ') || '-'}</div>
              <div className="md:col-span-3"><span className="text-gray-500">Notes:</span> {teacher?.notes || '-'}</div>
            </div>
          </Card>

          <Card>
            <h2 className="font-medium">Class and Subject Assignment</h2>
            <p className="text-xs text-gray-600 mt-1">This will be updated from timetable configuration. Until then, it may remain empty.</p>

            {assignmentRows.length === 0 ? (
              <div className="text-sm text-gray-600 mt-3">No class-subject assignments available yet.</div>
            ) : (
              <div className="mt-3 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left border-b bg-gray-50">
                      <th className="py-2 px-3 font-semibold">Class Assigned</th>
                      <th className="py-2 px-3 font-semibold">Subject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentRows.map((row, idx) => (
                      <tr key={`${row.className}-${idx}`} className="border-b last:border-b-0">
                        <td className="py-2 px-3">{row.className || '-'}</td>
                        <td className="py-2 px-3">{row.subjectName || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-medium">Uploaded Documents</h2>
            {docs.length === 0 ? (
              <div className="text-sm text-gray-600 mt-2">No documents uploaded.</div>
            ) : (
              <div className="mt-2 space-y-2">
                {docs.map((url) => (
                  <div key={url} className="flex items-center justify-between gap-3 rounded border px-3 py-2">
                    <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline truncate">
                      {url}
                    </a>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => removeDocument(url)}
                      disabled={Boolean(removingDoc)}
                    >
                      {removingDoc === url ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
