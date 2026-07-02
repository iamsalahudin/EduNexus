'use client'

import { useEffect, useState } from 'react'
import teacherService from '@/services/teacher.service'
import { Card, EmptyState, PageHeader, Skeleton } from '@/components/ui'

export default function ClassSubjectsPage() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [error, setError] = useState('')

  async function loadClassSubjects() {
    setLoading(true)
    setError('')
    try {
      const res = await teacherService.getMySubjects()
      setClasses(Array.isArray(res?.subjectsByClass) ? res.subjectsByClass : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Class subjects are not available yet')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassSubjects()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subject per Class"
        subtitle="Subjects offered in each of your assigned classes. Subjects you teach are highlighted."
      />

      {error ? <div className="text-sm text-amber-700">{error}</div> : null}

      {loading ? (
        <Skeleton className="h-40" />
      ) : classes.length === 0 ? (
        <Card>
          <EmptyState
            title="No classes assigned"
            description="When class assignments are added, their subjects will show up here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => (
            <Card key={cls.className}>
              <h3 className="font-semibold text-gray-900">{cls.className}</h3>
              {Array.isArray(cls.subjects) && cls.subjects.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {cls.subjects.map((subject) => (
                    <span
                      key={`${cls.className}-${subject.name}`}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        subject.teaching
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {subject.name}
                      {subject.teaching ? ' • You' : ''}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-500">No subjects defined for this class yet.</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
