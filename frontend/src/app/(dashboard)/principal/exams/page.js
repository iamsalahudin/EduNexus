"use client"

import { useEffect, useMemo, useState } from 'react'
import classesService from '@/services/classesService'
import examsService from '@/services/examsService'
import DatesheetGridPage from '@/components/exams/DatesheetGridPage'
import { Button, Card, PageHeader, Select, ToggleBox } from '@/components/ui'

function monthOptions() {
  return [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' },
  ]
}

export default function Page() {
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  const [configs, setConfigs] = useState([])
  const [selectedClassName, setSelectedClassName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedConfig = useMemo(() => {
    if (!selectedClassName) return null
    return configs.find((c) => c?.className === selectedClassName) || null
  }, [configs, selectedClassName])

  const [preset, setPreset] = useState('jan-dec')
  const [customStartMonth, setCustomStartMonth] = useState(1)
  const [monthlyEnabled, setMonthlyEnabled] = useState(true)
  const [midEnabled, setMidEnabled] = useState(true)
  const [finalEnabled, setFinalEnabled] = useState(true)
  const [applyToAll, setApplyToAll] = useState(false)

  async function loadAll() {
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const [{ classes: cls }, { configs: cfgs }] = await Promise.all([
        classesService.listClasses(),
        examsService.listConfigs(),
      ])
      setClasses(Array.isArray(cls) ? cls : [])
      setConfigs(Array.isArray(cfgs) ? cfgs : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load exams config')
    } finally {
      setLoading(false)
    }
  }

  async function ensureDefaults() {
    setError('')
    setSuccess('')
    try {
      await examsService.ensureDefaultConfigs()
      setSuccess('Default exam configs ensured')
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to ensure defaults')
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedConfig) return
    const p = selectedConfig?.academicYear?.preset || 'jan-dec'
    setPreset(p)
    setCustomStartMonth(Number(selectedConfig?.academicYear?.startMonth || 1))
    setMonthlyEnabled(!!selectedConfig?.examTypes?.monthly?.enabled)
    setMidEnabled(!!selectedConfig?.examTypes?.mid?.enabled)
    setFinalEnabled(!!selectedConfig?.examTypes?.final?.enabled)
    setApplyToAll(false)
  }, [selectedConfig])

  async function save() {
    if (!selectedConfig?._id) return
    setError('')
    setSuccess('')
    try {
      const academicYear = {
        preset,
        ...(preset === 'custom' ? { startMonth: Number(customStartMonth || 1) } : {}),
      }

      const payload = {
        academicYear,
        examTypes: {
          monthly: { enabled: !!monthlyEnabled },
          mid: { enabled: !!midEnabled },
          final: { enabled: !!finalEnabled },
        },
        applyToAllClasses: !!applyToAll,
      }

      const { config } = await examsService.updateConfig(selectedConfig._id, payload)
      setSuccess(applyToAll ? 'Saved & applied to all classes' : 'Saved')

      setConfigs((prev) => {
        const next = Array.isArray(prev) ? [...prev] : []
        const idx = next.findIndex((c) => c?._id === config?._id)
        if (idx >= 0) next[idx] = config
        return next
      })
      await loadAll()
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to save config')
    }
  }

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Create exams, manage datesheets, and configure defaults for the whole school."
      />

      {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
      {success ? <div className="mt-4 text-sm text-green-600">{success}</div> : null}

      <div className="mt-6">
        <DatesheetGridPage
          showHeader={false}
          title=""
          subtitle=""
          canManage
          baseRole="principal"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <h2 className="font-medium">Quick Actions</h2>
          <p className="text-sm text-gray-600 mt-1">Marks entry and defaults maintenance.</p>

          <div className="mt-4 grid grid-cols-1 gap-2">
            <Button type="button" variant="primary" onClick={() => (window.location.href = '/principal/exams/marks-entry')}>
              Marks Entry
            </Button>
            <Button type="button" onClick={() => (window.location.href = '/principal/exams/schedule')}>
              Open Schedule (Full Page)
            </Button>
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="button" onClick={loadAll} disabled={loading}>Refresh</Button>
            <Button type="button" onClick={ensureDefaults} disabled={loading}>Ensure Defaults</Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium">Exam Configuration</h2>
              <p className="text-sm text-gray-600 mt-1">Update defaults, then apply them to all classes (whole school).</p>
            </div>
          </div>

          <div className="mt-4">
            <Select value={selectedClassName} onChange={(e) => setSelectedClassName(e.target.value)}>
              <option value="">Select class</option>
              {classes.map((c) => (
                <option key={c?._id} value={c?.name}>{c?.name}</option>
              ))}
            </Select>
          </div>

          {!selectedConfig ? (
            <div className="mt-4 text-sm text-gray-600">
              {selectedClassName ? 'No config found yet. Click “Ensure Defaults”.' : 'Pick a class to edit.'}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <div className="text-sm font-medium">Academic Year</div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
                    <option value="jan-dec">Jan–Dec (default)</option>
                    <option value="apr-mar">Apr–Mar</option>
                    <option value="sep-aug">Sep–Aug</option>
                    <option value="custom">Custom start month</option>
                  </Select>
                  <Select
                    value={customStartMonth}
                    onChange={(e) => setCustomStartMonth(Number(e.target.value))}
                    disabled={preset !== 'custom'}
                  >
                    {monthOptions().map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </Select>
                </div>
                {preset === 'custom' ? (
                  <div className="mt-2 text-xs text-gray-600">
                    End month is auto-calculated by backend.
                  </div>
                ) : null}
              </div>

              <div>
                <div className="text-sm font-medium">Exam Types</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <ToggleBox active={monthlyEnabled} onToggle={setMonthlyEnabled}>Monthly Tests</ToggleBox>
                  <ToggleBox active={midEnabled} onToggle={setMidEnabled}>Mid Exams</ToggleBox>
                  <ToggleBox active={finalEnabled} onToggle={setFinalEnabled}>Final Exams</ToggleBox>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <ToggleBox active={applyToAll} onToggle={setApplyToAll}>Apply to all classes</ToggleBox>
                <span className="text-gray-600">(recommended)</span>
              </div>

              <div className="flex gap-2">
                <Button variant="primary" type="button" onClick={save}>Save</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
