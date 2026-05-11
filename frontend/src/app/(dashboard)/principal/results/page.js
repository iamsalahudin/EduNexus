<<<<<<< HEAD
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import marksheetsService from '@/services/marksheetsService';
import examsService from '@/services/examsService';
import MarksheetWorkspace from '@/components/results/MarksheetWorkspace';
import WeightSetupPanel from '@/components/results/WeightSetupPanel';

export default function PrincipalResultsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [marksheets, setMarksheets] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('exams');

  useEffect(() => {
    if (user && user.role !== 'Principal') {
      router.push('/');
    }
  }, [user, router]);

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
      alert('Weights updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksheetUpdate = () => {
    if (selectedMarksheet) {
      handleMarksheetSelect(selectedMarksheet);
    }
  };

  if (!user || user.role !== 'Principal') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Results & Marksheets</h1>
          <p className="text-gray-600 mt-1">Review marksheets, configure weights, and publish results</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Published Exams</h2>
              
              {loading && !exams.length && (
                <p className="text-gray-500 text-sm">Loading exams...</p>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => setSelectedExam(exam)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedExam?._id === exam._id
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{exam.name}</div>
                    <div className="text-xs text-gray-600">{exam.className}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedExam && (
              <div className="flex gap-2 border-b">
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
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedExam.name} - Marksheets
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {marksheets.map((ms) => (
                        <button
                          key={ms._id}
                          onClick={() => handleMarksheetSelect(ms)}
                          className="p-4 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="font-semibold text-gray-900">
                            {ms.className} - {ms.section}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
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
                  </div>
                )}

                {selectedMarksheet && (
                  <div>
                    <button
                      onClick={() => setSelectedMarksheet(null)}
                      className="mb-4 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 text-lg">Select an exam to view marksheets and manage results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
=======
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import marksheetsService from '@/services/marksheetsService';
import examsService from '@/services/examsService';
import MarksheetWorkspace from '@/components/results/MarksheetWorkspace';
import WeightSetupPanel from '@/components/results/WeightSetupPanel';

export default function PrincipalResultsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [exams, setExams] = useState([]);
  const [marksheets, setMarksheets] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('exams');

  useEffect(() => {
    if (user && user.role !== 'Principal') {
      router.push('/');
    }
  }, [user, router]);

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
      alert('Weights updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksheetUpdate = () => {
    if (selectedMarksheet) {
      handleMarksheetSelect(selectedMarksheet);
    }
  };

  if (!user || user.role !== 'Principal') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Results & Marksheets</h1>
          <p className="text-gray-600 mt-1">Review marksheets, configure weights, and publish results</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Published Exams</h2>
              
              {loading && !exams.length && (
                <p className="text-gray-500 text-sm">Loading exams...</p>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {exams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => setSelectedExam(exam)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedExam?._id === exam._id
                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{exam.name}</div>
                    <div className="text-xs text-gray-600">{exam.className}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {selectedExam && (
              <div className="flex gap-2 border-b">
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
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {selectedExam.name} - Marksheets
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {marksheets.map((ms) => (
                        <button
                          key={ms._id}
                          onClick={() => handleMarksheetSelect(ms)}
                          className="p-4 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                        >
                          <div className="font-semibold text-gray-900">
                            {ms.className} - {ms.section}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
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
                  </div>
                )}

                {selectedMarksheet && (
                  <div>
                    <button
                      onClick={() => setSelectedMarksheet(null)}
                      className="mb-4 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600 text-lg">Select an exam to view marksheets and manage results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
