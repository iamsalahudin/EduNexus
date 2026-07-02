'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button, Card, PageHeader, Select, Skeleton } from '@/components/ui'
import classesService from '@/services/classesService'
import examsService from '@/services/examsService'
import marksheetsService from '@/services/marksheetsService'

export default function ClassWiseResultsPage() {
	const [classes, setClasses] = useState([])
	const [exams, setExams] = useState([])
	const [marksheets, setMarksheets] = useState([])
	const [selectedClass, setSelectedClass] = useState('')
	const [selectedExam, setSelectedExam] = useState('')
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
				if (mounted) setError(err?.response?.data?.error || 'Failed to load result filters')
			} finally {
				if (mounted) setLoading(false)
			}
		}

		loadInitial()
		return () => {
			mounted = false
		}
	}, [])

	async function loadMarksheets(className = selectedClass, examId = selectedExam) {
		if (!className) return
		setBusy(true)
		setError('')
		try {
			const res = await marksheetsService.listMarksheetsByClass(className, examId || null)
			setMarksheets(Array.isArray(res?.marksheets) ? res.marksheets : [])
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to load marksheets')
		} finally {
			setBusy(false)
		}
	}

	const classMarksheets = useMemo(() => marksheets, [marksheets])

	return (
		<div className="space-y-6">
			<PageHeader title="Class-wise Results" subtitle="Review marksheets for a class and exam combination" />

			{error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

			<Card className="space-y-4">
				<div className="grid gap-3 md:grid-cols-3">
					<Select
						value={selectedClass}
						onChange={(e) => {
							setSelectedClass(e.target.value)
							setMarksheets([])
						}}
					>
						<option value="">Select class</option>
						{classes.map((item) => (
							<option key={item._id} value={item.name}>{item.name}</option>
						))}
					</Select>
					<Select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)}>
						<option value="">All published exams</option>
						{exams.map((item) => (
							<option key={item._id} value={item._id}>{item.name}</option>
						))}
					</Select>
					<Button type="button" onClick={() => loadMarksheets()} disabled={!selectedClass || busy}>
						{busy ? 'Loading...' : 'Load marksheets'}
					</Button>
				</div>
			</Card>

			{loading ? (
				<Skeleton className="h-40" />
			) : !selectedClass ? (
				<Card><div className="text-sm text-slate-600">Choose a class to view marksheets.</div></Card>
			) : (
				<Card>
					{classMarksheets.length === 0 ? (
						<div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">No marksheets found for the selected criteria.</div>
					) : (
						<div className="space-y-3">
							{classMarksheets.map((marksheet) => (
								<div key={marksheet._id} className="rounded-xl border border-slate-200 p-4">
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<h3 className="font-semibold text-slate-900">{marksheet.exam?.name || 'Exam'}</h3>
											<p className="text-sm text-slate-500">Section {marksheet.section || 'N/A'} · {marksheet.studentRows?.length || 0} students</p>
										</div>
										<div className="flex flex-wrap gap-2 text-xs">
											<span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{marksheet.published ? 'Published' : 'Draft'}</span>
											<span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">{marksheet.locked ? 'Locked' : 'Open'}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</Card>
			)}
		</div>
	)
}