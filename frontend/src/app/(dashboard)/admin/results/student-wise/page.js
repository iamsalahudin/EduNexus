'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import studentsService from '@/services/studentsService'
import examsService from '@/services/examsService'
import marksheetsService from '@/services/marksheetsService'

export default function StudentWiseResultsPage() {
	const [classes, setClasses] = useState([])
	const [students, setStudents] = useState([])
	const [exams, setExams] = useState([])
	const [selectedClass, setSelectedClass] = useState('')
	const [selectedStudent, setSelectedStudent] = useState('')
	const [selectedExam, setSelectedExam] = useState('')
	const [marksheet, setMarksheet] = useState(null)
	const [loading, setLoading] = useState(true)
	const [busy, setBusy] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		let mounted = true

		async function loadInitial() {
			try {
				setLoading(true)
				const [classRes, examRes] = await Promise.all([
					classesService.listClasses({ active: true }),
					examsService.listExams({ status: 'published' })
				])
				if (!mounted) return
				setClasses(Array.isArray(classRes?.classes) ? classRes.classes : [])
				setExams(Array.isArray(examRes?.exams) ? examRes.exams : [])
			} catch (err) {
				if (mounted) setError(err?.response?.data?.error || 'Failed to load student results')
			} finally {
				if (mounted) setLoading(false)
			}
		}

		loadInitial()
		return () => {
			mounted = false
		}
	}, [])

	async function loadStudents(className) {
		setSelectedClass(className)
		setSelectedStudent('')
		setMarksheet(null)
		if (!className) {
			setStudents([])
			return
		}

		try {
			const res = await studentsService.listStudents({ class: className, active: true })
			setStudents(Array.isArray(res?.students) ? res.students : [])
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load students')
		}
	}

	async function loadResult() {
		if (!selectedClass || !selectedStudent) return
		setBusy(true)
		setError('')
		try {
			const res = await marksheetsService.listMarksheetsByClass(selectedClass, selectedExam || null)
			const list = Array.isArray(res?.marksheets) ? res.marksheets : []
			const studentId = String(selectedStudent)
			const found = list.find((item) => String(item.student?._id || item.studentId || '') === studentId) || list[0] || null
			setMarksheet(found)
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load result details')
		} finally {
			setBusy(false)
		}
	}

	const subjectRows = useMemo(() => marksheet?.studentRows || [], [marksheet])

	return (
		<div className="space-y-6">
			<PageHeader title="Student-wise Results" subtitle="Look up a student’s marksheets and overall performance" />

			{error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

			<Card className="space-y-4">
				<div className="grid gap-3 md:grid-cols-4">
					<Select value={selectedClass} onChange={(e) => loadStudents(e.target.value)}>
						<option value="">Select class</option>
						{classes.map((item) => <option key={item._id} value={item.name}>{item.name}</option>)}
					</Select>
					<Select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
						<option value="">Select student</option>
						{students.map((item) => <option key={item._id} value={item._id}>{item.firstName} {item.lastName}</option>)}
					</Select>
					<Select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
						<option value="">Any published exam</option>
						{exams.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
					</Select>
					<Button type="button" onClick={loadResult} disabled={!selectedClass || !selectedStudent || busy}>
						{busy ? 'Loading...' : 'Load result'}
					</Button>
				</div>
			</Card>

			{loading ? (
				<Skeleton className="h-40" />
			) : marksheet ? (
				<div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
					<Card className="space-y-3">
						<div>
							<h2 className="text-lg font-semibold text-slate-900">Summary</h2>
							<p className="text-sm text-slate-500">{marksheet.exam?.name || 'Exam'} · {marksheet.className || selectedClass}</p>
						</div>
						<div className="grid grid-cols-2 gap-3 text-sm">
							<div className="rounded-xl bg-slate-50 p-3">
								<div className="text-xs uppercase text-slate-500">Published</div>
								<div className="mt-1 font-semibold">{marksheet.published ? 'Yes' : 'No'}</div>
							</div>
							<div className="rounded-xl bg-slate-50 p-3">
								<div className="text-xs uppercase text-slate-500">Locked</div>
								<div className="mt-1 font-semibold">{marksheet.locked ? 'Yes' : 'No'}</div>
							</div>
						</div>
					</Card>

					<Card>
						<h2 className="text-lg font-semibold text-slate-900">Subject rows</h2>
						<div className="mt-4 space-y-3">
							{subjectRows.length ? subjectRows.map((row, index) => (
								<div key={`${row.subject || index}`} className="rounded-xl border border-slate-200 p-3 text-sm">
									<div className="flex items-center justify-between gap-3">
										<div className="font-medium text-slate-900">{row.subjectName || row.subject?.name || 'Subject'}</div>
										<div className="text-slate-500">Total: {row.totalMarks ?? '—'}</div>
									</div>
									<div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-600">
										<div>Marks: {row.marks ?? row.theoryMarks ?? '—'}</div>
										<div>GR: {row.grPerformanceMarks ?? '—'}</div>
										<div>Comments: {row.teacherComments ? 'Yes' : 'No'}</div>
									</div>
								</div>
							)) : (
								<div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No subject rows available on this marksheet.</div>
							)}
						</div>
					</Card>
				</div>
			) : (
				<Card><div className="text-sm text-slate-600">Select a class and student, then load the result.</div></Card>
			)}
		</div>
	)
}