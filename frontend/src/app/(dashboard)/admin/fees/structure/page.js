"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import { Button, Card, Input, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRoot, TableRow } from '@/components/ui'

export default function FeeStructurePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [classes, setClasses] = useState([])
  const [levelFeeMap, setLevelFeeMap] = useState({
    'pre-primary': '',
    primary: '',
    middle: '',
    high: ''
  })
  const [otherFeeDefaults, setOtherFeeDefaults] = useState({
    admissionFee: '',
    registrationFee: '',
    stationeryFee: '',
    annualFee: ''
  })

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const { classes: list } = await classesService.listClasses()
      const rows = Array.isArray(list) ? list : []
      setClasses(rows)

      const grouped = { 'pre-primary': '', primary: '', middle: '', high: '' }
      rows.forEach((c) => {
        if (c?.level && grouped[c.level] === '' && Number.isFinite(Number(c.tutionFee))) {
          grouped[c.level] = String(c.tutionFee)
        }
      })
      setLevelFeeMap(grouped)

      const first = rows[0] || {}
      setOtherFeeDefaults({
        admissionFee: String(first?.admissionFee ?? 0),
        registrationFee: String(first?.registrationFee ?? 0),
        stationeryFee: String(first?.stationeryFee ?? 0),
        annualFee: String(first?.annualFee ?? 0)
      })
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load fee structure')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const classesByLevel = useMemo(() => {
    return ['pre-primary', 'primary', 'middle', 'high'].reduce((acc, level) => {
      acc[level] = classes.filter((c) => c.level === level)
      return acc
    }, {})
  }, [classes])

  async function saveClassFee(classId, fee) {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await classesService.updateClass(classId, { tutionFee: Number(fee || 0) })
      setSuccess('Fee structure updated')
      await loadData()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to update class fee')
    } finally {
      setSaving(false)
    }
  }

  async function applyLevelFee(level) {
    const fee = Number(levelFeeMap[level] || 0)
    const rows = classesByLevel[level] || []
    if (rows.length === 0) {
      setError(`No classes found for level: ${level}`)
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await Promise.all(rows.map((c) => classesService.updateClass(c._id, { tutionFee: fee })))
      setSuccess(`Applied ${fee} to all ${level} classes`)
      await loadData()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to apply level fee')
    } finally {
      setSaving(false)
    }
  }

  async function applyOtherFeesDefaults() {
    if (!Array.isArray(classes) || classes.length === 0) {
      setError('No classes found to apply other fees defaults')
      return
    }

    const payload = {
      admissionFee: Number(otherFeeDefaults.admissionFee || 0),
      registrationFee: Number(otherFeeDefaults.registrationFee || 0),
      stationeryFee: Number(otherFeeDefaults.stationeryFee || 0),
      annualFee: Number(otherFeeDefaults.annualFee || 0)
    }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await Promise.all(classes.map((c) => classesService.updateClass(c._id, payload)))
      setSuccess('Other fees defaults applied to all classes')
      await loadData()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to apply other fees defaults')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fee Structure" subtitle="Manage tuition fee by class and level." />

      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-700">{success}</div> : null}

      <Card>
        <h3 className="font-medium">Apply By Level</h3>
        <p className="text-sm text-gray-600 mt-1">Set one tuition fee value for all classes in a level.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {['pre-primary', 'primary', 'middle', 'high'].map((level) => (
            <div key={level} className="border rounded p-3">
              <div className="text-sm font-medium capitalize">{level}</div>
              <div className="mt-2 flex gap-2 items-center">
                <Input
                  type="number"
                  value={levelFeeMap[level]}
                  onChange={(e) => setLevelFeeMap((prev) => ({ ...prev, [level]: e.target.value }))}
                  placeholder="Tuition fee"
                />
                <Button type="button" onClick={() => applyLevelFee(level)} disabled={saving}>
                  Apply
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-medium">Other Fees Defaults</h3>
        <p className="text-sm text-gray-600 mt-1">Set default values for Admission, Registration, Stationery, and Annual fees across all classes.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            type="number"
            value={otherFeeDefaults.admissionFee}
            onChange={(e) => setOtherFeeDefaults((prev) => ({ ...prev, admissionFee: e.target.value }))}
            placeholder="Admission fee"
            label="Admission Fee"
          />
          <Input
            type="number"
            value={otherFeeDefaults.registrationFee}
            onChange={(e) => setOtherFeeDefaults((prev) => ({ ...prev, registrationFee: e.target.value }))}
            placeholder="Registration fee"
            label="Registration Fee"
          />
          <Input
            type="number"
            value={otherFeeDefaults.stationeryFee}
            onChange={(e) => setOtherFeeDefaults((prev) => ({ ...prev, stationeryFee: e.target.value }))}
            placeholder="Stationery fee"
            label="Stationery Fee"
          />
          <Input
            type="number"
            value={otherFeeDefaults.annualFee}
            onChange={(e) => setOtherFeeDefaults((prev) => ({ ...prev, annualFee: e.target.value }))}
            placeholder="Annual fee"
            label="Annual Fee"
          />
        </div>

        <div className="mt-4">
          <Button type="button" onClick={applyOtherFeesDefaults} disabled={saving}>
            Apply Other Fees Defaults
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium">Class-wise Tuition Fee</h3>
        <p className="text-sm text-gray-600 mt-1">Each class stores its tuition fee in SchoolClass.tutionFee.</p>

        {loading ? (
          <div className="text-sm text-gray-600 mt-3">Loading classes...</div>
        ) : (
          <div className="mt-4">
            <Table>
              <TableRoot>
                <TableHead>
                  <TableRow>
                    <TableHeader>Class</TableHeader>
                    <TableHeader>Level</TableHeader>
                    <TableHeader>Tuition Fee</TableHeader>
                    <TableHeader>Action</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((c) => (
                    <ClassRow key={c._id} row={c} disabled={saving} onSave={saveClassFee} />
                  ))}
                </TableBody>
              </TableRoot>
            </Table>
            {classes.length === 0 ? <div className="text-sm text-gray-600 mt-2">No classes found.</div> : null}
          </div>
        )}
      </Card>
    </div>
  )
}

function ClassRow({ row, onSave, disabled }) {
  const [fee, setFee] = useState(String(row?.tutionFee ?? 0))

  useEffect(() => {
    setFee(String(row?.tutionFee ?? 0))
  }, [row?.tutionFee])

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">{row.name}</TableCell>
      <TableCell className="whitespace-nowrap capitalize">{row.level || '-'}</TableCell>
      <TableCell>
        <Input type="number" value={fee} onChange={(e) => setFee(e.target.value)} />
      </TableCell>
      <TableCell>
        <Button type="button" disabled={disabled} onClick={() => onSave(row._id, fee)}>
          Save
        </Button>
      </TableCell>
    </TableRow>
  )
}
