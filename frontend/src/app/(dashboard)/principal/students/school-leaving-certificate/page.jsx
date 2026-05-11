<<<<<<< HEAD
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StudentSearchPicker from '@/components/students/StudentSearchPicker'
import studentsService from '@/services/studentsService'
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
  Textarea,
} from '@/components/ui'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

export default function SchoolLeavingCertificatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStudentId = (searchParams.get('studentId') || '').trim()
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().slice(0, 10))
  const [conduct, setConduct] = useState('Good')
  const [reason, setReason] = useState('Completed schooling')
  const [remarks, setRemarks] = useState('Eligible for further studies.')
  const [busy, setBusy] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [markAsAlumni, setMarkAsAlumni] = useState(true)

  useEffect(() => {
    if (!preselectedStudentId) return
    if (selectedStudent?._id === preselectedStudentId) return

    let active = true
    ;(async () => {
      try {
        const { student } = await studentsService.getStudentById(preselectedStudentId)
        if (!active || !student) return

        setSelectedStudent({
          _id: student._id,
          studentId: student.studentId,
          registrationNumber: student.registrationNumber,
          class: student.class,
          section: student.section,
          name: student?.user?.name || student.name || 'Unknown Student'
        })
      } catch {
        // Keep page interactive even if deep-link prefill fails.
      }
    })()

    return () => {
      active = false
    }
  }, [preselectedStudentId, selectedStudent?._id])

  const certificateData = useMemo(() => ({
    studentName: selectedStudent?.name || '-',
    studentId: selectedStudent?.studentId || '-',
    registrationNumber: selectedStudent?.registrationNumber || '-',
    classSection: [selectedStudent?.class, selectedStudent?.section].filter(Boolean).join(' - ') || '-',
    leavingDate: formatDate(leavingDate),
    conduct: conduct || '-',
    reason: reason || '-',
    remarks: remarks || '-',
  }), [conduct, leavingDate, reason, remarks, selectedStudent])

  useEffect(() => {
    if (!selectedStudent?._id) {
      setHistory([])
      return
    }
    loadHistory(selectedStudent._id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?._id])

  async function loadHistory(studentDbId) {
    setHistoryLoading(true)
    try {
      const { certificates } = await studentsService.listStudentCertificates(studentDbId, {
        type: 'slc',
        limit: 10,
      })
      setHistory(Array.isArray(certificates) ? certificates : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function downloadCertificateById(certificateId, certificateNumber) {
    const blob = await studentsService.downloadCertificatePdf(certificateId)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${certificateNumber || 'school-leaving-certificate'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function issueAndDownloadCertificate() {
    if (!selectedStudent?._id) {
      setError('Please select a student first')
      setSuccess('')
      return
    }
    setShowConfirmation(true)
  }

  async function confirmAndIssue() {
    setShowConfirmation(false)
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        type: 'slc',
        studentId: selectedStudent._id,
        issueDate: leavingDate,
        leavingDate,
        conduct,
        reason,
        remarks,
        markAsAlumni,
      }

      const { certificate } = await studentsService.generateCertificate(payload)
      await downloadCertificateById(certificate?._id, certificate?.certificateNumber)
      router.push('/principal/students')
      setMarkAsAlumni(true)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to issue and download school leaving certificate')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Leaving Certificate"
        subtitle="Issue, store, and download beautifully formatted school leaving certificates as PDF."
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card>
        <h2 className="font-medium">Select Student</h2>
        <p className="text-sm text-gray-600 mt-1">Search and select a student for certificate issuance.</p>
        <div className="mt-4">
          <StudentSearchPicker selectedStudent={selectedStudent} onSelect={setSelectedStudent} />
        </div>
      </Card>

      <Card>
        <h2 className="font-medium">Certificate Details</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input type="date" label="Leaving Date" value={leavingDate} onChange={(e) => setLeavingDate(e.target.value)} />
          <Select label="Conduct" value={conduct} onChange={(e) => setConduct(e.target.value)}>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Satisfactory">Satisfactory</option>
          </Select>
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leaving" />
        </div>
        <div className="mt-3">
          <Textarea
            label="Remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional notes"
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="font-medium">Certificate Preview</h2>
            <p className="text-sm text-gray-600 mt-1">Styled institutional preview. Issuance and storage happens when you generate PDF.</p>
          </div>
          <div className="flex gap-2 no-print">
            <Button type="button" variant="primary" onClick={issueAndDownloadCertificate} disabled={!selectedStudent || busy}>
              {busy ? 'Issuing PDF...' : 'Issue & Download PDF'}
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-8 text-sm leading-7 shadow-inner">
          <div className="mx-auto max-w-3xl rounded-lg border-2 border-blue-700 bg-white px-4 sm:px-10 py-6 sm:py-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full border-2 border-blue-700 bg-blue-50" />
              <p className="text-xs tracking-[0.22em] text-slate-500">EDUNEXUS INSTITUTIONAL CERTIFICATION</p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-semibold uppercase tracking-wider text-blue-800">School Leaving Certificate</h3>
            </div>

            <p className="text-center italic text-slate-700">
              This is to certify that the following learner has formally completed or left studies at this institution.
            </p>

            <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
              <p><span className="font-semibold text-slate-800">Student Name:</span> {certificateData.studentName}</p>
              <p><span className="font-semibold text-slate-800">Student ID:</span> {certificateData.studentId}</p>
              <p><span className="font-semibold text-slate-800">Registration #:</span> {certificateData.registrationNumber}</p>
              <p><span className="font-semibold text-slate-800">Last Class-Section:</span> {certificateData.classSection}</p>
              <p><span className="font-semibold text-slate-800">Leaving Date:</span> {certificateData.leavingDate}</p>
              <p><span className="font-semibold text-slate-800">Conduct:</span> {certificateData.conduct}</p>
              <p><span className="font-semibold text-slate-800">Reason:</span> {certificateData.reason}</p>
              <p><span className="font-semibold text-slate-800">Remarks:</span> {certificateData.remarks}</p>
            </div>

            <div className="mt-10 flex items-center justify-between text-slate-700">
              <p className="border-t border-slate-400 pt-1">Prepared By</p>
              <p className="border-t border-slate-400 pt-1">Principal Signature</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-medium">Issuance History</h2>
        <p className="text-sm text-gray-600 mt-1">Stored school leaving certificates for this selected student.</p>

        <div className="mt-4">
          {historyLoading ? (
            <Skeleton className="h-24" />
          ) : history.length === 0 ? (
            <EmptyState title="No school leaving certificates issued yet" />
          ) : (
            <Table>
              <TableRoot>
                <TableHead>
                  <TableRow>
                    <TableHeader>Certificate #</TableHeader>
                    <TableHeader>Issue Date</TableHeader>
                    <TableHeader>Issued By</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{row.certificateNumber || '-'}</TableCell>
                      <TableCell>{formatDate(row.issueDate)}</TableCell>
                      <TableCell>{row?.issuedBy?.name || '-'}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCertificateById(row._id, row.certificateNumber)}
                        >
                          Download PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </Table>
          )}
        </div>
      </Card>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="max-w-md w-full m-4">
            <h2 className="font-semibold text-lg">Confirm Certificate Issuance</h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to issue this school leaving certificate for <strong>{selectedStudent?.name}</strong>?
            </p>
            
            <div className="mt-4 flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                checked={markAsAlumni}
                onChange={(e) => setMarkAsAlumni(e.target.checked)}
                className="mt-1"
              />
              <label className="text-sm cursor-pointer">
                <span className="font-medium">Mark as Alumni & Deactivate User</span>
                <p className="text-gray-600 text-xs mt-1">This will set the student status to alumni and deactivate their user account.</p>
              </label>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={confirmAndIssue}
                disabled={busy}
              >
                {busy ? 'Processing...' : 'Confirm & Issue'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
=======
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import StudentSearchPicker from '@/components/students/StudentSearchPicker'
import studentsService from '@/services/studentsService'
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
  Textarea,
} from '@/components/ui'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString()
}

export default function SchoolLeavingCertificatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedStudentId = (searchParams.get('studentId') || '').trim()
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [leavingDate, setLeavingDate] = useState(new Date().toISOString().slice(0, 10))
  const [conduct, setConduct] = useState('Good')
  const [reason, setReason] = useState('Completed schooling')
  const [remarks, setRemarks] = useState('Eligible for further studies.')
  const [busy, setBusy] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [markAsAlumni, setMarkAsAlumni] = useState(true)

  useEffect(() => {
    if (!preselectedStudentId) return
    if (selectedStudent?._id === preselectedStudentId) return

    let active = true
    ;(async () => {
      try {
        const { student } = await studentsService.getStudentById(preselectedStudentId)
        if (!active || !student) return

        setSelectedStudent({
          _id: student._id,
          studentId: student.studentId,
          registrationNumber: student.registrationNumber,
          class: student.class,
          section: student.section,
          name: student?.user?.name || student.name || 'Unknown Student'
        })
      } catch {
        // Keep page interactive even if deep-link prefill fails.
      }
    })()

    return () => {
      active = false
    }
  }, [preselectedStudentId, selectedStudent?._id])

  const certificateData = useMemo(() => ({
    studentName: selectedStudent?.name || '-',
    studentId: selectedStudent?.studentId || '-',
    registrationNumber: selectedStudent?.registrationNumber || '-',
    classSection: [selectedStudent?.class, selectedStudent?.section].filter(Boolean).join(' - ') || '-',
    leavingDate: formatDate(leavingDate),
    conduct: conduct || '-',
    reason: reason || '-',
    remarks: remarks || '-',
  }), [conduct, leavingDate, reason, remarks, selectedStudent])

  useEffect(() => {
    if (!selectedStudent?._id) {
      setHistory([])
      return
    }
    loadHistory(selectedStudent._id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStudent?._id])

  async function loadHistory(studentDbId) {
    setHistoryLoading(true)
    try {
      const { certificates } = await studentsService.listStudentCertificates(studentDbId, {
        type: 'slc',
        limit: 10,
      })
      setHistory(Array.isArray(certificates) ? certificates : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function downloadCertificateById(certificateId, certificateNumber) {
    const blob = await studentsService.downloadCertificatePdf(certificateId)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${certificateNumber || 'school-leaving-certificate'}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function issueAndDownloadCertificate() {
    if (!selectedStudent?._id) {
      setError('Please select a student first')
      setSuccess('')
      return
    }
    setShowConfirmation(true)
  }

  async function confirmAndIssue() {
    setShowConfirmation(false)
    setBusy(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        type: 'slc',
        studentId: selectedStudent._id,
        issueDate: leavingDate,
        leavingDate,
        conduct,
        reason,
        remarks,
        markAsAlumni,
      }

      const { certificate } = await studentsService.generateCertificate(payload)
      await downloadCertificateById(certificate?._id, certificate?.certificateNumber)
      router.push('/principal/students')
      setMarkAsAlumni(true)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to issue and download school leaving certificate')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Leaving Certificate"
        subtitle="Issue, store, and download beautifully formatted school leaving certificates as PDF."
      />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card>
        <h2 className="font-medium">Select Student</h2>
        <p className="text-sm text-gray-600 mt-1">Search and select a student for certificate issuance.</p>
        <div className="mt-4">
          <StudentSearchPicker selectedStudent={selectedStudent} onSelect={setSelectedStudent} />
        </div>
      </Card>

      <Card>
        <h2 className="font-medium">Certificate Details</h2>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input type="date" label="Leaving Date" value={leavingDate} onChange={(e) => setLeavingDate(e.target.value)} />
          <Select label="Conduct" value={conduct} onChange={(e) => setConduct(e.target.value)}>
            <option value="Excellent">Excellent</option>
            <option value="Very Good">Very Good</option>
            <option value="Good">Good</option>
            <option value="Satisfactory">Satisfactory</option>
          </Select>
          <Input label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leaving" />
        </div>
        <div className="mt-3">
          <Textarea
            label="Remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional notes"
          />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="font-medium">Certificate Preview</h2>
            <p className="text-sm text-gray-600 mt-1">Styled institutional preview. Issuance and storage happens when you generate PDF.</p>
          </div>
          <div className="flex gap-2 no-print">
            <Button type="button" variant="primary" onClick={issueAndDownloadCertificate} disabled={!selectedStudent || busy}>
              {busy ? 'Issuing PDF...' : 'Issue & Download PDF'}
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-300 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-8 text-sm leading-7 shadow-inner">
          <div className="mx-auto max-w-3xl rounded-lg border-2 border-blue-700 bg-white px-4 sm:px-10 py-6 sm:py-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 h-14 w-14 rounded-full border-2 border-blue-700 bg-blue-50" />
              <p className="text-xs tracking-[0.22em] text-slate-500">EDUNEXUS INSTITUTIONAL CERTIFICATION</p>
              <h3 className="mt-2 text-2xl sm:text-3xl font-semibold uppercase tracking-wider text-blue-800">School Leaving Certificate</h3>
            </div>

            <p className="text-center italic text-slate-700">
              This is to certify that the following learner has formally completed or left studies at this institution.
            </p>

            <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
              <p><span className="font-semibold text-slate-800">Student Name:</span> {certificateData.studentName}</p>
              <p><span className="font-semibold text-slate-800">Student ID:</span> {certificateData.studentId}</p>
              <p><span className="font-semibold text-slate-800">Registration #:</span> {certificateData.registrationNumber}</p>
              <p><span className="font-semibold text-slate-800">Last Class-Section:</span> {certificateData.classSection}</p>
              <p><span className="font-semibold text-slate-800">Leaving Date:</span> {certificateData.leavingDate}</p>
              <p><span className="font-semibold text-slate-800">Conduct:</span> {certificateData.conduct}</p>
              <p><span className="font-semibold text-slate-800">Reason:</span> {certificateData.reason}</p>
              <p><span className="font-semibold text-slate-800">Remarks:</span> {certificateData.remarks}</p>
            </div>

            <div className="mt-10 flex items-center justify-between text-slate-700">
              <p className="border-t border-slate-400 pt-1">Prepared By</p>
              <p className="border-t border-slate-400 pt-1">Principal Signature</p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="font-medium">Issuance History</h2>
        <p className="text-sm text-gray-600 mt-1">Stored school leaving certificates for this selected student.</p>

        <div className="mt-4">
          {historyLoading ? (
            <Skeleton className="h-24" />
          ) : history.length === 0 ? (
            <EmptyState title="No school leaving certificates issued yet" />
          ) : (
            <Table>
              <TableRoot>
                <TableHead>
                  <TableRow>
                    <TableHeader>Certificate #</TableHeader>
                    <TableHeader>Issue Date</TableHeader>
                    <TableHeader>Issued By</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row._id}>
                      <TableCell>{row.certificateNumber || '-'}</TableCell>
                      <TableCell>{formatDate(row.issueDate)}</TableCell>
                      <TableCell>{row?.issuedBy?.name || '-'}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => downloadCertificateById(row._id, row.certificateNumber)}
                        >
                          Download PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableRoot>
            </Table>
          )}
        </div>
      </Card>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card className="max-w-md w-full m-4">
            <h2 className="font-semibold text-lg">Confirm Certificate Issuance</h2>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to issue this school leaving certificate for <strong>{selectedStudent?.name}</strong>?
            </p>
            
            <div className="mt-4 flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                checked={markAsAlumni}
                onChange={(e) => setMarkAsAlumni(e.target.checked)}
                className="mt-1"
              />
              <label className="text-sm cursor-pointer">
                <span className="font-medium">Mark as Alumni & Deactivate User</span>
                <p className="text-gray-600 text-xs mt-1">This will set the student status to alumni and deactivate their user account.</p>
              </label>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={confirmAndIssue}
                disabled={busy}
              >
                {busy ? 'Processing...' : 'Confirm & Issue'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
