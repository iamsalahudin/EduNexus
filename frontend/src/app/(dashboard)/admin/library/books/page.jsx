'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Select, Skeleton } from '@/components/ui'
import libraryService from '@/services/libraryService'

export default function BooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [query, setQuery] = useState('')
  const [formMode, setFormMode] = useState(null)
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', category: '', shelf: '', totalCopies: 1, active: true })

  async function loadBooks() {
    setLoading(true)
    setError('')
    try {
      const res = await libraryService.listBooks({ q: query || undefined })
      setBooks(Array.isArray(res?.books) ? res.books : [])
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load books')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      if (formMode === 'edit') {
        await libraryService.updateBook(formData._id, formData)
        setSuccess('Book updated')
      } else {
        await libraryService.createBook(formData)
        setSuccess('Book created')
      }
      setFormMode(null)
      setFormData({ title: '', author: '', isbn: '', category: '', shelf: '', totalCopies: 1, active: true })
      loadBooks()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to save')
    }
  }

  async function deleteBook(id) {
    if (!window.confirm('Delete this book?')) return
    try {
      await libraryService.deleteBook(id)
      setSuccess('Book deleted')
      loadBooks()
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to delete')
    }
  }

  const filtered = books.filter((b) => !query || [b.title, b.author, b.category].some((v) => String(v || '').toLowerCase().includes(query.toLowerCase())))

  return (
    <div className="space-y-6">
      <PageHeader title="Books" subtitle="Manage library collection" />
      {error ? <div className="text-sm text-red-600">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Add / Edit</h2>
          <form onSubmit={handleSubmit} className="mt-3 space-y-2 text-sm">
            <Input placeholder="Title *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            <Input placeholder="Author" value={formData.author} onChange={(e) => setFormData({ ...formData, author: e.target.value })} />
            <Input placeholder="ISBN" value={formData.isbn} onChange={(e) => setFormData({ ...formData, isbn: e.target.value })} />
            <Input placeholder="Category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            <Input type="number" min="1" value={formData.totalCopies} onChange={(e) => setFormData({ ...formData, totalCopies: Number(e.target.value) })} />
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} /> Active</label>
            <Button type="submit" variant="primary" size="sm">{formMode === 'edit' ? 'Update' : 'Add'}</Button>
            {formMode && <Button type="button" onClick={() => { setFormMode(null); setFormData({ title: '', author: '', isbn: '', category: '', shelf: '', totalCopies: 1, active: true }); }} variant="outline" size="sm">Cancel</Button>}
          </form>
        </Card>

        <Card className="md:col-span-2">
          <h2 className="font-semibold mb-3">Search</h2>
          <div className="flex gap-2">
            <Input placeholder="Search..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1" />
            <Button onClick={loadBooks} size="sm">Refresh</Button>
          </div>
        </Card>
      </div>

      <Card>
        {loading ? <Skeleton className="h-40" /> : filtered.length === 0 ? <div className="text-sm text-gray-600">No books.</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b"><th className="py-2 px-3 text-left">Title</th><th className="py-2 px-3">Author</th><th className="py-2 px-3">Category</th><th className="py-2 px-3">Total</th><th className="py-2 px-3">Available</th><th className="py-2 px-3">Action</th></tr></thead>
              <tbody>{filtered.map((b) => (<tr key={b._id} className="border-b"><td className="py-2 px-3">{b.title}</td><td className="py-2 px-3 text-sm">{b.author || '-'}</td><td className="py-2 px-3 text-sm">{b.category || '-'}</td><td className="py-2 px-3 text-center">{b.totalCopies}</td><td className="py-2 px-3 text-center">{b.availableCopies}</td><td className="py-2 px-3 flex gap-1"><Button size="sm" variant="outline" onClick={() => { setFormMode('edit'); setFormData(b); }}>Edit</Button><Button size="sm" variant="outline" onClick={() => deleteBook(b._id)}>Delete</Button></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
