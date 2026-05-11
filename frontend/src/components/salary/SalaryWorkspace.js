<<<<<<< HEAD
'use client'

import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import {
  addSalaryAdvance,
  fetchSalaryRecords,
  fetchSalarySlipPdf,
  fetchSalaryStaff,
  fetchSalaryStructures,
  fetchSalarySummary,
  generateMonthlySalary,
  upsertSalaryStaff,
  upsertSalaryStructure,
  updateSalaryStatus
} from '@/services/salaryService'

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toCsv(rows) {
  const headers = ['Period', 'Name', 'Employee ID', 'Base Salary', 'Advance', 'Net Salary', 'Status']
  const lines = [headers.join(',')]
  rows.forEach((row) => {
    lines.push([
      row.periodMonth || '',
      JSON.stringify(row.name || ''),
      JSON.stringify(row.employeeId || ''),
      row.baseSalary ?? row.amount ?? 0,
      row.advanceTotal ?? 0,
      row.netSalary ?? row.amount ?? 0,
      JSON.stringify(row.status || '')
    ].join(','))
  })
  return lines.join('\n')
}

export default function SalaryWorkspace({
  roleBase = '/admin',
  title = 'Salary',
  subtitle = 'Salary management',
  showStaffManagement = false,
  showStructureManagement = false,
  showGenerate = true,
  allowPayments = true,
  showFinanceRef = false,
  reportHref = '',
  personalOnly = false
}) {
  const [summary, setSummary] = useState(null)
  const [records, setRecords] = useState([])
  const [staff, setStaff] = useState([])
  const [structures, setStructures] = useState([])
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [periodMonth, setPeriodMonth] = useState(currentMonthKey())
  const [recordQuery, setRecordQuery] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [salaryStatus, setSalaryStatus] = useState('pending')
  const [staffForm, setStaffForm] = useState({ name: '', employeeId: '', designation: '', department: '', staffType: 'teacher', monthlySalary: '', salaryStructureId: '', salaryOnly: false, advanceBalance: '', status: 'active', bankName: '', bankAccount: '', notes: '' })
  const [structureForm, setStructureForm] = useState({ name: '', staffType: 'all', baseSalary: '', allowancesTotal: '', deductionsTotal: '', active: true, notes: '' })

  async function loadAll() {
    setBusy(true)
    setError('')
    try {
      const [summaryRes, recordsRes, staffRes, structuresRes] = await Promise.all([
        fetchSalarySummary({ periodMonth }),
        fetchSalaryRecords({ periodMonth, q: recordQuery || undefined }),
        showStaffManagement ? fetchSalaryStaff({ q: recordQuery || undefined }) : Promise.resolve([]),
        showStructureManagement ? fetchSalaryStructures() : Promise.resolve([])
      ])
      setSummary(summaryRes)
      setRecords(recordsRes.records)
      setStaff(staffRes)
      setStructures(structuresRes)
      setSelectedRecordId((prev) => prev || recordsRes.records?.[0]?.id || '')
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to load salary data.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodMonth])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!busy) loadAll()
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordQuery])

  const selectedRecord = useMemo(() => records.find((row) => String(row.id) === String(selectedRecordId)) || null, [records, selectedRecordId])

  const chartData = useMemo(() => {
    if (!summary) return []
    return (summary.monthlySeries || []).map((row) => ({ name: row.name, collected: Number(row.collected || 0), payable: Number(row.payable || 0) }))
  }, [summary])

  const financeLinksEnabled = showFinanceRef && roleBase !== '/teacher'

  const quickLinks = useMemo(() => {
    const links = [
      { href: `${roleBase}/salary/records`, label: 'Records' }
    ]
    if (showStaffManagement) links.push({ href: `${roleBase}/salary/assignment`, label: 'Assignment' })
    if (showStructureManagement) links.push({ href: `${roleBase}/salary/structure`, label: 'Structure' })
    if (showGenerate) links.push({ href: `${roleBase}/salary/generate`, label: 'Generate' })
    if (allowPayments) links.push({ href: `${roleBase}/salary/payments`, label: 'Payments' })
    if (reportHref) links.push({ href: reportHref, label: 'Reports' })
    if (financeLinksEnabled) {
      if (roleBase === '/accountant') links.push({ href: '/accountant/finance/salary', label: 'Finance Salary View' })
      else links.push({ href: `${roleBase}/finance/income`, label: 'Finance Income' })
    }
    links.push({ href: `${roleBase}/salary`, label: 'Home' })
    return links
  }, [allowPayments, financeLinksEnabled, reportHref, roleBase, showGenerate, showStaffManagement, showStructureManagement])

  function resetStaffForm() {
    setStaffForm({ name: '', employeeId: '', designation: '', department: '', staffType: 'teacher', monthlySalary: '', salaryStructureId: '', salaryOnly: false, advanceBalance: '', status: 'active', bankName: '', bankAccount: '', notes: '' })
  }

  function resetStructureForm() {
    setStructureForm({ name: '', staffType: 'all', baseSalary: '', allowancesTotal: '', deductionsTotal: '', active: true, notes: '' })
  }

  async function handleGenerate() {
    try {
      setMessage('')
      setError('')
      const res = await generateMonthlySalary({ periodMonth })
      setMessage(`Generated ${res.createdCount || 0} salary slips for ${res.periodMonth || periodMonth}.`)
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to generate salary slips.')
    }
  }

  async function handleSaveStaff(event) {
    event.preventDefault()
    try {
      setMessage('')
      setError('')
      await upsertSalaryStaff(staffForm)
      setMessage('Salary staff saved successfully.')
      resetStaffForm()
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to save staff.')
    }
  }

  async function handleSaveStructure(event) {
    event.preventDefault()
    try {
      setMessage('')
      setError('')
      await upsertSalaryStructure(structureForm)
      setMessage('Salary structure saved successfully.')
      resetStructureForm()
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to save structure.')
    }
  }

  async function handleStatusChange(id, status) {
    try {
      setMessage('')
      setError('')
      await updateSalaryStatus(id, status)
      setMessage('Salary status updated.')
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update salary status.')
    }
  }

  async function handleAdvance(id) {
    const amount = Number(advanceAmount || 0)
    if (!amount) return
    try {
      setMessage('')
      setError('')
      await addSalaryAdvance(id, { amount, method: 'cash', note: 'Advance payment' })
      setMessage('Advance payment recorded.')
      setAdvanceAmount('')
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to record advance payment.')
    }
  }

  async function handleDownloadSlip(id, fileName) {
    try {
      const blob = await fetchSalarySlipPdf(id)
      downloadBlob(blob, fileName)
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to download salary slip.')
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(records)], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `salary-records-${periodMonth}.csv`)
  }

  async function exportXlsx() {
    const ws = XLSX.utils.json_to_sheet(records.map((row) => ({
      Period: row.periodMonth,
      Name: row.name,
      EmployeeId: row.employeeId,
      Designation: row.designation,
      Department: row.department,
      BaseSalary: row.baseSalary,
      Advance: row.advanceTotal,
      NetSalary: row.netSalary,
      Status: row.status
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Salary')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([wbout], { type: 'application/octet-stream' }), `salary-records-${periodMonth}.xlsx`)
  }

  function exportPdf() {
    const doc = new jsPDF('landscape', 'pt', 'a4')
    doc.setFontSize(16)
    doc.text(`${title} Reports`, 40, 40)
    doc.setFontSize(10)
    let y = 70
    records.slice(0, 25).forEach((row, index) => {
      const text = `${index + 1}. ${row.periodMonth} | ${row.name || '—'} | ${row.employeeId || '—'} | ${formatCurrency(row.netSalary)} | ${row.status}`
      doc.text(text, 40, y)
      y += 18
      if (y > 520) {
        doc.addPage()
        y = 40
      }
    })
    doc.save(`salary-records-${periodMonth}.pdf`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={loadAll} disabled={busy}>Refresh</Button>
            {showGenerate ? <Button type="button" onClick={handleGenerate} disabled={busy}>Generate Monthly</Button> : null}
          </div>
        )}
      />

      {message ? <div className="text-sm text-green-700">{message}</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><div className="text-sm text-gray-600">Staff</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.staffCount ?? 0}</div></Card>
        <Card><div className="text-sm text-gray-600">Slips</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.slipCount ?? 0}</div></Card>
        <Card><div className="text-sm text-gray-600">Paid</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.paidCount ?? 0}</div></Card>
        <Card><div className="text-sm text-gray-600">Pending</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.pendingCount ?? 0}</div></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-medium">Monthly Payroll Trend</h3>
          <div className="mt-3 h-56 overflow-auto rounded border bg-white p-3 text-sm space-y-2">
            {chartData.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3">
                <span>{row.name}</span>
                <span>{formatCurrency(row.collected)} collected / {formatCurrency(row.payable)} payable</span>
              </div>
            ))}
            {!chartData.length ? <Skeleton className="h-40" /> : null}
          </div>
        </Card>

        <Card>
          <h3 className="font-medium">Filters & Exports</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
            <Input value={recordQuery} onChange={(e) => setRecordQuery(e.target.value)} placeholder="Search salary records" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportCsv}>CSV</Button>
            <Button type="button" variant="outline" onClick={exportXlsx}>XLSX</Button>
            <Button type="button" variant="outline" onClick={exportPdf}>PDF</Button>
          </div>
          {showFinanceRef ? (
            <div className="mt-4 text-sm text-gray-600">
              Finance view is transaction based and hides teacher-name operational details.
            </div>
          ) : null}
        </Card>
      </div>

      <Card>
        <h3 className="font-medium">Quick Links</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <ButtonLink key={link.href} href={link.href} variant="outline">{link.label}</ButtonLink>
          ))}
        </div>
      </Card>

      {showStaffManagement ? (
        <Card>
          <h3 className="font-medium">Salary Staff Setup</h3>
          <form className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleSaveStaff}>
            <Input value={staffForm.name} onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Staff Name" />
            <Input value={staffForm.employeeId} onChange={(e) => setStaffForm((prev) => ({ ...prev, employeeId: e.target.value }))} placeholder="Employee ID" />
            <Input value={staffForm.designation} onChange={(e) => setStaffForm((prev) => ({ ...prev, designation: e.target.value }))} placeholder="Designation" />
            <Input value={staffForm.department} onChange={(e) => setStaffForm((prev) => ({ ...prev, department: e.target.value }))} placeholder="Department" />
            <Select value={staffForm.staffType} onChange={(e) => setStaffForm((prev) => ({ ...prev, staffType: e.target.value }))}>
              <option value="teacher">Teacher</option>
              <option value="staff">Other Staff</option>
            </Select>
            <Input type="number" value={staffForm.monthlySalary} onChange={(e) => setStaffForm((prev) => ({ ...prev, monthlySalary: e.target.value }))} placeholder="Monthly Salary" />
            <Select value={staffForm.salaryStructureId} onChange={(e) => setStaffForm((prev) => ({ ...prev, salaryStructureId: e.target.value }))}>
              <option value="">Salary Structure</option>
              {structures.map((structure) => <option key={structure.id} value={structure.id}>{structure.name}</option>)}
            </Select>
            <Input type="number" value={staffForm.advanceBalance} onChange={(e) => setStaffForm((prev) => ({ ...prev, advanceBalance: e.target.value }))} placeholder="Advance Balance" />
            <Input value={staffForm.bankName} onChange={(e) => setStaffForm((prev) => ({ ...prev, bankName: e.target.value }))} placeholder="Bank Name" />
            <Input value={staffForm.bankAccount} onChange={(e) => setStaffForm((prev) => ({ ...prev, bankAccount: e.target.value }))} placeholder="Bank Account" />
            <Input value={staffForm.notes} onChange={(e) => setStaffForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit">Save Staff</Button>
              <Button type="button" variant="outline" onClick={resetStaffForm}>Reset</Button>
            </div>
          </form>
          <div className="mt-6 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Name</th>
                  <th>Type</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2">{row.name}</td>
                    <td>{row.staffType}</td>
                    <td>{row.designation}</td>
                    <td>{formatCurrency(row.monthlySalary)}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {showStructureManagement ? (
        <Card>
          <h3 className="font-medium">Salary Structures</h3>
          <form className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleSaveStructure}>
            <Input value={structureForm.name} onChange={(e) => setStructureForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Structure Name" />
            <Select value={structureForm.staffType} onChange={(e) => setStructureForm((prev) => ({ ...prev, staffType: e.target.value }))}>
              <option value="all">All Staff</option>
              <option value="teacher">Teachers</option>
              <option value="staff">Other Staff</option>
            </Select>
            <Input type="number" value={structureForm.baseSalary} onChange={(e) => setStructureForm((prev) => ({ ...prev, baseSalary: e.target.value }))} placeholder="Base Salary" />
            <Input type="number" value={structureForm.allowancesTotal} onChange={(e) => setStructureForm((prev) => ({ ...prev, allowancesTotal: e.target.value }))} placeholder="Allowances" />
            <Input type="number" value={structureForm.deductionsTotal} onChange={(e) => setStructureForm((prev) => ({ ...prev, deductionsTotal: e.target.value }))} placeholder="Deductions" />
            <Input value={structureForm.notes} onChange={(e) => setStructureForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit">Save Structure</Button>
              <Button type="button" variant="outline" onClick={resetStructureForm}>Reset</Button>
            </div>
          </form>
          <div className="mt-6 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Name</th>
                  <th>Type</th>
                  <th>Base</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2">{row.name}</td>
                    <td>{row.staffType}</td>
                    <td>{formatCurrency(row.baseSalary)}</td>
                    <td>{formatCurrency(row.allowancesTotal)}</td>
                    <td>{formatCurrency(row.deductionsTotal)}</td>
                    <td>{row.active ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">Salary Records</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => loadAll()}>Reload</Button>
          </div>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Period</th>
                {personalOnly ? null : <th>Name</th>}
                {personalOnly ? null : <th>Employee ID</th>}
                <th>Net Salary</th>
                <th>Advance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id} className="border-b last:border-none">
                  <td className="py-2">{row.periodMonth}</td>
                  {personalOnly ? null : <td>{row.name || '—'}</td>}
                  {personalOnly ? null : <td>{row.employeeId || '—'}</td>}
                  <td>{formatCurrency(row.netSalary ?? row.amount)}</td>
                  <td>{formatCurrency(row.advanceTotal)}</td>
                  <td>{row.status}</td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      {selectedRecordId === row.id && allowPayments ? (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(row.id, 'paid')}>Mark Paid</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(row.id, 'pending')}>Mark Pending</Button>
                          {showStaffManagement ? (
                            <>
                              <Input className="w-28" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Advance" />
                              <Button type="button" variant="outline" size="sm" onClick={() => handleAdvance(row.id)}>Add Advance</Button>
                            </>
                          ) : null}
                        </>
                      ) : null}
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRecordId(row.id)}>Select</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadSlip(row.id, `salary-slip-${row.periodMonth}.pdf`)}>PDF</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showFinanceRef ? (
        <Card>
          <h3 className="font-medium">Finance Reference</h3>
          <p className="mt-2 text-sm text-gray-600">Salary transactions are presented as operational credit/liability references without editing teacher payroll details.</p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <ButtonLink href="/admin/finance/income" variant="outline">Income Reference</ButtonLink>
            <ButtonLink href="/admin/finance/reports" variant="outline">Finance Reports</ButtonLink>
            <ButtonLink href="/admin/finance/categories" variant="outline">Finance Categories</ButtonLink>
          </div>
        </Card>
      ) : null}
    </div>
  )
