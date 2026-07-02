'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Input, PageHeader, Skeleton } from '@/components/ui'
import examsService from '@/services/examsService'

export default function GradingPage() {
	const [exams, setExams] = useState([])
	const [selectedExam, setSelectedExam] = useState(null)
	const [weights, setWeights] = useState({ theory: 50, practical: 20, quiz: 10, assignment: 10, attendance: 10 })
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	useEffect(() => {
		let mounted = true

		async function loadExams() {
			try {
				setLoading(true)
				const res = await examsService.listExams({ status: 'published' })
				if (!mounted) return
				setExams(Array.isArray(res?.exams) ? res.exams : [])
			} catch (err) {
				if (mounted) setError(err?.response?.data?.error || 'Failed to load exams')
			} finally {
				if (mounted) setLoading(false)
			}
		}

		loadExams()
		return () => {
			mounted = false
		}
	}, [])

	function selectExam(exam) {
		setSelectedExam(exam)
		setWeights(exam?.resultWeights || { theory: 50, practical: 20, quiz: 10, assignment: 10, attendance: 10 })
	}

	async function saveWeights() {
		if (!selectedExam?._id) return
		setSaving(true)
		setError('')
		setSuccess('')
		try {
			const result = await examsService.updateExam(selectedExam._id, { resultWeights: weights })
			setSelectedExam(result?.exam || selectedExam)
			setSuccess('Grading weights saved')
		} catch (err) {
			setError(err?.response?.data?.error || 'Failed to save grading weights')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6">
			<PageHeader title="Grading Setup" subtitle="Configure exam grading weights and result boundaries" />

			{error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
			{success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div> : null}

			<div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
				<Card className="space-y-4">
					<h2 className="text-lg font-semibold text-slate-900">Published exams</h2>
					{loading ? (
						<Skeleton className="h-40" />
					) : (
						<div className="space-y-2">
							{exams.map((exam) => (
								<button
									key={exam._id}
									type="button"
									onClick={() => selectExam(exam)}
									className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${selectedExam?._id === exam._id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
								>
									<div className="font-medium">{exam.name}</div>
									<div className={selectedExam?._id === exam._id ? 'text-slate-200' : 'text-slate-500'}>{exam.className}</div>
								</button>
							))}
						</div>
					)}
				</Card>

				<Card className="space-y-4">
					<h2 className="text-lg font-semibold text-slate-900">Weight editor</h2>
					{!selectedExam ? (
						<div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">Select an exam to configure grading weights.</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2">
							{Object.entries(weights).map(([key, value]) => (
								<div key={key}>
									<label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">{key}</label>
									<Input
										type="number"
										min="0"
										max="100"
										value={value}
										onChange={(e) => setWeights((current) => ({ ...current, [key]: Number(e.target.value) || 0 }))}
									/>
								</div>
							))}
							<div className="md:col-span-2 flex items-center gap-3">
								<Button type="button" onClick={saveWeights} disabled={saving}>{saving ? 'Saving...' : 'Save weights'}</Button>
								<div className="text-sm text-slate-500">Total should equal 100 for a balanced grading formula.</div>
							</div>
						</div>
					)}
				</Card>
			</div>
		</div>
	)
}