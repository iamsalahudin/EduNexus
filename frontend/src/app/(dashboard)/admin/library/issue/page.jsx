'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import libraryService from '@/services/libraryService'
import studentsService from '@/services/studentsService'

export default function IssueBooksPage() {
  const [issues, setIssues] = useState([])
  const [books, setBooks] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({ bookId: '', studentId: '', dueDate: '' })

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [booksRes, issuesRes, studentsRes] = await Promise.all([
        libraryService.listBooks(),
        libraryService.listIssues(),
        studentsService.listStudents({ active: true })
      ])
      setBooks(Array.isArray(booksRes?.books) ? booksRes.books : [])
      setIssues(Array.isArray(issuesRes?.issues) ? issuesRes.issues : [])
      setStudents(Array.isArray(studentsRes?.students) ? studentsRes.students : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await libraryService.issueBook({ bookId: formData.bookId, studentId: formData.studentId, dueDate: formData.dueDate })
      setSuccess('Book issued')
      setFormData({ bookId: '', studentId: '', dueDate: '' })
      loadData()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to issue')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Issue Books" subtitle="Issue books to students" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="font-semibold mb-3">Issue Book</h2>
          <form onSubmit={handleSubmit} className="space-y-3 text-sm">
            <Select value={formData.bookId} onChange={(e) => setFormData({ ...formData, bookId: e.target.value })} required>
              <option value="">Select book</option>
              {books.filter((b) => b.availableCopies > 0).map((b) => <option key={b._id} value={b._id}>{b.title} (Avail: {b.availableCopies})</option>)}
            </Select>
            <Select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value })} required>
              <option value="">Select student</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName}</option>)}
            </Select>
            <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} required />
            <Button type="submit" variant="primary">Issue</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-semibold mb-3">Stats</h2>
          <div className="space-y-2 text-sm"><div className="flex justify-between"><span>Issued</span><span className="font-medium">{issues.length}</span></div><div className="flex justify-between"><span>Available Books</span><span className="font-medium">{books.filter((b) => b.availableCopies > 0).length}</span></div></div>
        </Card>
      </div>

      <Card>
        {loading ? <Skeleton className="h-40" /> : issues.length === 0 ? <div className="text-sm text-gray-600">No issues.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 px-3 text-left">Book</th>
                  <th className="py-2 px-3">Student</th>
                  <th className="py-2 px-3">Issue Date</th>
                  <th className="py-2 px-3">Due Date</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => (
                  <tr key={issue._id} className="border-b">
                    <td className="py-2 px-3">{issue.book?.title || 'N/A'}</td>
                    <td className="py-2 px-3 text-sm">{issue.student?.firstName} {issue.student?.lastName}</td>
                    <td className="py-2 px-3 text-sm">{new Date(issue.issueDate).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-sm">{new Date(issue.dueDate).toLocaleDateString()}</td>
                    <td className="py-2 px-3 text-sm">{issue.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
