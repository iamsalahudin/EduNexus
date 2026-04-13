'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import reportCardsService from '@/services/reportCardsService';

export default function StudentResultsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'Student') {
      router.push('/');
    }
  }, [user, router]);

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
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

    if (user?.id) {
      loadResults();
    }
  }, [user]);

  if (!user || user.role !== 'Student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
          <p className="text-gray-600 mt-1">View your published exam results</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading && !results.length && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading your results...</p>
          </div>
        )}

        {!selectedResult ? (
          // Results List
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-600">No published results available yet</p>
              </div>
            ) : (
              results.map((result) => (
                <button
                  key={result._id}
                  onClick={() => setSelectedResult(result)}
                  className="w-full text-left bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.subject || 'Overall Result'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {result.exam?.name} • {result.exam?.className}
                      </p>
                      <div className="flex gap-4 mt-3 text-sm">
                        <span className="text-gray-700">
                          <strong>Marks:</strong> {result.totalMarks}
                        </span>
                        <span className="text-gray-700">
                          <strong>Percentage:</strong> {result.percentage?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        result.grade === 'A' || result.grade === 'A+' ? 'bg-green-100 text-green-800' :
                        result.grade === 'B' || result.grade === 'B+' ? 'bg-blue-100 text-blue-800' :
                        result.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.grade}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(result.publishedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
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
                {/* Left: Basic Info */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {selectedResult.subject || 'Result Card'}
                  </h2>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-600">Exam</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.exam?.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600">Class</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedResult.exam?.className}
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
                        <p className="text-2xl font-bold text-gray-900">
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
              <div className="mt-6 pt-6 border-t">
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  onClick={() => alert('Download feature coming soon')}
                >
                  Download Result Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
