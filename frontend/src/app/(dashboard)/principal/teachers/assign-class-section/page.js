'use client'

import { useEffect, useState } from 'react'
import { Input, PageHeader, Card, Skeleton, EmptyState } from '@/components/ui'
import classService from '@/services/class.service'
import teacherService from '@/services/teacher.service'

export default function Page() {
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [classTeachers, setClassTeachers] = useState([])
  const [q, setQ] = useState('')
  const [error, setError] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [classesRes, teachersRes] = await Promise.all([
        classService.listClasses({ limit: 100 }),
        teacherService.listTeachers({ limit: 100 }),
      ])
      setClasses(Array.isArray(classesRes?.classes) ? classesRes.classes : [])
      setTeachers(Array.isArray(teachersRes?.teachers) ? teachersRes.teachers : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function loadClassTeachers(classId) {
    try {
      const res = await classService.getClassTeachers(classId)
      setClassTeachers(Array.isArray(res?.teachers) ? res.teachers : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load class teachers')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSelectClass(classId) {
    setSelectedClass(classId)
    await loadClassTeachers(classId)
  }

  async function assignTeacher(teacherId) {
    setSaving(true)
    try {
      await classService.assignTeacher(selectedClass, { teacherId })
      await loadClassTeachers(selectedClass)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to assign teacher')
    } finally {
      setSaving(false)
    }
  }

  async function unassignTeacher(teacherId) {
    setSaving(true)
    try {
      await classService.unassignTeacher(selectedClass, { teacherId })
      await loadClassTeachers(selectedClass)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to unassign teacher')
    } finally {
      setSaving(false)
    }
  }

  const availableTeachers = teachers.filter((t) => !classTeachers.some((ct) => ct._id === t._id))
  const filteredClasses = q ? classes.filter((c) => c.name?.toLowerCase().includes(q.toLowerCase())) : classes
  const filteredAvailable = availableTeachers.filter((t) => t.user?.name?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Class Sections"
        subtitle="Assign teachers to class sections and manage faculty assignments."
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classes List */}
        <Card>
          <h2 className="font-medium">Classes</h2>
          <div className="mt-3 mb-3">
            <Input placeholder="Search classes..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full" />
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <Skeleton className="h-40" />
            ) : filteredClasses.length === 0 ? (
              <EmptyState title="No classes found" />
            ) : (
              filteredClasses.map((c) => (
                <button key={c._id} onClick={() => handleSelectClass(c._id)} className={`w-full p-2 text-left rounded border ${selectedClass === c._id ? 'bg-primary text-white border-primary' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs opacity-75">{c.section || 'No section'}</div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Current Teachers */}
        <Card>
          <h2 className="font-medium">Assigned Teachers</h2>
          <p className="text-sm text-gray-600 mt-1">{selectedClass ? 'Teachers for this class:' : 'Select a class'}</p>
          <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
            {selectedClass ? classTeachers.length === 0 ? (
              <EmptyState title="No teachers assigned" />
            ) : (
              classTeachers.map((t) => (
                <div key={t._id} className="p-2 rounded bg-gray-50 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-sm">{t.user?.name}</div>
                    <div className="text-xs text-gray-600">{t.designation}</div>
                  </div>
                  <button onClick={() => unassignTeacher(t._id)} disabled={saving} className="text-xs text-red-600 hover:text-red-800">
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <EmptyState title="Select a class" />
            )}
          </div>
        </Card>

        {/* Available Teachers */}
        <Card>
          <h2 className="font-medium">Available Teachers</h2>
          <p className="text-sm text-gray-600 mt-1">{selectedClass ? 'Not assigned to this class:' : 'Select a class'}</p>
          <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
            {selectedClass ? filteredAvailable.length === 0 ? (
              <EmptyState title="All teachers assigned" />
            ) : (
              filteredAvailable.map((t) => (
                <div key={t._id} className="p-2 rounded bg-blue-50 flex justify-between items-center border border-blue-200">
                  <div>
                    <div className="font-medium text-sm">{t.user?.name}</div>
                    <div className="text-xs text-gray-600">{t.designation}</div>
                  </div>
                  <button onClick={() => assignTeacher(t._id)} disabled={saving} className="text-xs text-green-600 hover:text-green-800">
                    Add
                  </button>
                </div>
              ))
            ) : (
              <EmptyState title="Select a class" />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
