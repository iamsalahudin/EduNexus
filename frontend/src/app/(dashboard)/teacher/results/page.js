'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import marksheetsService from '@/services/marksheetsService';
import examsService from '@/services/examsService';

export default function TeacherResultsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [marksheets, setMarksheets] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [marks, setMarks] = useState({});
  const [examQuery, setExamQuery] = useState('');
  const [marksheetQuery, setMarksheetQuery] = useState('');

  // Verify teacher access
  useEffect(() => {
    if (user && user.role !== 'Teacher') {
      router.push('/');
    }
  }, [user, router]);

  // Load exams where teacher has assignments
  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const result = await examsService.listExams({ status: 'published' });
        setExams(result.exams || []);
      } catch (err) {
        setError('Failed to load exams');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  // Load marksheets when exam is selected
  useEffect(() => {
    if (!selectedExam) {
      setMarksheets([]);
      return;
    }

    const loadMarksheets = async () => {
      try {
        setLoading(true);
        const result = await marksheetsService.listMarksheets({ examId: selectedExam._id });
        // Filter to only marksheets for classes teacher teaches
        setMarksheets(result.marksheets || []);
      } catch (err) {
        setError('Failed to load marksheets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMarksheets();
  }, [selectedExam]);

  const handleMarksheetSelect = async (marksheet) => {
    try {
      setLoading(true);
      const result = await marksheetsService.getMarksheetDetail(marksheet._id);
      setSelectedMarksheet(result.marksheet);
    } catch (err) {
      setError('Failed to load marksheet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter((exam) => {
    const query = examQuery.trim().toLowerCase();
    if (!query) return true;
    return [exam.name, exam.className, exam.type, String(exam.year || '')].join(' ').toLowerCase().includes(query);
  });

  const filteredMarksheets = marksheets.filter((marksheet) => {
    const query = marksheetQuery.trim().toLowerCase();
    if (!query) return true;
    return [marksheet.className, marksheet.section, String(marksheet.studentRows?.length || '')].join(' ').toLowerCase().includes(query);
  });

  const handleSaveMarks = async (row) => {
    try {
      setLoading(true);
      for (const subjectMark of row.subjectMarks || []) {
        const key = `${row.student._id || row.student}-${subjectMark.subject}`;
        const markValue = marks[key];
        if (markValue === undefined || markValue === '') continue;

        await marksheetsService.updateStudentMarks(selectedMarksheet._id, {
          studentId: row.student._id || row.student,
          subjectId: subjectMark.subject,
          marks: Number(markValue)
        });
      }
      setError('');
      setEditingStudentId(null);
      // Reload marksheet
      handleMarksheetSelect(selectedMarksheet);
    } catch (err) {
      setError(err.message || 'Failed to save marks');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'Teacher') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Marks Entry</h1>
            <p className="text-slate-600 mt-1">Enter marks for your assigned subjects and review progress in one place.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Exams</div>
              <div className="text-2xl font-semibold text-slate-900">{exams.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Marksheets</div>
              <div className="text-2xl font-semibold text-slate-900">{marksheets.length}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Editing</div>
              <div className="text-2xl font-semibold text-slate-900">{editingStudentId ? '1' : '0'}</div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
              <div className="text-sm font-semibold text-slate-900">{selectedMarksheet?.locked ? 'Locked' : selectedMarksheet?.published ? 'Published' : 'Open'}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Exam Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Exams</h2>
              <input
                value={examQuery}
                onChange={(e) => setExamQuery(e.target.value)}
                placeholder="Search exams..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900 mb-3"
              />
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredExams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => setSelectedExam(exam)}
                    className={`w-full text-left px-3 py-2 rounded-xl border transition-colors ${
                      selectedExam?._id === exam._id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <div className="font-medium text-sm">{exam.name}</div>
                    <div className={`text-xs ${selectedExam?._id === exam._id ? 'text-slate-200' : 'text-slate-500'}`}>{exam.className}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Marksheets List */}
            {selectedExam && !selectedMarksheet && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Marksheets ({selectedExam.name})</h3>
                    <p className="text-sm text-slate-500">Filter by class, section, or row count.</p>
                  </div>
                  <input
                    value={marksheetQuery}
                    onChange={(e) => setMarksheetQuery(e.target.value)}
                    placeholder="Search marksheets..."
                    className="w-full md:w-60 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredMarksheets.map((ms) => (
                    <button
                      key={ms._id}
                      onClick={() => handleMarksheetSelect(ms)}
                      className="p-4 border rounded-xl hover:border-slate-400 hover:bg-slate-50 transition-colors text-left bg-white"
                    >
                      <div className="font-semibold text-slate-900">
                        {ms.className} - {ms.section}
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {ms.studentRows?.length || 0} students
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          ms.published ? 'bg-green-100 text-green-800' :
                          ms.locked ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {ms.published ? 'Published' : ms.locked ? 'Locked' : 'In Progress'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {filteredMarksheets.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    No marksheets match your filter.
                  </div>
                )}
              </div>
            )}

            {/* Marksheet Detail - Marks Entry */}
            {selectedMarksheet && (
              <div>
                <button
                  onClick={() => setSelectedMarksheet(null)}
                  className="mb-4 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  ← Back
                </button>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedExam?.name} - {selectedMarksheet.className}
                    </h2>
                    <p className="text-sm text-gray-600">Enter marks for students</p>
                  </div>

                  {selectedMarksheet.locked && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-700 text-sm">⚠️ Marksheet is locked. No further edits allowed.</p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left font-semibold text-gray-700">Student Name</th>
                          {selectedMarksheet.subjects?.map(subj => (
                            <th key={subj._id} className="px-4 py-2 text-center font-semibold text-gray-700">
                              {subj.name?.substring(0, 10)}
                            </th>
                          ))}
                          <th className="px-4 py-2 text-center font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedMarksheet.studentRows?.map((row, idx) => (
                          <tr key={row.student} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 font-medium text-gray-900">
                              {row.student?.user?.name || 'N/A'}
                            </td>
                            {row.subjectMarks?.map(sm => (
                              <td key={sm.subject} className="px-4 py-2 text-center">
                                {editingStudentId === (row.student?._id || row.student) ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-16 px-2 py-1 border rounded text-center"
                                    value={marks[`${row.student?._id || row.student}-${sm.subject}`] || sm.marks || ''}
                                    onChange={(e) => setMarks({
                                      ...marks,
                                      [`${row.student?._id || row.student}-${sm.subject}`]: e.target.value
                                    })}
                                  />
                                ) : (
                                  <span className="text-gray-900">{sm.marks || '-'}</span>
                                )}
                              </td>
                            ))}
                            <td className="px-4 py-2 text-center">
                              {editingStudentId === (row.student?._id || row.student) ? (
                                <button
                                  onClick={() => handleSaveMarks(row)}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  Save
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingStudentId(row.student?._id || row.student);
                                    const nextMarks = {};
                                    for (const subjectMark of row.subjectMarks || []) {
                                      nextMarks[`${row.student?._id || row.student}-${subjectMark.subject}`] = subjectMark.marks ?? '';
                                    }
                                    setMarks(nextMarks);
                                  }}
                                  disabled={selectedMarksheet.locked}
                                  className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 disabled:opacity-50"
                                >
                                  Edit
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {!selectedExam && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">Select an exam to view marksheets</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
