'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import teacherService from '@/services/teacher.service'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton, Textarea, ToggleBox } from '@/components/ui'

const STATUS_OPTIONS = ['Working', 'Resigned']
const MAX_DOCS = 10
const MAX_FILE_BYTES = 10 * 1024 * 1024

function validateForm(form, documents = []) {
  const errors = {}

  if (!String(form.name || '').trim()) errors.name = 'Full name is required.'
  if (!String(form.email || '').trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!String(form.designation || '').trim()) errors.designation = 'Designation is required.'
  if (!String(form.qualification || '').trim()) errors.qualification = 'Qualification is required.'
  if (!String(form.contactNumber || '').trim()) errors.contactNumber = 'Contact number is required.'
  if (!String(form.address || '').trim()) errors.address = 'Address is required.'

  if (form.experienceYears !== '' && Number(form.experienceYears) < 0) {
    errors.experienceYears = 'Experience years cannot be negative.'
  }

  if (form.salary !== '' && Number(form.salary) < 0) {
    errors.salary = 'Salary cannot be negative.'
  }

  if ((documents || []).length > MAX_DOCS) {
    errors.documents = `You can upload up to ${MAX_DOCS} documents.`
  }

  const oversized = (documents || []).find((file) => Number(file?.size || 0) > MAX_FILE_BYTES)
  if (oversized) {
    errors.documents = `File \"${oversized.name}\" exceeds 10MB limit.`
  }

  return errors
}

