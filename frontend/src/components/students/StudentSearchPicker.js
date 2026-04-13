"use client"

import { useState } from 'react'
import studentsService from '@/services/studentsService'
import {
  Button,
  EmptyState,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRoot,
  TableRow,
} from '@/components/ui'

export default function StudentSearchPicker({ selectedStudent, onSelect }) {
  const [q, setQ] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function search() {
    setLoading(true)
    setError('')
    try {
      const { students } = await studentsService.listStudents({
        q: q || undefined,
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      })
      setRows(Array.isArray(students) ? students : [])
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to search students')
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
        <Input
          placeholder="Search by student ID, registration, name, class, or contact"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="button" onClick={search} disabled={loading}>
          {loading ? 'Searching...' : 'Search Student'}
        </Button>
      </div>

      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      {rows.length === 0 ? (
        <EmptyState title="Search and select a student" />
      ) : (
        <Table>
          <TableRoot>
            <TableHead>
              <TableRow>
                <TableHeader>Student</TableHeader>
                <TableHeader>Class</TableHeader>
                <TableHeader>Reg #</TableHeader>
                <TableHeader>Action</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const isSelected = String(selectedStudent?._id || '') === String(row._id || '')
                return (
                  <TableRow key={row._id} className={isSelected ? 'bg-gray-50' : ''}>
                    <TableCell>{row.name || '-'}</TableCell>
                    <TableCell>{[row.class, row.section].filter(Boolean).join(' - ') || '-'}</TableCell>
                    <TableCell>{row.registrationNumber || '-'}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant={isSelected ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => onSelect(row)}
                      >
                        {isSelected ? 'Selected' : 'Select'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </TableRoot>
        </Table>
      )}

      {selectedStudent ? (
        <div className="rounded border border-gray-200 bg-gray-50 p-3 text-sm">
          Selected: <span className="font-medium">{selectedStudent.name || '-'}</span>
          {' | '}Student ID: {selectedStudent.studentId || '-'}
          {' | '}Class: {[selectedStudent.class, selectedStudent.section].filter(Boolean).join(' - ') || '-'}
        </div>
      ) : null}
    </div>
  )
}