=======
'use client'

import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import { Button, ButtonLink, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import {
  addSalaryAdvance,
  fetchSalaryRecords,
  fetchSalarySlipPdf,
  fetchSalaryStaff,
  fetchSalaryStructures,
  fetchSalarySummary,
  generateMonthlySalary,
  upsertSalaryStaff,
  upsertSalaryStructure,
  updateSalaryStatus
} from '@/services/salaryService'

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function toCsv(rows) {
  const headers = ['Period', 'Name', 'Employee ID', 'Base Salary', 'Advance', 'Net Salary', 'Status']
  const lines = [headers.join(',')]
  rows.forEach((row) => {
    lines.push([
      row.periodMonth || '',
      JSON.stringify(row.name || ''),
      JSON.stringify(row.employeeId || ''),
      row.baseSalary ?? row.amount ?? 0,
      row.advanceTotal ?? 0,
      row.netSalary ?? row.amount ?? 0,
      JSON.stringify(row.status || '')
    ].join(','))
  })
  return lines.join('\n')
}

export default function SalaryWorkspace({
  roleBase = '/admin',
  title = 'Salary',
  subtitle = 'Salary management',
  showStaffManagement = false,
  showStructureManagement = false,
  showGenerate = true,
  allowPayments = true,
  showFinanceRef = false,
  reportHref = '',
  personalOnly = false
}) {
  const [summary, setSummary] = useState(null)
  const [records, setRecords] = useState([])
  const [staff, setStaff] = useState([])
  const [structures, setStructures] = useState([])
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [periodMonth, setPeriodMonth] = useState(currentMonthKey())
  const [recordQuery, setRecordQuery] = useState('')
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState('')
  const [salaryStatus, setSalaryStatus] = useState('pending')
  const [staffForm, setStaffForm] = useState({ name: '', employeeId: '', designation: '', department: '', staffType: 'teacher', monthlySalary: '', salaryStructureId: '', salaryOnly: false, advanceBalance: '', status: 'active', bankName: '', bankAccount: '', notes: '' })
  const [structureForm, setStructureForm] = useState({ name: '', staffType: 'all', baseSalary: '', allowancesTotal: '', deductionsTotal: '', active: true, notes: '' })

  async function loadAll() {
    setBusy(true)
    setError('')
    try {
      const [summaryRes, recordsRes, staffRes, structuresRes] = await Promise.all([
        fetchSalarySummary({ periodMonth }),
        fetchSalaryRecords({ periodMonth, q: recordQuery || undefined }),
        showStaffManagement ? fetchSalaryStaff({ q: recordQuery || undefined }) : Promise.resolve([]),
        showStructureManagement ? fetchSalaryStructures() : Promise.resolve([])
      ])
      setSummary(summaryRes)
      setRecords(recordsRes.records)
      setStaff(staffRes)
      setStructures(structuresRes)
      setSelectedRecordId((prev) => prev || recordsRes.records?.[0]?.id || '')
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to load salary data.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodMonth])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!busy) loadAll()
    }, 350)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordQuery])

  const selectedRecord = useMemo(() => records.find((row) => String(row.id) === String(selectedRecordId)) || null, [records, selectedRecordId])

  const chartData = useMemo(() => {
    if (!summary) return []
    return (summary.monthlySeries || []).map((row) => ({ name: row.name, collected: Number(row.collected || 0), payable: Number(row.payable || 0) }))
  }, [summary])

  const financeLinksEnabled = showFinanceRef && roleBase !== '/teacher'

  const quickLinks = useMemo(() => {
    const links = [
      { href: `${roleBase}/salary/records`, label: 'Records' }
    ]
    if (showStaffManagement) links.push({ href: `${roleBase}/salary/assignment`, label: 'Assignment' })
    if (showStructureManagement) links.push({ href: `${roleBase}/salary/structure`, label: 'Structure' })
    if (showGenerate) links.push({ href: `${roleBase}/salary/generate`, label: 'Generate' })
    if (allowPayments) links.push({ href: `${roleBase}/salary/payments`, label: 'Payments' })
    if (reportHref) links.push({ href: reportHref, label: 'Reports' })
    if (financeLinksEnabled) {
      if (roleBase === '/accountant') links.push({ href: '/accountant/finance/salary', label: 'Finance Salary View' })
      else links.push({ href: `${roleBase}/finance/income`, label: 'Finance Income' })
    }
    links.push({ href: `${roleBase}/salary`, label: 'Home' })
    return links
  }, [allowPayments, financeLinksEnabled, reportHref, roleBase, showGenerate, showStaffManagement, showStructureManagement])

  function resetStaffForm() {
    setStaffForm({ name: '', employeeId: '', designation: '', department: '', staffType: 'teacher', monthlySalary: '', salaryStructureId: '', salaryOnly: false, advanceBalance: '', status: 'active', bankName: '', bankAccount: '', notes: '' })
  }

  function resetStructureForm() {
    setStructureForm({ name: '', staffType: 'all', baseSalary: '', allowancesTotal: '', deductionsTotal: '', active: true, notes: '' })
  }

  async function handleGenerate() {
    try {
      setMessage('')
      setError('')
      const res = await generateMonthlySalary({ periodMonth })
      setMessage(`Generated ${res.createdCount || 0} salary slips for ${res.periodMonth || periodMonth}.`)
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to generate salary slips.')
    }
  }

  async function handleSaveStaff(event) {
    event.preventDefault()
    try {
      setMessage('')
      setError('')
      await upsertSalaryStaff(staffForm)
      setMessage('Salary staff saved successfully.')
      resetStaffForm()
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to save staff.')
    }
  }

  async function handleSaveStructure(event) {
    event.preventDefault()
    try {
      setMessage('')
      setError('')
      await upsertSalaryStructure(structureForm)
      setMessage('Salary structure saved successfully.')
      resetStructureForm()
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to save structure.')
    }
  }

  async function handleStatusChange(id, status) {
    try {
      setMessage('')
      setError('')
      await updateSalaryStatus(id, status)
      setMessage('Salary status updated.')
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to update salary status.')
    }
  }

  async function handleAdvance(id) {
    const amount = Number(advanceAmount || 0)
    if (!amount) return
    try {
      setMessage('')
      setError('')
      await addSalaryAdvance(id, { amount, method: 'cash', note: 'Advance payment' })
      setMessage('Advance payment recorded.')
      setAdvanceAmount('')
      await loadAll()
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to record advance payment.')
    }
  }

  async function handleDownloadSlip(id, fileName) {
    try {
      const blob = await fetchSalarySlipPdf(id)
      downloadBlob(blob, fileName)
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to download salary slip.')
    }
  }

  function exportCsv() {
    const blob = new Blob([toCsv(records)], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `salary-records-${periodMonth}.csv`)
  }

  async function exportXlsx() {
    const ws = XLSX.utils.json_to_sheet(records.map((row) => ({
      Period: row.periodMonth,
      Name: row.name,
      EmployeeId: row.employeeId,
      Designation: row.designation,
      Department: row.department,
      BaseSalary: row.baseSalary,
      Advance: row.advanceTotal,
      NetSalary: row.netSalary,
      Status: row.status
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Salary')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    downloadBlob(new Blob([wbout], { type: 'application/octet-stream' }), `salary-records-${periodMonth}.xlsx`)
  }

  function exportPdf() {
    const doc = new jsPDF('landscape', 'pt', 'a4')
    doc.setFontSize(16)
    doc.text(`${title} Reports`, 40, 40)
    doc.setFontSize(10)
    let y = 70
    records.slice(0, 25).forEach((row, index) => {
      const text = `${index + 1}. ${row.periodMonth} | ${row.name || '—'} | ${row.employeeId || '—'} | ${formatCurrency(row.netSalary)} | ${row.status}`
      doc.text(text, 40, y)
      y += 18
      if (y > 520) {
        doc.addPage()
        y = 40
      }
    })
    doc.save(`salary-records-${periodMonth}.pdf`)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        subtitle={subtitle}
        right={(
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={loadAll} disabled={busy}>Refresh</Button>
            {showGenerate ? <Button type="button" onClick={handleGenerate} disabled={busy}>Generate Monthly</Button> : null}
          </div>
        )}
      />

      {message ? <div className="text-sm text-green-700">{message}</div> : null}
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><div className="text-sm text-gray-600">Staff</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.staffCount ?? 0}</div></Card>
        <Card><div className="text-sm text-gray-600">Slips</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.slipCount ?? 0}</div></Card>
        <Card><div className="text-sm text-gray-600">Paid</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.paidCount ?? 0}</div></Card>
        <Card><div className="text-sm text-gray-600">Pending</div><div className="text-xl font-semibold mt-1">{busy ? '...' : summary?.pendingCount ?? 0}</div></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-medium">Monthly Payroll Trend</h3>
          <div className="mt-3 h-56 overflow-auto rounded border bg-white p-3 text-sm space-y-2">
            {chartData.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3">
                <span>{row.name}</span>
                <span>{formatCurrency(row.collected)} collected / {formatCurrency(row.payable)} payable</span>
              </div>
            ))}
            {!chartData.length ? <Skeleton className="h-40" /> : null}
          </div>
        </Card>

        <Card>
          <h3 className="font-medium">Filters & Exports</h3>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input type="month" value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)} />
            <Input value={recordQuery} onChange={(e) => setRecordQuery(e.target.value)} placeholder="Search salary records" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportCsv}>CSV</Button>
            <Button type="button" variant="outline" onClick={exportXlsx}>XLSX</Button>
            <Button type="button" variant="outline" onClick={exportPdf}>PDF</Button>
          </div>
          {showFinanceRef ? (
            <div className="mt-4 text-sm text-gray-600">
              Finance view is transaction based and hides teacher-name operational details.
            </div>
          ) : null}
        </Card>
      </div>

      <Card>
        <h3 className="font-medium">Quick Links</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {quickLinks.map((link) => (
            <ButtonLink key={link.href} href={link.href} variant="outline">{link.label}</ButtonLink>
          ))}
        </div>
      </Card>

      {showStaffManagement ? (
        <Card>
          <h3 className="font-medium">Salary Staff Setup</h3>
          <form className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleSaveStaff}>
            <Input value={staffForm.name} onChange={(e) => setStaffForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Staff Name" />
            <Input value={staffForm.employeeId} onChange={(e) => setStaffForm((prev) => ({ ...prev, employeeId: e.target.value }))} placeholder="Employee ID" />
            <Input value={staffForm.designation} onChange={(e) => setStaffForm((prev) => ({ ...prev, designation: e.target.value }))} placeholder="Designation" />
            <Input value={staffForm.department} onChange={(e) => setStaffForm((prev) => ({ ...prev, department: e.target.value }))} placeholder="Department" />
            <Select value={staffForm.staffType} onChange={(e) => setStaffForm((prev) => ({ ...prev, staffType: e.target.value }))}>
              <option value="teacher">Teacher</option>
              <option value="staff">Other Staff</option>
            </Select>
            <Input type="number" value={staffForm.monthlySalary} onChange={(e) => setStaffForm((prev) => ({ ...prev, monthlySalary: e.target.value }))} placeholder="Monthly Salary" />
            <Select value={staffForm.salaryStructureId} onChange={(e) => setStaffForm((prev) => ({ ...prev, salaryStructureId: e.target.value }))}>
              <option value="">Salary Structure</option>
              {structures.map((structure) => <option key={structure.id} value={structure.id}>{structure.name}</option>)}
            </Select>
            <Input type="number" value={staffForm.advanceBalance} onChange={(e) => setStaffForm((prev) => ({ ...prev, advanceBalance: e.target.value }))} placeholder="Advance Balance" />
            <Input value={staffForm.bankName} onChange={(e) => setStaffForm((prev) => ({ ...prev, bankName: e.target.value }))} placeholder="Bank Name" />
            <Input value={staffForm.bankAccount} onChange={(e) => setStaffForm((prev) => ({ ...prev, bankAccount: e.target.value }))} placeholder="Bank Account" />
            <Input value={staffForm.notes} onChange={(e) => setStaffForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit">Save Staff</Button>
              <Button type="button" variant="outline" onClick={resetStaffForm}>Reset</Button>
            </div>
          </form>
          <div className="mt-6 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Name</th>
                  <th>Type</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2">{row.name}</td>
                    <td>{row.staffType}</td>
                    <td>{row.designation}</td>
                    <td>{formatCurrency(row.monthlySalary)}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {showStructureManagement ? (
        <Card>
          <h3 className="font-medium">Salary Structures</h3>
          <form className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3" onSubmit={handleSaveStructure}>
            <Input value={structureForm.name} onChange={(e) => setStructureForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Structure Name" />
            <Select value={structureForm.staffType} onChange={(e) => setStructureForm((prev) => ({ ...prev, staffType: e.target.value }))}>
              <option value="all">All Staff</option>
              <option value="teacher">Teachers</option>
              <option value="staff">Other Staff</option>
            </Select>
            <Input type="number" value={structureForm.baseSalary} onChange={(e) => setStructureForm((prev) => ({ ...prev, baseSalary: e.target.value }))} placeholder="Base Salary" />
            <Input type="number" value={structureForm.allowancesTotal} onChange={(e) => setStructureForm((prev) => ({ ...prev, allowancesTotal: e.target.value }))} placeholder="Allowances" />
            <Input type="number" value={structureForm.deductionsTotal} onChange={(e) => setStructureForm((prev) => ({ ...prev, deductionsTotal: e.target.value }))} placeholder="Deductions" />
            <Input value={structureForm.notes} onChange={(e) => setStructureForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notes" />
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit">Save Structure</Button>
              <Button type="button" variant="outline" onClick={resetStructureForm}>Reset</Button>
            </div>
          </form>
          <div className="mt-6 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Name</th>
                  <th>Type</th>
                  <th>Base</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2">{row.name}</td>
                    <td>{row.staffType}</td>
                    <td>{formatCurrency(row.baseSalary)}</td>
                    <td>{formatCurrency(row.allowancesTotal)}</td>
                    <td>{formatCurrency(row.deductionsTotal)}</td>
                    <td>{row.active ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium">Salary Records</h3>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => loadAll()}>Reload</Button>
          </div>
        </div>
        <div className="mt-4 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Period</th>
                {personalOnly ? null : <th>Name</th>}
                {personalOnly ? null : <th>Employee ID</th>}
                <th>Net Salary</th>
                <th>Advance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id} className="border-b last:border-none">
                  <td className="py-2">{row.periodMonth}</td>
                  {personalOnly ? null : <td>{row.name || '—'}</td>}
                  {personalOnly ? null : <td>{row.employeeId || '—'}</td>}
                  <td>{formatCurrency(row.netSalary ?? row.amount)}</td>
                  <td>{formatCurrency(row.advanceTotal)}</td>
                  <td>{row.status}</td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end flex-wrap">
                      {selectedRecordId === row.id && allowPayments ? (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(row.id, 'paid')}>Mark Paid</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => handleStatusChange(row.id, 'pending')}>Mark Pending</Button>
                          {showStaffManagement ? (
                            <>
                              <Input className="w-28" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} placeholder="Advance" />
                              <Button type="button" variant="outline" size="sm" onClick={() => handleAdvance(row.id)}>Add Advance</Button>
                            </>
                          ) : null}
                        </>
                      ) : null}
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelectedRecordId(row.id)}>Select</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => handleDownloadSlip(row.id, `salary-slip-${row.periodMonth}.pdf`)}>PDF</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showFinanceRef ? (
        <Card>
          <h3 className="font-medium">Finance Reference</h3>
          <p className="mt-2 text-sm text-gray-600">Salary transactions are presented as operational credit/liability references without editing teacher payroll details.</p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <ButtonLink href="/admin/finance/income" variant="outline">Income Reference</ButtonLink>
            <ButtonLink href="/admin/finance/reports" variant="outline">Finance Reports</ButtonLink>
            <ButtonLink href="/admin/finance/categories" variant="outline">Finance Categories</ButtonLink>
          </div>
        </Card>
      ) : null}
    </div>
  )
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
}