export default function EditTeacherPage() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [documents, setDocuments] = useState([])
  const [existingDocuments, setExistingDocuments] = useState([])
  const [removeDocuments, setRemoveDocuments] = useState([])
  const [form, setForm] = useState({
    name: '',
    email: '',
    designation: '',
    department: '',
    qualification: '',
    certifications: '',
    joiningDate: '',
    experienceYears: '',
    salary: '',
    contactNumber: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    status: 'Working',
    notes: '',
    active: true,
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

  function toggleDocumentRemoval(url) {
    setRemoveDocuments((prev) => {
      if (prev.includes(url)) return prev.filter((item) => item !== url)
      return [...prev, url]
    })
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const { teacher } = await teacherService.getTeacher(id)
        const docs = Array.isArray(teacher?.documents) ? teacher.documents : []
        setExistingDocuments(docs)
        setRemoveDocuments([])
        setForm({
          name: teacher?.user?.name || '',
          email: teacher?.user?.email || '',
          designation: teacher?.designation || '',
          department: teacher?.department || '',
          qualification: teacher?.qualification || '',
          certifications: (teacher?.certifications || []).join(', '),
          joiningDate: teacher?.joiningDate ? String(teacher.joiningDate).slice(0, 10) : '',
          experienceYears: teacher?.experienceYears ?? '',
          salary: teacher?.salary ?? '',
          contactNumber: teacher?.contactNumber || '',
          address: teacher?.address || '',
          emergencyContactName: teacher?.emergencyContact?.name || '',
          emergencyContactPhone: teacher?.emergencyContact?.phone || '',
          status: teacher?.status || 'Working',
          notes: teacher?.notes || '',
          active: teacher?.user?.active !== false,
        })
      } catch (err) {
        setError(err?.response?.data?.error || 'Failed to load teacher')
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

    const nextErrors = validateForm(form, documents)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)

    try {
      await teacherService.updateTeacher(id, {
        ...form,
        experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
        salary: form.salary === '' ? '' : Number(form.salary),
        removeDocuments,
      }, documents)
      setSuccess('Teacher updated successfully')
      setDocuments([])
      const { teacher } = await teacherService.getTeacher(id)
      setExistingDocuments(Array.isArray(teacher?.documents) ? teacher.documents : [])
      setRemoveDocuments([])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to update teacher')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Teacher"
        subtitle="Update teacher profile and account status."
        right={<ButtonLink href="/hr/teachers" variant="secondary">Back</ButtonLink>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      {loading ? (
        <Skeleton className="h-52" />
      ) : (
        <Card>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
            <div>
              <Input label="Full Name" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
              {fieldErrors.name ? <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p> : null}
            </div>
            <div>
              <Input label="Email" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />
              {fieldErrors.email ? <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p> : null}
            </div>

            <div>
              <Input label="Designation" value={form.designation} onChange={(e) => setField('designation', e.target.value)} required />
              {fieldErrors.designation ? <p className="text-xs text-red-600 mt-1">{fieldErrors.designation}</p> : null}
            </div>
            <Input label="Department" value={form.department} onChange={(e) => setField('department', e.target.value)} />

            <div>
              <Input label="Qualification" value={form.qualification} onChange={(e) => setField('qualification', e.target.value)} required />
              {fieldErrors.qualification ? <p className="text-xs text-red-600 mt-1">{fieldErrors.qualification}</p> : null}
            </div>
            <Input label="Certifications (comma separated)" value={form.certifications} onChange={(e) => setField('certifications', e.target.value)} />

            <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setField('joiningDate', e.target.value)} />
            <div>
              <Input label="Experience Years" type="number" min="0" value={form.experienceYears} onChange={(e) => setField('experienceYears', e.target.value)} />
              {fieldErrors.experienceYears ? <p className="text-xs text-red-600 mt-1">{fieldErrors.experienceYears}</p> : null}
            </div>

            <div>
              <Input label="Salary" type="number" min="0" value={form.salary} onChange={(e) => setField('salary', e.target.value)} />
              {fieldErrors.salary ? <p className="text-xs text-red-600 mt-1">{fieldErrors.salary}</p> : null}
            </div>
            <div>
              <Input label="Contact Number" value={form.contactNumber} onChange={(e) => setField('contactNumber', e.target.value)} required />
              {fieldErrors.contactNumber ? <p className="text-xs text-red-600 mt-1">{fieldErrors.contactNumber}</p> : null}
            </div>

            <Input label="Emergency Contact Name" value={form.emergencyContactName} onChange={(e) => setField('emergencyContactName', e.target.value)} />
            <Input label="Emergency Contact Phone" value={form.emergencyContactPhone} onChange={(e) => setField('emergencyContactPhone', e.target.value)} />

            <Select label="Status" value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>

            <div className="flex items-end">
              <ToggleBox active={form.active} onToggle={(next) => setField('active', next)}>User Active</ToggleBox>
            </div>

            <div className="md:col-span-2">
              <Textarea label="Address" value={form.address} onChange={(e) => setField('address', e.target.value)} required />
              {fieldErrors.address ? <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p> : null}
            </div>

            <div className="md:col-span-2">
              <Textarea label="Notes" value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Existing Documents</label>
              {existingDocuments.length === 0 ? (
                <p className="text-sm text-gray-600 mt-2">No documents uploaded.</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {existingDocuments.map((url) => {
                    const marked = removeDocuments.includes(url)
                    return (
                      <div key={url} className="flex items-center justify-between gap-3 rounded border px-3 py-2">
                        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline truncate">
                          {url}
                        </a>
                        <Button
                          type="button"
                          variant={marked ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => toggleDocumentRemoval(url)}
                        >
                          {marked ? 'Undo Remove' : 'Remove'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <Input
                label="Upload Additional Documents"
                type="file"
                multiple
                onChange={(e) => {
                  const nextDocs = Array.from(e.target.files || [])
                  setDocuments(nextDocs)
                  setFieldErrors((prev) => {
                    const next = { ...prev }
                    const docError = validateForm(form, nextDocs).documents
                    if (docError) next.documents = docError
                    else delete next.documents
                    return next
                  })
                }}
              />
              {fieldErrors.documents ? <p className="text-xs text-red-600 mt-1">{fieldErrors.documents}</p> : null}
            </div>

            <div className="md:col-span-2 flex gap-2">
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <ButtonLink href={`/hr/teachers/profile/${id}`} variant="secondary">View Profile</ButtonLink>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
