"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Skeleton from '@/components/ui/Skeleton'
import classesService from '@/services/classesService'
import subjectsService from '@/services/subjectsService'
import homeworksService from '@/services/homeworksService'
import InlineFilePreview from '@/components/homework/InlineFilePreview'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Textarea } from '@/components/ui'

function toInputDate(d) {
  const dt = d ? new Date(d) : new Date()
  const yyyy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function Page() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cls, setCls] = useState('')
  const [section, setSection] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [dueDate, setDueDate] = useState(toInputDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)))

  const [gradingMode, setGradingMode] = useState('none')
  const [maxMarks, setMaxMarks] = useState(0)

  const [attachmentFiles, setAttachmentFiles] = useState([])
  const [previewFile, setPreviewFile] = useState(null)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [cRes, sRes] = await Promise.all([
        classesService.listClasses({ active: true }),
        subjectsService.listSubjects({})
      ])
      setClasses(Array.isArray(cRes?.classes) ? cRes.classes : [])
      setSubjects(Array.isArray(sRes?.subjects) ? sRes.subjects : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const selectedClass = useMemo(() => classes.find((c) => String(c?.name) === String(cls)) || null, [classes, cls])
  const sections = useMemo(() => {
    const list = selectedClass?.sections
    return Array.isArray(list) ? list : []
  }, [selectedClass])

  const subjectsForClass = useMemo(() => {
    const list = Array.isArray(subjects) ? subjects : []
    return list
      .filter((s) => String(s?.className) === String(cls) && s?.active !== false)
      .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
  }, [subjects, cls])

  useEffect(() => {
    // reset dependent selections
    setSubjectId('')
    if (sections.length && !sections.includes(section)) {
      setSection('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls])

  async function onCreate(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const payload = {
        title,
        description,
        class: cls,
        section,
        subject: subjectId,
        dueDate,
        gradingMode,
        maxMarks: gradingMode === 'marks' ? Number(maxMarks || 0) : undefined
      }

      const res = await homeworksService.create(payload)
      const homeworkId = res?.homework?._id
      if (!homeworkId) throw new Error('Homework created but missing id')

      if (attachmentFiles.length) {
        await homeworksService.uploadAttachments(homeworkId, attachmentFiles)
      }

      setSuccess('Homework created')
      router.push(`/teacher/homework/${homeworkId}`)
    } catch (e2) {
      setError(e2?.response?.data?.error || e2.message || 'Failed to create homework')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Create Homework"
        subtitle="Assign homework to a specific class and section."
        actions={<ButtonLink href="/teacher/homework">Back</ButtonLink>}
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <Card className="mt-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <form className="space-y-4" onSubmit={onCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <Input label="Due Date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />

              <Select label="Class" value={cls} onChange={(e) => setCls(e.target.value)} required>
                <option value="">Select class</option>
                {classes
                  .slice()
                  .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))
                  .map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </Select>

              <div>
                <label className="text-sm font-medium">Section</label>
                {sections.length ? (
                  <Select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    required
                    selectClassName="mt-2"
                  >
                    <option value="">Select section</option>
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="e.g. A"
                    required
                    inputClassName="mt-2"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Subject</label>
                <Select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  required
                  disabled={!cls}
                  selectClassName="mt-2"
                >
                  <option value="">{cls ? 'Select subject' : 'Select class first'}</option>
                  {subjectsForClass.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
                {cls && subjectsForClass.length === 0 ? (
                  <div className="text-xs text-amber-700 mt-1">
                    No subjects found for this class. Ask admin to create subjects.
                  </div>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium">Grading</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Select value={gradingMode} onChange={(e) => setGradingMode(e.target.value)}>
                    <option value="none">No marks</option>
                    <option value="marks">Marks</option>
                  </Select>
                  <Input
                    type="number"
                    min={0}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    disabled={gradingMode !== 'marks'}
                    placeholder="Max marks"
                  />
                </div>
              </div>
            </div>

            <Textarea
              label="Description (optional)"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div>
              <label className="text-sm font-medium">Attachments (PDF/images)</label>
              <Input
                inputClassName="mt-2"
                type="file"
                multiple
                accept="application/pdf,image/*"
                onChange={(e) => setAttachmentFiles(Array.from(e.target.files || []))}
              />
              {attachmentFiles.length ? (
                <div className="text-xs text-gray-600 mt-1">Selected: {attachmentFiles.map((f) => f.name).join(', ')}</div>
              ) : null}
            </div>

            <div className="flex gap-3">
              <Button variant="primary" type="submit" disabled={saving || loading}>
                {saving ? 'Creating…' : 'Create'}
              </Button>
              <Button type="button" onClick={load} disabled={saving}>
                Refresh Data
              </Button>
            </div>
          </form>
        )}
      </Card>

      <InlineFilePreview file={previewFile} onClear={() => setPreviewFile(null)} />
    </div>
  )
}

