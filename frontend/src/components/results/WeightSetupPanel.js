<<<<<<< HEAD
'use client';

import React, { useState, useEffect } from 'react';

/**
 * WeightSetupPanel: Configure exam result component weights
 * Ensures exam + attendance + homework + gr = 100%
 * Used in admin/principal exam configuration pages
 *
 * @param {object} exam - Exam object with resultWeights
 * @param {function} onSave - Callback when weights are updated
 * @param {boolean} disabled - Whether weights can be edited
 */
export default function WeightSetupPanel({ exam, onSave, disabled = false }) {
  const [weights, setWeights] = useState({
    exam: 40,
    attendance: 20,
    homework: 20,
    gr: 20
  });
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (exam?.resultWeights) {
      setWeights(exam.resultWeights);
      setIsDirty(false);
    }
  }, [exam]);

  const handleWeightChange = (component, value) => {
    const numValue = Number(value) || 0;
    const newWeights = { ...weights, [component]: numValue };
    setWeights(newWeights);
    setIsDirty(true);

    // Validate sum
    const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (sum === 100) {
      setError('');
    } else {
      setError(`Weights must sum to 100 (currently: ${sum}%)`);
    }
  };

  const handleSave = async () => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
      setError(`Weights must sum to exactly 100 (currently: ${sum}%)`);
      return;
    }

    if (onSave) {
      try {
        await onSave(weights);
        setIsDirty(false);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to save weights');
      }
    }
  };

  const reset = () => {
    if (exam?.resultWeights) {
      setWeights(exam.resultWeights);
    } else {
      setWeights({ exam: 40, attendance: 20, homework: 20, gr: 20 });
    }
    setIsDirty(false);
    setError('');
  };

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="card p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Result Weights Configuration</h3>
        <p className="text-sm text-gray-600 mt-1">Set the percentage contribution of each component to the final result</p>
      </div>

      {/* Weights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Exam Component */}
        <div className="border rounded-lg p-3 bg-blue-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Marks
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.exam}
            onChange={(e) => handleWeightChange('exam', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>

        {/* Attendance Component */}
        <div className="border rounded-lg p-3 bg-green-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attendance
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.attendance}
            onChange={(e) => handleWeightChange('attendance', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>

        {/* Homework Component */}
        <div className="border rounded-lg p-3 bg-yellow-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Homework Performance
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.homework}
            onChange={(e) => handleWeightChange('homework', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>

        {/* GR Component */}
        <div className="border rounded-lg p-3 bg-purple-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            General Report (GR)
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.gr}
            onChange={(e) => handleWeightChange('gr', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Total Sum Indicator */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Weight:</span>
          <span className={`text-lg font-bold ${sum === 100 ? 'text-green-600' : 'text-red-600'}`}>
            {sum}%
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${sum === 100 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(sum, 100)}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Lock Warning */}
      {disabled && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">⚠️ Weights are locked and cannot be edited after result publication</p>
        </div>
      )}

      {/* Action Buttons */}
      {!disabled && (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!isDirty || error || sum !== 100}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            Save Weights
          </button>
          <button
            onClick={reset}
            disabled={!isDirty}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
=======
'use client';

import React, { useState, useEffect } from 'react';

/**
 * WeightSetupPanel: Configure exam result component weights
 * Ensures exam + attendance + homework + gr = 100%
 * Used in admin/principal exam configuration pages
 *
 * @param {object} exam - Exam object with resultWeights
 * @param {function} onSave - Callback when weights are updated
 * @param {boolean} disabled - Whether weights can be edited
 */
export default function WeightSetupPanel({ exam, onSave, disabled = false }) {
  const [weights, setWeights] = useState({
    exam: 40,
    attendance: 20,
    homework: 20,
    gr: 20
  });
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (exam?.resultWeights) {
      setWeights(exam.resultWeights);
      setIsDirty(false);
    }
  }, [exam]);

  const handleWeightChange = (component, value) => {
    const numValue = Number(value) || 0;
    const newWeights = { ...weights, [component]: numValue };
    setWeights(newWeights);
    setIsDirty(true);

    // Validate sum
    const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
    if (sum === 100) {
      setError('');
    } else {
      setError(`Weights must sum to 100 (currently: ${sum}%)`);
    }
  };

  const handleSave = async () => {
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (Math.abs(sum - 100) > 0.01) {
      setError(`Weights must sum to exactly 100 (currently: ${sum}%)`);
      return;
    }

    if (onSave) {
      try {
        await onSave(weights);
        setIsDirty(false);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to save weights');
      }
    }
  };

  const reset = () => {
    if (exam?.resultWeights) {
      setWeights(exam.resultWeights);
    } else {
      setWeights({ exam: 40, attendance: 20, homework: 20, gr: 20 });
    }
    setIsDirty(false);
    setError('');
  };

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);

  return (
    <div className="card p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Result Weights Configuration</h3>
        <p className="text-sm text-gray-600 mt-1">Set the percentage contribution of each component to the final result</p>
      </div>

      {/* Weights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Exam Component */}
        <div className="border rounded-lg p-3 bg-blue-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exam Marks
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.exam}
            onChange={(e) => handleWeightChange('exam', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>

        {/* Attendance Component */}
        <div className="border rounded-lg p-3 bg-green-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Attendance
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.attendance}
            onChange={(e) => handleWeightChange('attendance', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>

        {/* Homework Component */}
        <div className="border rounded-lg p-3 bg-yellow-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Homework Performance
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.homework}
            onChange={(e) => handleWeightChange('homework', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>

        {/* GR Component */}
        <div className="border rounded-lg p-3 bg-purple-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            General Report (GR)
            <span className="text-xs text-gray-500 ml-1">%</span>
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={weights.gr}
            onChange={(e) => handleWeightChange('gr', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Total Sum Indicator */}
      <div className="mb-4 p-3 rounded-lg bg-gray-50 border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Weight:</span>
          <span className={`text-lg font-bold ${sum === 100 ? 'text-green-600' : 'text-red-600'}`}>
            {sum}%
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${sum === 100 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(sum, 100)}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Lock Warning */}
      {disabled && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">⚠️ Weights are locked and cannot be edited after result publication</p>
        </div>
      )}

      {/* Action Buttons */}
      {!disabled && (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!isDirty || error || sum !== 100}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            Save Weights
          </button>
          <button
            onClick={reset}
            disabled={!isDirty}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:bg-gray-200"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}
>>>>>>> 840ff67df38f58f0f98a7d641b0485545e8e9854
