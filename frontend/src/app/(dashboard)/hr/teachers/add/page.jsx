'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import teacherService from '@/services/teacher.service'
import { Button, ButtonLink, Card, Input, PageHeader, Textarea } from '@/components/ui'

const MAX_DOCS = 10
const MAX_FILE_BYTES = 10 * 1024 * 1024

function validateForm(form, documents = []) {
  const errors = {}

  if (!String(form.name || '').trim()) errors.name = 'Full name is required.'
  if (!String(form.username || '').trim()) errors.username = 'Username is required.'
  if (!String(form.email || '').trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email).trim())) {
    errors.email = 'Enter a valid email address.'
  }

  if (!String(form.designation || '').trim()) errors.designation = 'Designation is required.'
  if (!String(form.qualification || '').trim()) errors.qualification = 'Qualification is required.'
  if (!String(form.joiningDate || '').trim()) errors.joiningDate = 'Joining date is required.'
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

export default function AddTeacherPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const [form, setForm] = useState({
    name: '',
    username: '',
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
    notes: '',
  })

  const [documents, setDocuments] = useState([])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const nextErrors = validateForm(form, documents)
    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)

    try {
      const payload = {
        ...form,
        experienceYears: form.experienceYears === '' ? undefined : Number(form.experienceYears),
        salary: form.salary === '' ? undefined : Number(form.salary),
      }

      const { teacher } = await teacherService.createTeacher(payload, documents)
      setSuccess('Teacher created successfully. Welcome email sent.')

      setTimeout(() => {
        router.push(`/hr/teachers/profile/${teacher?._id}`)
      }, 600)
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create teacher')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Teacher"
        subtitle="Create teacher account, profile, and send welcome credentials email."
        right={<ButtonLink href="/hr/teachers" variant="secondary">Back</ButtonLink>}
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card>
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div>
            <Input label="Full Name" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            {fieldErrors.name ? <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p> : null}
          </div>

          <div>
            <Input label="Username" value={form.username} onChange={(e) => setField('username', e.target.value)} required />
            {fieldErrors.username ? <p className="text-xs text-red-600 mt-1">{fieldErrors.username}</p> : null}
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

          <div>
            <Input label="Joining Date" type="date" value={form.joiningDate} onChange={(e) => setField('joiningDate', e.target.value)} required />
            {fieldErrors.joiningDate ? <p className="text-xs text-red-600 mt-1">{fieldErrors.joiningDate}</p> : null}
          </div>

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

          <div className="md:col-span-2">
            <Textarea label="Address" value={form.address} onChange={(e) => setField('address', e.target.value)} required />
            {fieldErrors.address ? <p className="text-xs text-red-600 mt-1">{fieldErrors.address}</p> : null}
          </div>

          <div className="md:col-span-2">
            <Textarea label="Notes" value={form.notes} onChange={(e) => setField('notes', e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Documents"
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
            <p className="text-xs text-gray-500 mt-1">Status defaults to Working and employee ID is auto-generated (T-0001...).</p>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Teacher'}
            </Button>
            <ButtonLink href="/hr/teachers" variant="secondary">Cancel</ButtonLink>
          </div>
        </form>
      </Card>
    </div>
  )
}
