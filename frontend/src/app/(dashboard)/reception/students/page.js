"use client"

import { useEffect, useMemo, useState } from 'react'
import studentsService from '@/services/studentsService'
import directoryService from '@/services/directoryService'
import classesService from '@/services/classesService'
import Skeleton from '@/components/ui/Skeleton'

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [query, setQuery] = useState('')
  const [classId, setClassId] = useState('')
  const [section, setSection] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [classes, setClasses] = useState([])

  // Admission form state
  const [studentId, setStudentId] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [studentSection, setStudentSection] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')

  const [parentMode, setParentMode] = useState('existing')
  const [parentQuery, setParentQuery] = useState('')
  const [parentResults, setParentResults] = useState([])
  const [parentId, setParentId] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')

  const [createLogin, setCreateLogin] = useState(false)
  const [studentLoginEmail, setStudentLoginEmail] = useState('')
  const [studentLoginName, setStudentLoginName] = useState('')

  const admissionSections = (() => {
    const c = classes.find((x) => String(x?.name) === String(studentClass))
    return Array.isArray(c?.sections) ? c.sections : []
  })()

  const filterSections = (() => {
    const c = classes.find((x) => String(x?.name) === String(classId))
    return Array.isArray(c?.sections) ? c.sections : []
  })()

  async function loadClasses() {
    try {
      const { classes: list } = await classesService.listClasses({ active: true })
      setClasses(Array.isArray(list) ? list : [])
    } catch (e) {
      setClasses([])
    }
  }

  async function loadStudents() {
    setLoading(true)
    setError('')
    try {
      const { students: list } = await studentsService.listStudents({
        q: query || undefined,
        classId: classId || undefined,
        section: section || undefined,
        limit: 200
      })
      setStudents(Array.isArray(list) ? list : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
    loadClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!studentClass) {
      if (studentSection) setStudentSection('')
      return
    }
    if (admissionSections.length > 0 && studentSection && !admissionSections.includes(studentSection)) {
      setStudentSection('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentClass, classes])

  useEffect(() => {
    if (!classId) {
      if (section) setSection('')
      return
    }
    if (filterSections.length > 0 && section && !filterSections.includes(section)) {
      setSection('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, classes])

  async function searchParents() {
    setError('')
    setSuccess('')
    try {
      const q = String(parentQuery || '').trim()
      if (!q) {
        setParentResults([])
        return
      }
      const { users } = await directoryService.listUsers({ role: 'Parent', q, limit: 20 })
      setParentResults(Array.isArray(users) ? users : [])
      if (Array.isArray(users) && users.length === 1) {
        setParentId(users[0]._id)
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to search parents')
    }
  }

  const admissionPayload = useMemo(() => {
    const student = {
      studentId: String(studentId).trim(),
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      class: String(studentClass).trim(),
      section: String(studentSection).trim(),
      contact: String(contact).trim(),
      address: String(address).trim()
    }

    const parent =
      parentMode === 'existing'
        ? { mode: 'existing', parentId }
        : {
            mode: 'new',
            name: String(parentName).trim(),
            email: String(parentEmail).trim(),
            phone: String(parentPhone).trim()
          }

    const createStudentLogin = createLogin
      ? {
          enabled: true,
          email: String(studentLoginEmail).trim(),
          name: String(studentLoginName).trim() || undefined
        }
      : { enabled: false }

    return { student, parent, createStudentLogin }
  }, [
    studentId,
    firstName,
    lastName,
    studentClass,
    studentSection,
    contact,
    address,
    parentMode,
    parentId,
    parentName,
    parentEmail,
    parentPhone,
    createLogin,
    studentLoginEmail,
    studentLoginName
  ])

  async function submitAdmission(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await studentsService.admitStudent(admissionPayload)
      setSuccess('Admission completed')
      setStudentId('')
      setFirstName('')
      setLastName('')
      setStudentClass('')
      setStudentSection('')
      setContact('')
      setAddress('')
      setParentQuery('')
      setParentResults([])
      setParentId('')
      setParentName('')
      setParentEmail('')
      setParentPhone('')
      setCreateLogin(false)
      setStudentLoginEmail('')
      setStudentLoginName('')
      await loadStudents()
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Admission failed')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Students</h1>
      <p className="text-sm text-gray-600 mt-1">Admissions and student master data.</p>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="font-medium">Admission</h2>
          <p className="text-sm text-gray-600 mt-1">Create a student record and link an existing/new parent.</p>

          <form className="mt-4 space-y-3" onSubmit={submitAdmission}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input className="input" placeholder="Student ID" value={studentId} onChange={(e) => setStudentId(e.target.value)} required />
              <select className="input" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} required>
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <input className="input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              <input className="input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              <select
                className="input"
                value={studentSection}
                onChange={(e) => setStudentSection(e.target.value)}
                disabled={!studentClass || admissionSections.length === 0}
              >
                <option value="">
                  {!studentClass ? 'Select class first' : admissionSections.length === 0 ? 'No sections' : 'Section (optional)'}
                </option>
                {admissionSections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input className="input" placeholder="Contact" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <input className="input" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

            <div className="pt-2">
              <div className="text-sm font-medium">Parent</div>
              <div className="mt-2 flex gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <input type="radio" name="parentMode" checked={parentMode === 'existing'} onChange={() => setParentMode('existing')} />
                  Existing
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" name="parentMode" checked={parentMode === 'new'} onChange={() => setParentMode('new')} />
                  New
                </label>
              </div>

              {parentMode === 'existing' ? (
                <div className="mt-3">
                  <div className="flex gap-2">
                    <input className="input" placeholder="Search parent by name, email, or phone" value={parentQuery} onChange={(e) => setParentQuery(e.target.value)} />
                    <button type="button" className="px-3 py-2 border rounded hover-theme-primary" onClick={searchParents}>
                      Search
                    </button>
                  </div>
                  <select className="input mt-2" value={parentId} onChange={(e) => setParentId(e.target.value)} required>
                    <option value="">Select parent</option>
                    {parentResults.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" placeholder="Parent name" value={parentName} onChange={(e) => setParentName(e.target.value)} required />
                  <input className="input" placeholder="Parent email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required />
                  <input className="input" placeholder="Parent phone (optional)" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
                </div>
              )}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={createLogin} onChange={(e) => setCreateLogin(e.target.checked)} />
                Create Student Login
              </label>
              {createLogin ? (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="input" placeholder="Student login email" value={studentLoginEmail} onChange={(e) => setStudentLoginEmail(e.target.value)} required />
                  <input className="input" placeholder="Student login name (optional)" value={studentLoginName} onChange={(e) => setStudentLoginName(e.target.value)} />
                </div>
              ) : null}
            </div>

            <div className="pt-2">
              <button className="btn-primary" type="submit">Submit Admission</button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Student Master</h2>
              <p className="text-sm text-gray-600 mt-1">Search and view students.</p>
            </div>
            <button className="px-3 py-2 border rounded hover-theme-primary" onClick={loadStudents}>
              Refresh
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="input" placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="input" value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">All classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select
              className="input"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!classId || filterSections.length === 0}
            >
              <option value="">
                {!classId ? 'Select class first' : filterSections.length === 0 ? 'No sections' : 'All sections'}
              </option>
              {filterSections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="mt-3">
            <button className="px-3 py-2 border rounded hover-theme-primary" onClick={loadStudents}>
              Apply Filters
            </button>
          </div>

          {loading ? (
            <div className="mt-4"><Skeleton className="h-24" /></div>
          ) : (
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-3">Student ID</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Class</th>
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id} className="border-t">
                      <td className="py-2 pr-3 whitespace-nowrap">{s.studentId}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{s.firstName} {s.lastName}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{s.class}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{s.section}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{s.status || 'active'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {students.length === 0 ? <div className="text-sm text-gray-600 mt-3">No students found.</div> : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

