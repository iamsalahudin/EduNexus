'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import hostelService from '@/services/hostelService'

export default function HostelsPage() {
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formMode, setFormMode] = useState(null)
  const [formData, setFormData] = useState({ name: '', gender: 'mixed', wardenName: '', address: '', active: true })

  async function loadHostels() {
    setLoading(true)
    setError('')
    try {
      const res = await hostelService.listHostels()
      setHostels(Array.isArray(res?.hostels) ? res.hostels : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHostels()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (formMode === 'edit') {
        await hostelService.updateHostel(formData._id, formData)
        setSuccess('Hostel updated')
      } else {
        await hostelService.createHostel(formData)
        setSuccess('Hostel created')
      }
      setFormMode(null)
      setFormData({ name: '', gender: 'mixed', wardenName: '', address: '', active: true })
      loadHostels()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save')
    }
  }

  async function deleteHostel(id) {
    if (!window.confirm('Delete this hostel?')) return
    try {
      await hostelService.deleteHostel(id)
      setSuccess('Hostel deleted')
      loadHostels()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Hostels" subtitle="Manage hostel facilities" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Add / Edit</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-2 text-sm">
            <Input placeholder="Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <Select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
              <option value="boys">Boys</option>
              <option value="girls">Girls</option>
              <option value="mixed">Mixed</option>
            </Select>
            <Input placeholder="Warden Name" value={formData.wardenName} onChange={(e) => setFormData({ ...formData, wardenName: e.target.value })} />
            <Input placeholder="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
            <Button type="submit" variant="primary" size="sm">{formMode === 'edit' ? 'Update' : 'Create'}</Button>
            {formMode && <Button type="button" onClick={() => { setFormMode(null); setFormData({ name: '', gender: 'mixed', wardenName: '', address: '', active: true }); }} variant="outline" size="sm">Cancel</Button>}
          </form>
        </Card>

        <Card className="md:col-span-2">
          <h2 className="font-semibold mb-3">Stats</h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><div className="text-2xl font-bold">{hostels.length}</div><div className="text-gray-600">Total</div></div>
            <div><div className="text-2xl font-bold">{hostels.filter((h) => h.active).length}</div><div className="text-gray-600">Active</div></div>
            <div><div className="text-2xl font-bold">{hostels.filter((h) => h.gender === 'girls').length}</div><div className="text-gray-600">Girls</div></div>
          </div>
        </Card>
      </div>

      <Card>
        {loading ? <Skeleton className="h-40" /> : hostels.length === 0 ? <div className="text-sm text-gray-600">No hostels.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="py-2 px-3 text-left">Name</th><th className="py-2 px-3 text-left">Gender</th><th className="py-2 px-3">Warden</th><th className="py-2 px-3">Status</th><th className="py-2 px-3">Action</th></tr></thead>
              <tbody>{hostels.map((h) => (<tr key={h._id} className="border-b"><td className="py-2 px-3">{h.name}</td><td className="py-2 px-3 text-sm">{h.gender || 'mixed'}</td><td className="py-2 px-3 text-sm">{h.wardenName || '-'}</td><td className="py-2 px-3"><span className={`px-2 py-1 text-xs rounded ${h.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{h.active ? 'Active' : 'Inactive'}</span></td><td className="py-2 px-3 flex gap-1"><Button size="sm" variant="outline" onClick={() => { setFormMode('edit'); setFormData(h); }}>Edit</Button><Button size="sm" variant="outline" onClick={() => deleteHostel(h._id)}>Delete</Button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
