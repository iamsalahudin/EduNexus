<<<<<<< HEAD
'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import marksheetsService from '@/services/marksheetsService';

/**
 * MarksheetWorkspace: Main UI for managing marksheets
 * Shows student rows with marks, lock/unlock/publish controls
 * Supports role-based editing (teacher=assigned subjects, admin=all)
 *
 * @param {object} marksheet - Marksheet object with studentRows
 * @param {string} className - Class name for context
 * @param {function} onUpdate - Callback when marksheet is updated
 */
export default function MarksheetWorkspace({ marksheet, className, onUpdate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('marks'); // 'marks' | 'gr' | 'comments'
  const csvInputRef = useRef(null);

  if (!marksheet) {
    return <div className="p-4 text-gray-500">No marksheet selected</div>;
  }

  const isAdmin = user?.role === 'Admin' || user?.role === 'Principal';
  const isTeacher = user?.role === 'Teacher';
  const canEdit = !marksheet.locked && !marksheet.published && !isTeacher;
  const canEditMarks = !marksheet.locked && !marksheet.published;
  const studentCount = marksheet.studentRows?.length || 0;
  const subjectCount = marksheet.subjects?.length || 0;

  // Status badge styling
  const getStatusBadge = () => {
    if (marksheet.published) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Published</span>;
    }
    if (marksheet.locked) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Locked</span>;
    }
    return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">In Progress</span>;
  };

  // Lock/Unlock handlers
  const handleLock = async () => {
    try {
      setLoading(true);
      await marksheetsService.lockMarksheet(marksheet._id);
      if (onUpdate) onUpdate();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to lock marksheet');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setLoading(true);
      await marksheetsService.unlockMarksheet(marksheet._id);
      if (onUpdate) onUpdate();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to unlock marksheet');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure? This will generate report cards and lock the marksheet.')) {
      return;
    }

    try {
      setLoading(true);
      await marksheetsService.publishMarksheet(marksheet._id);
      if (onUpdate) onUpdate();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to publish marksheet');
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const blob = format === 'csv'
        ? await marksheetsService.exportMarksheetCsv(marksheet._id)
        : await marksheetsService.exportMarksheetPdf(marksheet._id);
      downloadBlob(blob, `${marksheet.className || 'marksheet'}-${marksheet.section || 'all'}.${format}`);
      setError('');
    } catch (err) {
      setError(err.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvPicker = () => {
    if (csvInputRef.current) csvInputRef.current.click();
  };

  const handleCsvImport = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      setImportSummary(null);
      const result = await marksheetsService.importMarksheetCsv(marksheet._id, file);
      setImportSummary(result);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const renderStatusPill = (value) => {
    const text = String(value || '').trim();
    if (!text) return <span className="text-slate-400">-</span>;
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{text}</span>;
  };

  const renderMobileCard = (row, idx) => {
    const subjectValues = (row.subjectMarks || []).map((sm, subjectIndex) => {
      const subject = marksheet.subjects?.[subjectIndex] || sm.subject;
      const subjectName = subject?.name || subject?.subject?.name || `Subject ${subjectIndex + 1}`;

      return (
        <div key={sm.subject} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-900">{subjectName}</div>
            {renderStatusPill(sm.marks ?? '')}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-lg bg-white px-2 py-2 border border-slate-200">Marks: {String(sm.marks ?? '-')}</div>
            <div className="rounded-lg bg-white px-2 py-2 border border-slate-200">Grade: {String(sm.grade || '-')}</div>
          </div>
        </div>
      );
    });

    return (
      <div key={row.student?._id || row.student || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900">{row.student?.user?.name || 'N/A'}</div>
            <div className="text-xs text-slate-500">{row.student?.studentId || row.student?._id || 'Student'}</div>
          </div>
          <div className="text-xs text-slate-500">#{idx + 1}</div>
        </div>

        <div className="mt-4 space-y-3">
          {activeTab === 'marks' && subjectValues}

          {activeTab === 'gr' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">GR Marks</div>
                <div className="text-xs text-slate-500">/ {marksheet.exam?.grMaxMarks || 100}</div>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-700">{row.grPerformanceMarks || 0}</div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-medium text-slate-900 mb-2">Teacher Comments</div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">{row.teacherComments || 'No comment added yet.'}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
            {className} - {marksheet.section || 'Section'}
            </h2>
            <p className="text-sm text-slate-600">{studentCount} students · {subjectCount} subjects</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge()}
            {loading && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 animate-pulse">
                Working...
              </span>
            )}
            {isAdmin && (
              <>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvImport}
                />
                <button
                  onClick={handleCsvPicker}
                  disabled={loading || marksheet.locked || marksheet.published}
                  className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 disabled:opacity-50 text-sm"
                >
                  Import CSV
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm"
                >
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {importSummary?.ok && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800 text-sm">
            Imported {importSummary.importedRows || 0} rows, updated {importSummary.updatedMarks || 0} marks, skipped {importSummary.skippedStudents || 0} students and {importSummary.skippedCells || 0} invalid cells.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('marks')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'marks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Marks Entry
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('gr')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'gr'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              General Report
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Comments
            </button>
          </>
        )}
      </div>

      {/* Student Rows Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:hidden space-y-3">
          {marksheet.studentRows?.map((row, idx) => renderMobileCard(row, idx))}
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Student</th>
                {activeTab === 'marks' && marksheet.subjects?.map(subj => (
                  <th key={subj._id} className="px-4 py-2 text-center font-semibold text-slate-700">
                    {subj.name?.substring(0, 3).toUpperCase()}
                  </th>
                ))}
                {activeTab === 'gr' && (
                  <th className="px-4 py-2 text-center font-semibold text-slate-700">GR Marks</th>
                )}
                {activeTab === 'comments' && (
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Teacher Comments</th>
                )}
              </tr>
            </thead>
            <tbody>
              {marksheet.studentRows?.map((row, idx) => (
                <tr key={row.student?._id || row.student} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {row.student?.user?.name || 'N/A'}
                  </td>
                  
                  {/* Marks Entry Tab */}
                  {activeTab === 'marks' && row.subjectMarks?.map(sm => (
                    <td key={sm.subject} className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={marksheet.locked || marksheet.published || !canEditMarks}
                        className="w-16 px-2 py-1 border rounded text-center disabled:bg-slate-100"
                        placeholder="0"
                        value={sm.marks || ''}
                      />
                    </td>
                  ))}

                  {/* GR Tab */}
                  {activeTab === 'gr' && (
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={marksheet.exam?.grMaxMarks || 100}
                        disabled={marksheet.locked || marksheet.published || !isAdmin}
                        className="w-20 px-2 py-1 border rounded text-center disabled:bg-slate-100"
                        value={row.grPerformanceMarks || 0}
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        / {marksheet.exam?.grMaxMarks || 100}
                      </div>
                    </td>
                  )}

                  {/* Comments Tab */}
                  {activeTab === 'comments' && (
                    <td className="px-4 py-2">
                      <textarea
                        disabled={marksheet.locked || marksheet.published || !canEdit}
                        className="w-full px-2 py-1 border rounded text-sm disabled:bg-slate-100"
                        rows="2"
                        placeholder="Teacher comments..."
                        value={row.teacherComments || ''}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      {isAdmin && (
        <div className="flex gap-2 p-4 bg-white rounded-lg shadow">
          {!marksheet.locked && !marksheet.published && (
            <button
              onClick={handleLock}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300"
            >
              {loading ? 'Processing...' : 'Lock Marksheet'}
            </button>
          )}

          {marksheet.locked && !marksheet.published && (
            <>
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Unlock'}
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Publish & Generate Report Cards'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
=======
'use client';

import React, { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import marksheetsService from '@/services/marksheetsService';

/**
 * MarksheetWorkspace: Main UI for managing marksheets
 * Shows student rows with marks, lock/unlock/publish controls
 * Supports role-based editing (teacher=assigned subjects, admin=all)
 *
 * @param {object} marksheet - Marksheet object with studentRows
 * @param {string} className - Class name for context
 * @param {function} onUpdate - Callback when marksheet is updated
 */
export default function MarksheetWorkspace({ marksheet, className, onUpdate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [activeTab, setActiveTab] = useState('marks'); // 'marks' | 'gr' | 'comments'
  const csvInputRef = useRef(null);

  if (!marksheet) {
    return <div className="p-4 text-gray-500">No marksheet selected</div>;
  }

  const isAdmin = user?.role === 'Admin' || user?.role === 'Principal';
  const isTeacher = user?.role === 'Teacher';
  const canEdit = !marksheet.locked && !marksheet.published && !isTeacher;
  const canEditMarks = !marksheet.locked && !marksheet.published;
  const studentCount = marksheet.studentRows?.length || 0;
  const subjectCount = marksheet.subjects?.length || 0;

  // Status badge styling
  const getStatusBadge = () => {
    if (marksheet.published) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Published</span>;
    }
    if (marksheet.locked) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Locked</span>;
    }
    return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">In Progress</span>;
  };

  // Lock/Unlock handlers
  const handleLock = async () => {
    try {
      setLoading(true);
      await marksheetsService.lockMarksheet(marksheet._id);
      if (onUpdate) onUpdate();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to lock marksheet');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      setLoading(true);
      await marksheetsService.unlockMarksheet(marksheet._id);
      if (onUpdate) onUpdate();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to unlock marksheet');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!window.confirm('Are you sure? This will generate report cards and lock the marksheet.')) {
      return;
    }

    try {
      setLoading(true);
      await marksheetsService.publishMarksheet(marksheet._id);
      if (onUpdate) onUpdate();
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to publish marksheet');
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async (format) => {
    try {
      setLoading(true);
      const blob = format === 'csv'
        ? await marksheetsService.exportMarksheetCsv(marksheet._id)
        : await marksheetsService.exportMarksheetPdf(marksheet._id);
      downloadBlob(blob, `${marksheet.className || 'marksheet'}-${marksheet.section || 'all'}.${format}`);
      setError('');
    } catch (err) {
      setError(err.message || `Failed to export ${format.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvPicker = () => {
    if (csvInputRef.current) csvInputRef.current.click();
  };

  const handleCsvImport = async (event) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');
      setImportSummary(null);
      const result = await marksheetsService.importMarksheetCsv(marksheet._id, file);
      setImportSummary(result);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to import CSV');
    } finally {
      setLoading(false);
      if (event.target) event.target.value = '';
    }
  };

  const renderStatusPill = (value) => {
    const text = String(value || '').trim();
    if (!text) return <span className="text-slate-400">-</span>;
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">{text}</span>;
  };

  const renderMobileCard = (row, idx) => {
    const subjectValues = (row.subjectMarks || []).map((sm, subjectIndex) => {
      const subject = marksheet.subjects?.[subjectIndex] || sm.subject;
      const subjectName = subject?.name || subject?.subject?.name || `Subject ${subjectIndex + 1}`;

      return (
        <div key={sm.subject} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-900">{subjectName}</div>
            {renderStatusPill(sm.marks ?? '')}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-lg bg-white px-2 py-2 border border-slate-200">Marks: {String(sm.marks ?? '-')}</div>
            <div className="rounded-lg bg-white px-2 py-2 border border-slate-200">Grade: {String(sm.grade || '-')}</div>
          </div>
        </div>
      );
    });

    return (
      <div key={row.student?._id || row.student || idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900">{row.student?.user?.name || 'N/A'}</div>
            <div className="text-xs text-slate-500">{row.student?.studentId || row.student?._id || 'Student'}</div>
          </div>
          <div className="text-xs text-slate-500">#{idx + 1}</div>
        </div>

        <div className="mt-4 space-y-3">
          {activeTab === 'marks' && subjectValues}

          {activeTab === 'gr' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-900">GR Marks</div>
                <div className="text-xs text-slate-500">/ {marksheet.exam?.grMaxMarks || 100}</div>
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-700">{row.grPerformanceMarks || 0}</div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-sm font-medium text-slate-900 mb-2">Teacher Comments</div>
              <div className="text-sm text-slate-600 whitespace-pre-wrap">{row.teacherComments || 'No comment added yet.'}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
            {className} - {marksheet.section || 'Section'}
            </h2>
            <p className="text-sm text-slate-600">{studentCount} students · {subjectCount} subjects</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge()}
            {loading && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 animate-pulse">
                Working...
              </span>
            )}
            {isAdmin && (
              <>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleCsvImport}
                />
                <button
                  onClick={handleCsvPicker}
                  disabled={loading || marksheet.locked || marksheet.published}
                  className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 disabled:opacity-50 text-sm"
                >
                  Import CSV
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 text-sm"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={loading}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 text-sm"
                >
                  Export PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {importSummary?.ok && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-emerald-800 text-sm">
            Imported {importSummary.importedRows || 0} rows, updated {importSummary.updatedMarks || 0} marks, skipped {importSummary.skippedStudents || 0} students and {importSummary.skippedCells || 0} invalid cells.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('marks')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'marks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Marks Entry
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('gr')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'gr'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              General Report
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Comments
            </button>
          </>
        )}
      </div>

      {/* Student Rows Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 md:hidden space-y-3">
          {marksheet.studentRows?.map((row, idx) => renderMobileCard(row, idx))}
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-700">Student</th>
                {activeTab === 'marks' && marksheet.subjects?.map(subj => (
                  <th key={subj._id} className="px-4 py-2 text-center font-semibold text-slate-700">
                    {subj.name?.substring(0, 3).toUpperCase()}
                  </th>
                ))}
                {activeTab === 'gr' && (
                  <th className="px-4 py-2 text-center font-semibold text-slate-700">GR Marks</th>
                )}
                {activeTab === 'comments' && (
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Teacher Comments</th>
                )}
              </tr>
            </thead>
            <tbody>
              {marksheet.studentRows?.map((row, idx) => (
                <tr key={row.student?._id || row.student} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {row.student?.user?.name || 'N/A'}
                  </td>
                  
                  {/* Marks Entry Tab */}
                  {activeTab === 'marks' && row.subjectMarks?.map(sm => (
                    <td key={sm.subject} className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        disabled={marksheet.locked || marksheet.published || !canEditMarks}
                        className="w-16 px-2 py-1 border rounded text-center disabled:bg-slate-100"
                        placeholder="0"
                        value={sm.marks || ''}
                      />
                    </td>
                  ))}

                  {/* GR Tab */}
                  {activeTab === 'gr' && (
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max={marksheet.exam?.grMaxMarks || 100}
                        disabled={marksheet.locked || marksheet.published || !isAdmin}
                        className="w-20 px-2 py-1 border rounded text-center disabled:bg-slate-100"
                        value={row.grPerformanceMarks || 0}
                      />
                      <div className="text-xs text-slate-500 mt-1">
                        / {marksheet.exam?.grMaxMarks || 100}
                      </div>
                    </td>
                  )}

                  {/* Comments Tab */}
                  {activeTab === 'comments' && (
                    <td className="px-4 py-2">
                      <textarea
                        disabled={marksheet.locked || marksheet.published || !canEdit}
                        className="w-full px-2 py-1 border rounded text-sm disabled:bg-slate-100"
                        rows="2"
                        placeholder="Teacher comments..."
                        value={row.teacherComments || ''}
                      />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      {isAdmin && (
        <div className="flex gap-2 p-4 bg-white rounded-lg shadow">
          {!marksheet.locked && !marksheet.published && (
            <button
              onClick={handleLock}
              disabled={loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300"
            >
              {loading ? 'Processing...' : 'Lock Marksheet'}
            </button>
          )}

          {marksheet.locked && !marksheet.published && (
            <>
              <button
                onClick={handleUnlock}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Unlock'}
              </button>
              <button
                onClick={handlePublish}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Publish & Generate Report Cards'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
