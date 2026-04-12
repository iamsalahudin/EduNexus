'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageHeader, Card, Skeleton } from '@/components/ui'
import teacherService from '@/services/teacher.service'

export default function Page() {
  const params = useParams()
  const teacherId = params.teacherId
  const [teacher, setTeacher] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadTeacher() {
    setLoading(true)
    setError('')
    try {
      const res = await teacherService.getTeacher(teacherId)
      setTeacher(res?.teacher || null)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load teacher details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (teacherId) {
      loadTeacher()
    }
  }, [teacherId])

  if (loading) return <Skeleton className="h-96" />
  if (!teacher) return <div className="text-center text-red-600">Teacher not found</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title={teacher?.user?.name || 'Teacher Profile'}
        subtitle="View teacher information and details."
      />

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {teacher?.user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <h2 className="font-medium mt-4 text-lg">{teacher?.user?.name}</h2>
            <p className="text-sm text-gray-600 mt-1">{teacher?.designation}</p>
            <p className="text-sm text-gray-600">{teacher?.department}</p>
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${teacher?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {teacher?.status || 'Active'}
              </span>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <h2 className="font-medium mb-4">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-600 font-medium">Full Name</label>
                <p className="text-sm mt-1">{teacher?.user?.name || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Email</label>
                <p className="text-sm mt-1">{teacher?.user?.email || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Username</label>
                <p className="text-sm mt-1">{teacher?.user?.username || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Phone</label>
                <p className="text-sm mt-1">{teacher?.user?.phone || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Gender</label>
                <p className="text-sm mt-1 capitalize">{teacher?.gender || '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">Date of Birth</label>
                <p className="text-sm mt-1">{teacher?.dob ? new Date(teacher.dob).toLocaleDateString() : '-'}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 font-medium">CNIC/ID</label>
                <p className="text-sm mt-1">{teacher?.cnic || '-'}</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-medium">Address</label>
              <p className="text-sm mt-1">{teacher?.address || '-'}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Professional Information */}
      <Card>
        <h2 className="font-medium mb-4">Professional Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-gray-600 font-medium">Employee ID</label>
            <p className="text-sm mt-2">{teacher?.employeeId || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Designation</label>
            <p className="text-sm mt-2">{teacher?.designation || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Department</label>
            <p className="text-sm mt-2">{teacher?.department || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Qualification</label>
            <p className="text-sm mt-2">{teacher?.qualification || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Experience (Years)</label>
            <p className="text-sm mt-2">{teacher?.experience || '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Status</label>
            <p className="text-sm mt-2 capitalize">{teacher?.status || 'Active'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Joining Date</label>
            <p className="text-sm mt-2">{teacher?.joiningDate ? new Date(teacher.joiningDate).toLocaleDateString() : '-'}</p>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium">Last Updated</label>
            <p className="text-sm mt-2">{teacher?.updatedAt ? new Date(teacher.updatedAt).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      </Card>

      {/* Subjects Taught */}
      {teacher?.subjects && teacher.subjects.length > 0 && (
        <Card>
          <h2 className="font-medium mb-4">Subjects Taught</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {teacher.subjects.map((subject, idx) => (
              <div key={idx} className="p-2 bg-blue-50 rounded text-sm">
                {subject?.name || subject}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Classes Assigned */}
      {teacher?.classes && teacher.classes.length > 0 && (
        <Card>
          <h2 className="font-medium mb-4">Classes Assigned</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {teacher.classes.map((cls, idx) => (
              <div key={idx} className="p-2 bg-green-50 rounded text-sm">
                {cls?.name || cls}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Bank Details */}
      {teacher?.bankAccountNumber && (
        <Card>
          <h2 className="font-medium mb-4">Bank Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 font-medium">Account Number</label>
              <p className="text-sm mt-2">{teacher?.bankAccountNumber || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium">Bank Name</label>
              <p className="text-sm mt-2">{teacher?.bankName || '-'}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
