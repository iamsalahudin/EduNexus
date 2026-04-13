'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import classesService from '@/services/classesService'
import studentsService from '@/services/studentsService'
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

const STATUS_OPTIONS = ['incampus', 'alumni']
const GENDER_OPTIONS = ['', 'Male', 'Female']

function toDateInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function normalizeSections(rawSections) {
  if (!Array.isArray(rawSections)) return []
  return rawSections
    .map((section) => String(section || '').trim())
    .filter(Boolean)
}

function validateForm(form) {
  const errors = {}
  if (!String(form.userName || '').trim()) errors.userName = 'Student name is required.'

  const email = String(form.userEmail || '').trim()
  if (!email) {
    errors.userEmail = 'Student email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.userEmail = 'Enter a valid email address.'
  }

  if (!String(form.registrationNumber || '').trim()) errors.registrationNumber = 'Registration number is required.'
  if (!String(form.class || '').trim()) errors.class = 'Class is required.'
  if (!String(form.contact || '').trim()) errors.contact = 'Contact number is required.'
  if (!String(form.status || '').trim()) errors.status = 'Status is required.'

  return errors
}

export default function StudentEditPage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [availableClasses, setAvailableClasses] = useState([])

  const [form, setForm] = useState({
    userName: '',
    userEmail: '',
    userActive: true,
    registrationNumber: '',
    rollNumber: '',
    class: '',
    section: '',
    contact: '',
    status: 'incampus',
    dob: '',
    enrollDate: '',
    gender: '',
    bloodGroup: '',
    address: '',
    healthConditions: '',
    notes: '',
  })

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const selectedClass = useMemo(
    () => availableClasses.find((item) => String(item?.name || '') === String(form.class || '')),
    [availableClasses, form.class]
  )

  const sectionOptions = useMemo(() => normalizeSections(selectedClass?.sections), [selectedClass])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')

      try {
        const [studentRes, classesRes] = await Promise.all([
          studentsService.getStudentById(id),
          classesService.listClasses({ active: true }),
        ])

        const student = studentRes?.student || {}
        const classes = Array.isArray(classesRes?.classes) ? classesRes.classes : []
        setAvailableClasses(classes)

        setForm({
          userName: student?.user?.name || '',
          userEmail: student?.user?.email || '',
          userActive: student?.user?.active !== false,
          registrationNumber: student?.registrationNumber || '',
          rollNumber: student?.rollNumber || '',
          class: student?.class || '',
          section: student?.section || '',
          contact: student?.contact || '',
          status: student?.status || 'incampus',
          dob: toDateInput(student?.dob),
          enrollDate: toDateInput(student?.enrollDate),
          gender: student?.gender || '',
          bloodGroup: student?.bloodGroup || '',
          address: student?.address || '',
          healthConditions: student?.healthConditions || '',
          notes: student?.notes || '',
        })
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load student for editing')
      } finally {
        setLoading(false)
      }
    }

    if (id) load()
  }, [id])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const nextErrors = validateForm(form)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)

    try {
      await studentsService.updateStudent(id, {
        userName: form.userName.trim(),
        userEmail: form.userEmail.trim().toLowerCase(),
        userActive: Boolean(form.userActive),
        registrationNumber: form.registrationNumber.trim(),
        rollNumber: form.rollNumber.trim(),
        class: form.class.trim(),
        section: form.section.trim(),
        contact: form.contact.trim(),
        status: form.status,
        dob: form.dob || null,
        enrollDate: form.enrollDate || null,
        gender: form.gender || null,
        bloodGroup: form.bloodGroup.trim() || null,
        address: form.address.trim() || null,
        healthConditions: form.healthConditions.trim() || null,
        notes: form.notes.trim() || null,
      })
      router.push(`/receptionist/students/profile/${id}`)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update student')
    } finally {
      setSaving(false)
    }
  }

  function reviveStudent() {
    setField('status', 'incampus')
    setField('userActive', true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Student"
        subtitle="Update student profile, enrollment status, and account activation."
        right={<ButtonLink href="/receptionist/admissions" variant="secondary">Back</ButtonLink>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      {loading ? (
        <Skeleton className="h-52" />
      ) : (
        <Card>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
            <div>
              <Input label="Student Name" value={form.userName} onChange={(e) => setField('userName', e.target.value)} required />
              {fieldErrors.userName ? <p className="text-xs text-red-600 mt-1">{fieldErrors.userName}</p> : null}
            </div>

            <div>
              <Input label="Student Email" type="email" value={form.userEmail} onChange={(e) => setField('userEmail', e.target.value)} required />
              {fieldErrors.userEmail ? <p className="text-xs text-red-600 mt-1">{fieldErrors.userEmail}</p> : null}
            </div>

            <div>
              <Input label="Registration Number" value={form.registrationNumber} onChange={(e) => setField('registrationNumber', e.target.value)} required />
              {fieldErrors.registrationNumber ? <p className="text-xs text-red-600 mt-1">{fieldErrors.registrationNumber}</p> : null}
            </div>

            <Input label="Roll Number" value={form.rollNumber} onChange={(e) => setField('rollNumber', e.target.value)} />

            <div>
              <Select label="Class" value={form.class} onChange={(e) => {
                setField('class', e.target.value)
                setField('section', '')
              }}>
                <option value="">Select class</option>
                {availableClasses.map((row) => (
                  <option key={row._id || row.name} value={row.name}>{row.name}</option>
                ))}
              </Select>
              {fieldErrors.class ? <p className="text-xs text-red-600 mt-1">{fieldErrors.class}</p> : null}
            </div>

            <div>
              <Select
                label="Section"
                value={form.section}
                onChange={(e) => setField('section', e.target.value)}
                disabled={sectionOptions.length === 0}
              >
                <option value="">{sectionOptions.length === 0 ? 'No sections configured' : 'Select section'}</option>
                {sectionOptions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
            </div>

            <div>
              <Input label="Contact Number" value={form.contact} onChange={(e) => setField('contact', e.target.value)} required />
              {fieldErrors.contact ? <p className="text-xs text-red-600 mt-1">{fieldErrors.contact}</p> : null}
            </div>

            <div>
              <Select label="Enrollment Status" value={form.status} onChange={(e) => setField('status', e.target.value)}>
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </Select>
              {fieldErrors.status ? <p className="text-xs text-red-600 mt-1">{fieldErrors.status}</p> : null}
            </div>

            <Input label="Date of Birth" type="date" value={form.dob} onChange={(e) => setField('dob', e.target.value)} />
            <Input label="Enrollment Date" type="date" value={form.enrollDate} onChange={(e) => setField('enrollDate', e.target.value)} />

            <Select label="Gender" value={form.gender} onChange={(e) => setField('gender', e.target.value)}>
              {GENDER_OPTIONS.map((item) => (
                <option key={item || 'none'} value={item}>{item || 'Not specified'}</option>
              ))}
            </Select>

            <Input label="Blood Group" value={form.bloodGroup} onChange={(e) => setField('bloodGroup', e.target.value)} />

            <div className="md:col-span-2">
              <Textarea label="Address" value={form.address} onChange={(e) => setField('address', e.target.value)} rows={2} />
            </div>

            <div className="md:col-span-2">
              <Textarea label="Health Conditions" value={form.healthConditions} onChange={(e) => setField('healthConditions', e.target.value)} rows={2} />
            </div>

            <div className="md:col-span-2">
              <Textarea label="Notes" value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={3} />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3 rounded border border-slate-200 bg-slate-50 px-3 py-3">
              <ToggleBox active={form.userActive} onToggle={(next) => setField('userActive', next)}>User Active</ToggleBox>
              <span className="text-sm text-slate-600">
                Toggle student portal account activation. You can reactivate alumni accounts here.
              </span>
              {(form.status === 'alumni' || !form.userActive) ? (
                <Button type="button" variant="outline" size="sm" onClick={reviveStudent} className="sm:ml-auto">
                  Revive Student
                </Button>
              ) : null}
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
              <Button type="submit" variant="primary" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <ButtonLink href={`/receptionist/students/profile/${id}`} variant="secondary" className="w-full sm:w-auto">
                View Profile
              </ButtonLink>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
