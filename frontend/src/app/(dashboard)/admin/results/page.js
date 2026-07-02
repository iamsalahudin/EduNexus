'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import marksheetsService from '@/services/marksheetsService';
import examsService from '@/services/examsService';
import MarksheetWorkspace from '@/components/results/MarksheetWorkspace';
import WeightSetupPanel from '@/components/results/WeightSetupPanel';

export default function AdminResultsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [marksheets, setMarksheets] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('exams');
  const [marksheetQuery, setMarksheetQuery] = useState('');
  const [marksheetStatus, setMarksheetStatus] = useState('all');

  // Verify admin/principal access
  useEffect(() => {
    if (user && user.role !== 'Admin' && user.role !== 'Principal') {
      router.push('/');
    }
  }, [user, router]);

  // Load live exams
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
      setActiveSection('marksheets');
    } catch (err) {
      setError('Failed to load marksheet details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWeightSave = async (weights) => {
    try {
      setLoading(true);
      setError('');
      const result = await examsService.updateExam(selectedExam._id, { resultWeights: weights });
      if (result?.exam) {
        setSelectedExam(result.exam);
        setExams((prev) => prev.map((exam) => (exam._id === result.exam._id ? result.exam : exam)));
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save weights');
    } finally {
      setLoading(false);
    }
  };

  const handleMarksheetUpdate = () => {
    if (selectedMarksheet) {
      handleMarksheetSelect(selectedMarksheet);
    }
  };

  const filteredMarksheets = marksheets.filter((marksheet) => {
    const query = marksheetQuery.trim().toLowerCase();
    const haystack = [
      marksheet.className,
      marksheet.section,
      marksheet.exam?.name,
      marksheet.exam?.type,
      String(marksheet.studentRows?.length || '')
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (query && !haystack.includes(query)) return false;
    if (marksheetStatus === 'all') return true;
    if (marksheetStatus === 'published') return Boolean(marksheet.published);
    if (marksheetStatus === 'locked') return Boolean(marksheet.locked && !marksheet.published);
    return Boolean(!marksheet.locked && !marksheet.published);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Results & Marksheets</h1>
              <p className="text-slate-600 mt-1">Manage marksheets, configure weights, publish results, and export records.</p>
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
                <div className="text-xs uppercase tracking-wide text-slate-500">Published</div>
                <div className="text-2xl font-semibold text-slate-900">{marksheets.filter((item) => item.published).length}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-slate-500">Locked</div>
                <div className="text-2xl font-semibold text-slate-900">{marksheets.filter((item) => item.locked && !item.published).length}</div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Published Exams</h2>
              
              {loading && !exams.length && (
                <p className="text-gray-500 text-sm">Loading exams...</p>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {exams.map((exam) => (
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

          <div className="lg:col-span-3 space-y-6">
            {selectedExam && (
              <div className="flex gap-2 border-b overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveSection('marksheets')}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeSection === 'marksheets'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                  >
                  Marksheets
                </button>
                <button
                  onClick={() => setActiveSection('weights')}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeSection === 'weights'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                  >
                  Result Weights
                </button>
              </div>
            )}

            {activeSection === 'marksheets' && selectedExam && (
              <div className="space-y-4">
                {!selectedMarksheet && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      {selectedExam.name} - Marksheets
                        </h3>
                        <p className="text-sm text-slate-500">Search by class, section, exam type, or row count.</p>
                      </div>
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <input
                          value={marksheetQuery}
                          onChange={(e) => setMarksheetQuery(e.target.value)}
                          placeholder="Search marksheets..."
                          className="w-full md:w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                        />
                        <select
                          value={marksheetStatus}
                          onChange={(e) => setMarksheetStatus(e.target.value)}
                          className="w-full md:w-44 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
                        >
                          <option value="all">All status</option>
                          <option value="draft">Draft</option>
                          <option value="locked">Locked</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
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

                {selectedMarksheet && (
                  <div>
                    <button
                      onClick={() => setSelectedMarksheet(null)}
                      className="mb-4 px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                    >
                      ← Back to Marksheets
                    </button>
                    <MarksheetWorkspace
                      marksheet={selectedMarksheet}
                      className={`${selectedExam.className}`}
                      onUpdate={handleMarksheetUpdate}
                    />
                  </div>
                )}
              </div>
            )}

            {activeSection === 'weights' && selectedExam && (
              <WeightSetupPanel
                exam={selectedExam}
                onSave={handleWeightSave}
                disabled={selectedExam.publishedAt}
              />
            )}

            {!selectedExam && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
                <p className="text-slate-600 text-lg">Select an exam to view marksheets and manage results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
