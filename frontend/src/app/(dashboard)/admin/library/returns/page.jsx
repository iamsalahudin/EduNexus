'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'
import libraryService from '@/services/libraryService'

export default function ReturnsPage() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [returnForm, setReturnForm] = useState({})

  async function loadIssues() {
    setLoading(true)
    setError('')
    try {
      const res = await libraryService.listIssues({ status: 'issued' })
      setIssues(Array.isArray(res?.issues) ? res.issues : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadIssues()
  }, [])

  async function returnBook(issueId) {
    setError('')
    setSuccess('')
    try {
      await libraryService.returnBook(issueId, { fineAmount: returnForm[issueId]?.fineAmount || 0 })
      setSuccess('Book returned')
      setReturnForm({ ...returnForm, [issueId]: {} })
      loadIssues()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to return')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Return Books" subtitle="Process book returns" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <Card>
        {loading ? <Skeleton className="h-40" /> : issues.length === 0 ? <div className="text-sm text-gray-600">No issued books.</div> : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <div key={issue._id} className="border rounded p-3 flex justify-between items-center">
                <div className="text-sm"><div className="font-semibold">{issue.book?.title}</div><div className="text-gray-600">Student: {issue.student?.firstName} {issue.student?.lastName}</div><div className="text-gray-600">Due: {new Date(issue.dueDate).toLocaleDateString()}</div></div>
                <div className="flex gap-2 items-center"><Input type="number" min="0" placeholder="Fine (if any)" value={returnForm[issue._id]?.fineAmount || ''} onChange={(e) => setReturnForm({ ...returnForm, [issue._id]: { fineAmount: Number(e.target.value) } })} className="w-24 text-sm" /><Button size="sm" onClick={() => returnBook(issue._id)}>Return</Button></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
