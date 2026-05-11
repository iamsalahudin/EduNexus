<<<<<<< HEAD
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import reportCardsService from '@/services/reportCardsService';

export default function ReceptionistResultsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'Reception' && user.role !== 'Receptionist') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        // Fetch all published results
        const result = await reportCardsService.listReportCards({
          status: 'published'
        });
        setResults(result.reportCards || []);
      } catch (err) {
        setError('Failed to load results');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const filteredResults = results.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      r.student?.user?.name?.toLowerCase().includes(query) ||
      r.student?.studentId?.toLowerCase().includes(query) ||
      r.exam?.className?.toLowerCase().includes(query) ||
      r.exam?.name?.toLowerCase().includes(query)
    );
  });

  if (!user || (user.role !== 'Reception' && user.role !== 'Receptionist')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600 mt-1">Search and download published student results</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!selectedResult ? (
          // Results Search & List
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by student name, ID, class, or exam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Search
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">Loading results...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No results found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Student</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Student ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Class</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Exam</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Marks</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Percentage</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Grade</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result, idx) => (
                        <tr
                          key={result._id}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-3 text-gray-900">
                            {result.student?.user?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {result.student?.studentId || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {result.exam?.className || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {result.exam?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {result.totalMarks}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {result.percentage?.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              result.grade === 'A' || result.grade === 'A+' ? 'bg-green-100 text-green-800' :
                              result.grade === 'B' || result.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                              result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedResult(result)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Result Detail
          <div>
            <button
              onClick={() => setSelectedResult(null)}
              className="mb-4 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              ← Back to Results
            </button>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Student & Exam Info */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Result Details</h2>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Student Name</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.student?.user?.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Student ID</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.student?.studentId}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Class</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.exam?.className}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Exam</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.exam?.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Published</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedResult.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Marks & Grade */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-full text-2xl font-bold mb-4 ${
                      selectedResult.grade === 'A' || selectedResult.grade === 'A+' ? 'bg-green-100 text-green-800' :
                      selectedResult.grade === 'B' || selectedResult.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                      selectedResult.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedResult.grade}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Total Marks</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {selectedResult.totalMarks}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Percentage</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedResult.percentage?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments */}
              {selectedResult.comments && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Teacher Comments</h3>
                  <p className="text-sm text-gray-700 italic">
                    {selectedResult.comments}
                  </p>
                </div>
              )}

              {/* Download Button */}
              <div className="mt-6 pt-6 border-t flex gap-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => alert('PDF download coming soon')}
                >
                  Download PDF
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  onClick={() => alert('Print feature coming soon')}
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
=======
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import reportCardsService from '@/services/reportCardsService';

export default function ReceptionistResultsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'Reception' && user.role !== 'Receptionist') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        // Fetch all published results
        const result = await reportCardsService.listReportCards({
          status: 'published'
        });
        setResults(result.reportCards || []);
      } catch (err) {
        setError('Failed to load results');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  const filteredResults = results.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      r.student?.user?.name?.toLowerCase().includes(query) ||
      r.student?.studentId?.toLowerCase().includes(query) ||
      r.exam?.className?.toLowerCase().includes(query) ||
      r.exam?.name?.toLowerCase().includes(query)
    );
  });

  if (!user || (user.role !== 'Reception' && user.role !== 'Receptionist')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600 mt-1">Search and download published student results</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!selectedResult ? (
          // Results Search & List
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by student name, ID, class, or exam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Search
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Found {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">Loading results...</p>
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No results found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Student</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Student ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Class</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Exam</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Marks</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Percentage</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Grade</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.map((result, idx) => (
                        <tr
                          key={result._id}
                          className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-4 py-3 text-gray-900">
                            {result.student?.user?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {result.student?.studentId || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {result.exam?.className || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {result.exam?.name || '-'}
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-900">
                            {result.totalMarks}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-700">
                            {result.percentage?.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              result.grade === 'A' || result.grade === 'A+' ? 'bg-green-100 text-green-800' :
                              result.grade === 'B' || result.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                              result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {result.grade}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setSelectedResult(result)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Result Detail
          <div>
            <button
              onClick={() => setSelectedResult(null)}
              className="mb-4 px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              ← Back to Results
            </button>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Student & Exam Info */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Result Details</h2>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Student Name</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.student?.user?.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Student ID</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.student?.studentId}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Class</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.exam?.className}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Exam</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.exam?.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Published</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(selectedResult.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Marks & Grade */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-full text-2xl font-bold mb-4 ${
                      selectedResult.grade === 'A' || selectedResult.grade === 'A+' ? 'bg-green-100 text-green-800' :
                      selectedResult.grade === 'B' || selectedResult.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                      selectedResult.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedResult.grade}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-600">Total Marks</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {selectedResult.totalMarks}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-600">Percentage</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {selectedResult.percentage?.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments */}
              {selectedResult.comments && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Teacher Comments</h3>
                  <p className="text-sm text-gray-700 italic">
                    {selectedResult.comments}
                  </p>
                </div>
              )}

              {/* Download Button */}
              <div className="mt-6 pt-6 border-t flex gap-2">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => alert('PDF download coming soon')}
                >
                  Download PDF
                </button>
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  onClick={() => alert('Print feature coming soon')}
                >
                  Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
