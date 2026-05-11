<<<<<<< HEAD
"use client"

import { useEffect, useMemo, useState } from 'react'
import studentsService from '@/services/studentsService'
import classesService from '@/services/classesService'
import { Button, Card, Input, Select, ToggleBox } from '@/components/ui'

export default function AdmissionForm({ onSubmitted }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [classes, setClasses] = useState([])

  const [studentId, setStudentId] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [userName, setUserName] = useState('')
  const [userUsername, setUserUsername] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const [studentClass, setStudentClass] = useState('')
  const [studentSection, setStudentSection] = useState('')
  const [dob, setDob] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [enrollDate, setEnrollDate] = useState(new Date().toISOString().slice(0, 10))
  const [gender, setGender] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [healthConditions, setHealthConditions] = useState('')
  const [studentStatus, setStudentStatus] = useState('incampus')
  const [notes, setNotes] = useState('')

  const [parentMode, setParentMode] = useState('existing')
  const [parentQuery, setParentQuery] = useState('')
  const [parentResults, setParentResults] = useState([])
  const [parentProfileId, setParentProfileId] = useState('')

  const [parentName, setParentName] = useState('')
  const [parentUsername, setParentUsername] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentCnic, setParentCnic] = useState('')
  const [parentDob, setParentDob] = useState('')
  const [parentOccupation, setParentOccupation] = useState('')
  const [parentSalary, setParentSalary] = useState('')
  const [parentRelation, setParentRelation] = useState('Father')
  const [parentAddress, setParentAddress] = useState('')

  const [profilePicture, setProfilePicture] = useState(null)
  const [documents, setDocuments] = useState([])

  const [tutionFee, setTutionFee] = useState(0)
  const [tutionFeeConcession, setTutionFeeConcession] = useState('')
  const [transportFeeConcession, setTransportFeeConcession] = useState('')
  const [lastFeePaid, setLastFeePaid] = useState(false)
  const [lastFeePaidAmount, setLastFeePaidAmount] = useState('')
  const [lastFeePaidOn, setLastFeePaidOn] = useState('')
  const [balance, setBalance] = useState('0')
  const [initialFeeAmount, setInitialFeeAmount] = useState('')
  const [initialFeeDueDate, setInitialFeeDueDate] = useState('')
  const [initialFeeNotes, setInitialFeeNotes] = useState('')

  const [availTransport, setAvailTransport] = useState(false)
  const [route, setRoute] = useState('')
  const [pickupPoint, setPickupPoint] = useState('')
  const [dropoffPoint, setDropoffPoint] = useState('')
  const [transportFee, setTransportFee] = useState('')

  const classOptions = useMemo(() => (Array.isArray(classes) ? classes : []), [classes])

  const sectionOptions = useMemo(() => {
    const selected = classOptions.find((c) => c._id === studentClass)
    return Array.isArray(selected?.sections) ? selected.sections : []
  }, [classOptions, studentClass])

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classesService.listClasses({ active: true })
        setClasses(Array.isArray(res?.classes) ? res.classes : [])
      } catch {
        setClasses([])
      }
    }

    loadClasses()
  }, [])

  useEffect(() => {
    const selected = classOptions.find((c) => c._id === studentClass)
    setTutionFee(Number(selected?.tutionFee || 0))

    if (studentSection && sectionOptions.length > 0 && !sectionOptions.includes(studentSection)) {
      setStudentSection('')
    }
  }, [classOptions, sectionOptions, studentClass, studentSection])

  async function searchParents() {
    setError('')
    try {
      const q = String(parentQuery || '').trim()
      if (!q) {
        setParentResults([])
        return
      }
      const res = await studentsService.searchParents({ q, limit: 20 })
      setParentResults(Array.isArray(res?.parents) ? res.parents : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to search parents')
    }
  }

  async function submitAdmission(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!userName || !userUsername || !userEmail || !studentClass || !registrationNumber || !contact) {
      setError('Student name, username, email, class, registration number, and phone are required')
      return
    }

    if (parentMode === 'existing' && !parentProfileId) {
      setError('Please select an existing parent')
      return
    }

    if (parentMode === 'existing') {
      const selectedParent = parentResults.find((p) => p._id === parentProfileId)
      if (selectedParent && !String(selectedParent.phone || '').trim()) {
        setError('Selected parent must have a phone number')
        return
      }
    }

    if (parentMode === 'new' && (!parentName || !parentUsername || !parentEmail || !parentPhone)) {
      setError('Parent name, username, email, and phone are required for new parent')
      return
    }

    setSaving(true)
    try {
      const payload = {
        user: {
          name: userName,
          username: userUsername,
          email: userEmail
        },
        student: {
          studentId: studentId || undefined,
          registrationNumber,
          rollNumber: rollNumber || undefined,
          class: studentClass,
          section: studentSection,
          dob: dob || undefined,
          contact,
          address,
          enrollDate: enrollDate || undefined,
          gender: gender || undefined,
          bloodGroup: bloodGroup || undefined,
          healthConditions: healthConditions || undefined,
          status: studentStatus,
          notes
        },
        parent:
          parentMode === 'existing'
            ? { mode: 'existing', parentProfileId }
            : {
                mode: 'new',
                name: parentName,
                username: parentUsername,
                email: parentEmail,
                phone: parentPhone,
                cnic: parentCnic,
                dob: parentDob || undefined,
                occupation: parentOccupation,
                salary: parentSalary,
                relation: parentRelation,
                address: parentAddress
              },
        fee: {
          tutionFeeConcession: tutionFeeConcession === '' ? undefined : Number(tutionFeeConcession),
          transportFeeConcession: transportFeeConcession === '' ? undefined : Number(transportFeeConcession),
          lastFeePaid,
          lastFeePaidAmount: lastFeePaidAmount === '' ? undefined : Number(lastFeePaidAmount),
          lastFeePaidOn: lastFeePaidOn || undefined,
          balance: balance === '' ? 0 : Number(balance),
          initialFeeAmount: initialFeeAmount === '' ? undefined : Number(initialFeeAmount),
          initialFeeDueDate: initialFeeDueDate || undefined,
          initialFeeNotes: initialFeeNotes || undefined
        },
        transport: {
          availTransport,
          route,
          pickupPoint,
          dropoffPoint,
          transportFee: transportFee === '' ? 0 : Number(transportFee)
        }
      }

      await studentsService.admitStudent(payload, { profilePicture, documents })
      setSuccess('Admission completed successfully')

      setStudentId('')
      setRegistrationNumber('')
      setRollNumber('')
      setUserName('')
      setUserUsername('')
      setUserEmail('')
      setStudentClass('')
      setStudentSection('')
      setDob('')
      setContact('')
      setAddress('')
      setEnrollDate(new Date().toISOString().slice(0, 10))
      setGender('')
      setBloodGroup('')
      setHealthConditions('')
      setStudentStatus('incampus')
      setNotes('')

      setParentMode('existing')
      setParentQuery('')
      setParentResults([])
      setParentProfileId('')
      setParentName('')
      setParentUsername('')
      setParentEmail('')
      setParentPhone('')
      setParentCnic('')
      setParentDob('')
      setParentOccupation('')
      setParentSalary('')
      setParentRelation('Father')
      setParentAddress('')

      setProfilePicture(null)
      setDocuments([])

      setTutionFeeConcession('')
      setTransportFeeConcession('')
      setLastFeePaid(false)
      setLastFeePaidAmount('')
      setLastFeePaidOn('')
      setBalance('0')
      setInitialFeeAmount('')
      setInitialFeeDueDate('')
      setInitialFeeNotes('')

      setAvailTransport(false)
      setRoute('')
      setPickupPoint('')
      setDropoffPoint('')
      setTransportFee('')

      if (typeof onSubmitted === 'function') {
        onSubmitted()
      }
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Admission failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="font-medium">Student Admission Form</h2>
      <p className="text-sm text-gray-600 mt-1">All fields aligned with User, Student, Parent, and fee/transport data.</p>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-700">{success}</div> : null}

      <form className="mt-4 space-y-6" onSubmit={submitAdmission}>
        <section className="space-y-3">
          <h3 className="font-medium text-sm">1. Student User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Student full name *" value={userName} onChange={(e) => setUserName(e.target.value)} required />
            <Input placeholder="Student username *" value={userUsername} onChange={(e) => setUserUsername(e.target.value)} required />
            <Input type="email" placeholder="Student email *" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
            <Input placeholder="Registration Number *" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
            <Input placeholder="Roll Number (optional)" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
            <Input placeholder="Legacy Student ID (optional)" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">2. Student Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={studentClass} onChange={(e) => setStudentClass(e.target.value)} required>
              <option value="">Select class *</option>
              {classOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
            <Select value={studentSection} onChange={(e) => setStudentSection(e.target.value)}>
              <option value="">Select section</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Input type="date" placeholder="Date of birth" value={dob} onChange={(e) => setDob(e.target.value)} />
            <Input type="date" placeholder="Enroll date" value={enrollDate} onChange={(e) => setEnrollDate(e.target.value)} />
            <Input placeholder="Student phone *" value={contact} onChange={(e) => setContact(e.target.value)} required />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input placeholder="Blood group" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
            <Select value={studentStatus} onChange={(e) => setStudentStatus(e.target.value)}>
              <option value="incampus">In Campus</option>
              <option value="alumni">Alumni</option>
            </Select>
          </div>
          <Input placeholder="Health conditions (optional)" value={healthConditions} onChange={(e) => setHealthConditions(e.target.value)} />
          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">3. Parent User/Profile</h3>
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            <label className="flex items-center gap-2">
              <Input type="radio" name="parentMode" checked={parentMode === 'existing'} onChange={() => setParentMode('existing')} inputClassName="h-4 w-4" />
              Existing Parent
            </label>
            <label className="flex items-center gap-2">
              <Input type="radio" name="parentMode" checked={parentMode === 'new'} onChange={() => setParentMode('new')} inputClassName="h-4 w-4" />
              New Parent
            </label>
          </div>

          {parentMode === 'existing' ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search by name, username, email, phone, cnic"
                  value={parentQuery}
                  onChange={(e) => setParentQuery(e.target.value)}
                />
                <Button type="button" className="w-full sm:w-auto" onClick={searchParents}>Search</Button>
              </div>
              <Select value={parentProfileId} onChange={(e) => setParentProfileId(e.target.value)}>
                <option value="">Select parent</option>
                {parentResults.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} | {p?.user?.username || '-'} | {p.email}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Parent name *" value={parentName} onChange={(e) => setParentName(e.target.value)} required={parentMode === 'new'} />
              <Input placeholder="Parent username *" value={parentUsername} onChange={(e) => setParentUsername(e.target.value)} required={parentMode === 'new'} />
              <Input type="email" placeholder="Parent email *" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required={parentMode === 'new'} />
              <Input placeholder="Parent phone *" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required={parentMode === 'new'} />
              <Input placeholder="CNIC" value={parentCnic} onChange={(e) => setParentCnic(e.target.value)} />
              <Input type="date" placeholder="DOB" value={parentDob} onChange={(e) => setParentDob(e.target.value)} />
              <Input placeholder="Occupation" value={parentOccupation} onChange={(e) => setParentOccupation(e.target.value)} />
              <Input type="number" placeholder="Salary" value={parentSalary} onChange={(e) => setParentSalary(e.target.value)} />
              <Select value={parentRelation} onChange={(e) => setParentRelation(e.target.value)}>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </Select>
              <Input placeholder="Parent address" value={parentAddress} onChange={(e) => setParentAddress(e.target.value)} />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">4. Student Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Profile Picture</label>
              <Input type="file" accept="image/*" onChange={(e) => setProfilePicture(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Documents (multiple)</label>
              <Input type="file" multiple onChange={(e) => setDocuments(Array.from(e.target.files || []))} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">5. Fee Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="number" value={tutionFee} disabled placeholder="Tuition Fee (from class)" />
            <Input type="number" placeholder="Tuition Fee Concession" value={tutionFeeConcession} onChange={(e) => setTutionFeeConcession(e.target.value)} />
            <Input type="number" placeholder="Transport Fee Concession" value={transportFeeConcession} onChange={(e) => setTransportFeeConcession(e.target.value)} />
            <Input type="number" placeholder="Balance" value={balance} onChange={(e) => setBalance(e.target.value)} />
            <Input type="number" placeholder="Initial Fee Amount" value={initialFeeAmount} onChange={(e) => setInitialFeeAmount(e.target.value)} />
            <Input type="date" placeholder="Initial Fee Due Date" value={initialFeeDueDate} onChange={(e) => setInitialFeeDueDate(e.target.value)} />
            <Input placeholder="Initial Fee Notes" value={initialFeeNotes} onChange={(e) => setInitialFeeNotes(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Input type="checkbox" checked={lastFeePaid} onChange={(e) => setLastFeePaid(Boolean(e.target.checked))} inputClassName="h-4 w-4" />
            Last fee paid
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Last Fee Paid Amount"
              value={lastFeePaidAmount}
              onChange={(e) => setLastFeePaidAmount(e.target.value)}
              disabled={!lastFeePaid}
            />
            <Input
              type="date"
              placeholder="Last Fee Paid On"
              value={lastFeePaidOn}
              onChange={(e) => setLastFeePaidOn(e.target.value)}
              disabled={!lastFeePaid}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">6. Transport</h3>
          <div className="flex items-center gap-2 text-sm">
            <ToggleBox active={availTransport} onToggle={setAvailTransport}>Avail Transport</ToggleBox>
          </div>
          {availTransport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Route" value={route} onChange={(e) => setRoute(e.target.value)} />
              <Input placeholder="Pickup point" value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} />
              <Input placeholder="Dropoff point" value={dropoffPoint} onChange={(e) => setDropoffPoint(e.target.value)} />
              <Input type="number" placeholder="Transport fee" value={transportFee} onChange={(e) => setTransportFee(e.target.value)} />
            </div>
          ) : null}
        </section>

        <Button variant="primary" type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Admission'}
        </Button>
      </form>
    </Card>
  )
}
=======
"use client"

import { useEffect, useMemo, useState } from 'react'
import studentsService from '@/services/studentsService'
import classesService from '@/services/classesService'
import { Button, Card, Input, Select, ToggleBox } from '@/components/ui'

export default function AdmissionForm({ onSubmitted }) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [classes, setClasses] = useState([])

  const [studentId, setStudentId] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [userName, setUserName] = useState('')
  const [userUsername, setUserUsername] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const [studentClass, setStudentClass] = useState('')
  const [studentSection, setStudentSection] = useState('')
  const [dob, setDob] = useState('')
  const [contact, setContact] = useState('')
  const [address, setAddress] = useState('')
  const [enrollDate, setEnrollDate] = useState(new Date().toISOString().slice(0, 10))
  const [gender, setGender] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [healthConditions, setHealthConditions] = useState('')
  const [studentStatus, setStudentStatus] = useState('incampus')
  const [notes, setNotes] = useState('')

  const [parentMode, setParentMode] = useState('existing')
  const [parentQuery, setParentQuery] = useState('')
  const [parentResults, setParentResults] = useState([])
  const [parentProfileId, setParentProfileId] = useState('')

  const [parentName, setParentName] = useState('')
  const [parentUsername, setParentUsername] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [parentCnic, setParentCnic] = useState('')
  const [parentDob, setParentDob] = useState('')
  const [parentOccupation, setParentOccupation] = useState('')
  const [parentSalary, setParentSalary] = useState('')
  const [parentRelation, setParentRelation] = useState('Father')
  const [parentAddress, setParentAddress] = useState('')

  const [profilePicture, setProfilePicture] = useState(null)
  const [documents, setDocuments] = useState([])

  const [tutionFee, setTutionFee] = useState(0)
  const [tutionFeeConcession, setTutionFeeConcession] = useState('')
  const [transportFeeConcession, setTransportFeeConcession] = useState('')
  const [lastFeePaid, setLastFeePaid] = useState(false)
  const [lastFeePaidAmount, setLastFeePaidAmount] = useState('')
  const [lastFeePaidOn, setLastFeePaidOn] = useState('')
  const [balance, setBalance] = useState('0')
  const [initialFeeAmount, setInitialFeeAmount] = useState('')
  const [initialFeeDueDate, setInitialFeeDueDate] = useState('')
  const [initialFeeNotes, setInitialFeeNotes] = useState('')

  const [availTransport, setAvailTransport] = useState(false)
  const [route, setRoute] = useState('')
  const [pickupPoint, setPickupPoint] = useState('')
  const [dropoffPoint, setDropoffPoint] = useState('')
  const [transportFee, setTransportFee] = useState('')

  const classOptions = useMemo(() => (Array.isArray(classes) ? classes : []), [classes])

  const sectionOptions = useMemo(() => {
    const selected = classOptions.find((c) => c._id === studentClass)
    return Array.isArray(selected?.sections) ? selected.sections : []
  }, [classOptions, studentClass])

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await classesService.listClasses({ active: true })
        setClasses(Array.isArray(res?.classes) ? res.classes : [])
      } catch {
        setClasses([])
      }
    }

    loadClasses()
  }, [])

  useEffect(() => {
    const selected = classOptions.find((c) => c._id === studentClass)
    setTutionFee(Number(selected?.tutionFee || 0))

    if (studentSection && sectionOptions.length > 0 && !sectionOptions.includes(studentSection)) {
      setStudentSection('')
    }
  }, [classOptions, sectionOptions, studentClass, studentSection])

  async function searchParents() {
    setError('')
    try {
      const q = String(parentQuery || '').trim()
      if (!q) {
        setParentResults([])
        return
      }
      const res = await studentsService.searchParents({ q, limit: 20 })
      setParentResults(Array.isArray(res?.parents) ? res.parents : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to search parents')
    }
  }

  async function submitAdmission(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!userName || !userUsername || !userEmail || !studentClass || !registrationNumber || !contact) {
      setError('Student name, username, email, class, registration number, and phone are required')
      return
    }

    if (parentMode === 'existing' && !parentProfileId) {
      setError('Please select an existing parent')
      return
    }

    if (parentMode === 'existing') {
      const selectedParent = parentResults.find((p) => p._id === parentProfileId)
      if (selectedParent && !String(selectedParent.phone || '').trim()) {
        setError('Selected parent must have a phone number')
        return
      }
    }

    if (parentMode === 'new' && (!parentName || !parentUsername || !parentEmail || !parentPhone)) {
      setError('Parent name, username, email, and phone are required for new parent')
      return
    }

    setSaving(true)
    try {
      const payload = {
        user: {
          name: userName,
          username: userUsername,
          email: userEmail
        },
        student: {
          studentId: studentId || undefined,
          registrationNumber,
          rollNumber: rollNumber || undefined,
          class: studentClass,
          section: studentSection,
          dob: dob || undefined,
          contact,
          address,
          enrollDate: enrollDate || undefined,
          gender: gender || undefined,
          bloodGroup: bloodGroup || undefined,
          healthConditions: healthConditions || undefined,
          status: studentStatus,
          notes
        },
        parent:
          parentMode === 'existing'
            ? { mode: 'existing', parentProfileId }
            : {
                mode: 'new',
                name: parentName,
                username: parentUsername,
                email: parentEmail,
                phone: parentPhone,
                cnic: parentCnic,
                dob: parentDob || undefined,
                occupation: parentOccupation,
                salary: parentSalary,
                relation: parentRelation,
                address: parentAddress
              },
        fee: {
          tutionFeeConcession: tutionFeeConcession === '' ? undefined : Number(tutionFeeConcession),
          transportFeeConcession: transportFeeConcession === '' ? undefined : Number(transportFeeConcession),
          lastFeePaid,
          lastFeePaidAmount: lastFeePaidAmount === '' ? undefined : Number(lastFeePaidAmount),
          lastFeePaidOn: lastFeePaidOn || undefined,
          balance: balance === '' ? 0 : Number(balance),
          initialFeeAmount: initialFeeAmount === '' ? undefined : Number(initialFeeAmount),
          initialFeeDueDate: initialFeeDueDate || undefined,
          initialFeeNotes: initialFeeNotes || undefined
        },
        transport: {
          availTransport,
          route,
          pickupPoint,
          dropoffPoint,
          transportFee: transportFee === '' ? 0 : Number(transportFee)
        }
      }

      await studentsService.admitStudent(payload, { profilePicture, documents })
      setSuccess('Admission completed successfully')

      setStudentId('')
      setRegistrationNumber('')
      setRollNumber('')
      setUserName('')
      setUserUsername('')
      setUserEmail('')
      setStudentClass('')
      setStudentSection('')
      setDob('')
      setContact('')
      setAddress('')
      setEnrollDate(new Date().toISOString().slice(0, 10))
      setGender('')
      setBloodGroup('')
      setHealthConditions('')
      setStudentStatus('incampus')
      setNotes('')

      setParentMode('existing')
      setParentQuery('')
      setParentResults([])
      setParentProfileId('')
      setParentName('')
      setParentUsername('')
      setParentEmail('')
      setParentPhone('')
      setParentCnic('')
      setParentDob('')
      setParentOccupation('')
      setParentSalary('')
      setParentRelation('Father')
      setParentAddress('')

      setProfilePicture(null)
      setDocuments([])

      setTutionFeeConcession('')
      setTransportFeeConcession('')
      setLastFeePaid(false)
      setLastFeePaidAmount('')
      setLastFeePaidOn('')
      setBalance('0')
      setInitialFeeAmount('')
      setInitialFeeDueDate('')
      setInitialFeeNotes('')

      setAvailTransport(false)
      setRoute('')
      setPickupPoint('')
      setDropoffPoint('')
      setTransportFee('')

      if (typeof onSubmitted === 'function') {
        onSubmitted()
      }
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Admission failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h2 className="font-medium">Student Admission Form</h2>
      <p className="text-sm text-gray-600 mt-1">All fields aligned with User, Student, Parent, and fee/transport data.</p>

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-700">{success}</div> : null}

      <form className="mt-4 space-y-6" onSubmit={submitAdmission}>
        <section className="space-y-3">
          <h3 className="font-medium text-sm">1. Student User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Student full name *" value={userName} onChange={(e) => setUserName(e.target.value)} required />
            <Input placeholder="Student username *" value={userUsername} onChange={(e) => setUserUsername(e.target.value)} required />
            <Input type="email" placeholder="Student email *" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
            <Input placeholder="Registration Number *" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
            <Input placeholder="Roll Number (optional)" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
            <Input placeholder="Legacy Student ID (optional)" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">2. Student Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={studentClass} onChange={(e) => setStudentClass(e.target.value)} required>
              <option value="">Select class *</option>
              {classOptions.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
            <Select value={studentSection} onChange={(e) => setStudentSection(e.target.value)}>
              <option value="">Select section</option>
              {sectionOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Input type="date" placeholder="Date of birth" value={dob} onChange={(e) => setDob(e.target.value)} />
            <Input type="date" placeholder="Enroll date" value={enrollDate} onChange={(e) => setEnrollDate(e.target.value)} />
            <Input placeholder="Student phone *" value={contact} onChange={(e) => setContact(e.target.value)} required />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Input placeholder="Blood group" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
            <Select value={studentStatus} onChange={(e) => setStudentStatus(e.target.value)}>
              <option value="incampus">In Campus</option>
              <option value="alumni">Alumni</option>
            </Select>
          </div>
          <Input placeholder="Health conditions (optional)" value={healthConditions} onChange={(e) => setHealthConditions(e.target.value)} />
          <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">3. Parent User/Profile</h3>
          <div className="flex flex-col sm:flex-row gap-3 text-sm">
            <label className="flex items-center gap-2">
              <Input type="radio" name="parentMode" checked={parentMode === 'existing'} onChange={() => setParentMode('existing')} inputClassName="h-4 w-4" />
              Existing Parent
            </label>
            <label className="flex items-center gap-2">
              <Input type="radio" name="parentMode" checked={parentMode === 'new'} onChange={() => setParentMode('new')} inputClassName="h-4 w-4" />
              New Parent
            </label>
          </div>

          {parentMode === 'existing' ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search by name, username, email, phone, cnic"
                  value={parentQuery}
                  onChange={(e) => setParentQuery(e.target.value)}
                />
                <Button type="button" className="w-full sm:w-auto" onClick={searchParents}>Search</Button>
              </div>
              <Select value={parentProfileId} onChange={(e) => setParentProfileId(e.target.value)}>
                <option value="">Select parent</option>
                {parentResults.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} | {p?.user?.username || '-'} | {p.email}
                  </option>
                ))}
              </Select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Parent name *" value={parentName} onChange={(e) => setParentName(e.target.value)} required={parentMode === 'new'} />
              <Input placeholder="Parent username *" value={parentUsername} onChange={(e) => setParentUsername(e.target.value)} required={parentMode === 'new'} />
              <Input type="email" placeholder="Parent email *" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} required={parentMode === 'new'} />
              <Input placeholder="Parent phone *" value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} required={parentMode === 'new'} />
              <Input placeholder="CNIC" value={parentCnic} onChange={(e) => setParentCnic(e.target.value)} />
              <Input type="date" placeholder="DOB" value={parentDob} onChange={(e) => setParentDob(e.target.value)} />
              <Input placeholder="Occupation" value={parentOccupation} onChange={(e) => setParentOccupation(e.target.value)} />
              <Input type="number" placeholder="Salary" value={parentSalary} onChange={(e) => setParentSalary(e.target.value)} />
              <Select value={parentRelation} onChange={(e) => setParentRelation(e.target.value)}>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Guardian">Guardian</option>
                <option value="Other">Other</option>
              </Select>
              <Input placeholder="Parent address" value={parentAddress} onChange={(e) => setParentAddress(e.target.value)} />
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">4. Student Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Profile Picture</label>
              <Input type="file" accept="image/*" onChange={(e) => setProfilePicture(e.target.files?.[0] || null)} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Documents (multiple)</label>
              <Input type="file" multiple onChange={(e) => setDocuments(Array.from(e.target.files || []))} />
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">5. Fee Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="number" value={tutionFee} disabled placeholder="Tuition Fee (from class)" />
            <Input type="number" placeholder="Tuition Fee Concession" value={tutionFeeConcession} onChange={(e) => setTutionFeeConcession(e.target.value)} />
            <Input type="number" placeholder="Transport Fee Concession" value={transportFeeConcession} onChange={(e) => setTransportFeeConcession(e.target.value)} />
            <Input type="number" placeholder="Balance" value={balance} onChange={(e) => setBalance(e.target.value)} />
            <Input type="number" placeholder="Initial Fee Amount" value={initialFeeAmount} onChange={(e) => setInitialFeeAmount(e.target.value)} />
            <Input type="date" placeholder="Initial Fee Due Date" value={initialFeeDueDate} onChange={(e) => setInitialFeeDueDate(e.target.value)} />
            <Input placeholder="Initial Fee Notes" value={initialFeeNotes} onChange={(e) => setInitialFeeNotes(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Input type="checkbox" checked={lastFeePaid} onChange={(e) => setLastFeePaid(Boolean(e.target.checked))} inputClassName="h-4 w-4" />
            Last fee paid
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder="Last Fee Paid Amount"
              value={lastFeePaidAmount}
              onChange={(e) => setLastFeePaidAmount(e.target.value)}
              disabled={!lastFeePaid}
            />
            <Input
              type="date"
              placeholder="Last Fee Paid On"
              value={lastFeePaidOn}
              onChange={(e) => setLastFeePaidOn(e.target.value)}
              disabled={!lastFeePaid}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-sm">6. Transport</h3>
          <div className="flex items-center gap-2 text-sm">
            <ToggleBox active={availTransport} onToggle={setAvailTransport}>Avail Transport</ToggleBox>
          </div>
          {availTransport ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input placeholder="Route" value={route} onChange={(e) => setRoute(e.target.value)} />
              <Input placeholder="Pickup point" value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)} />
              <Input placeholder="Dropoff point" value={dropoffPoint} onChange={(e) => setDropoffPoint(e.target.value)} />
              <Input type="number" placeholder="Transport fee" value={transportFee} onChange={(e) => setTransportFee(e.target.value)} />
            </div>
          ) : null}
        </section>

        <Button variant="primary" type="submit" className="w-full sm:w-auto" disabled={saving}>
          {saving ? 'Submitting...' : 'Submit Admission'}
        </Button>
      </form>
    </Card>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
