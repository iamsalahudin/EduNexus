import axios from 'axios';

const API_BASE = '/api/grade-scales';

/**
 * List all grade scales
 */
export async function listGradeScales(params = {}) {
  try {
    const response = await axios.get(API_BASE, { params });
    return response.data;
  } catch (error) {
    console.error('Error listing grade scales:', error);
    throw error;
  }
}

/**
 * Get a specific grade scale
 */
export async function getGradeScale(id) {
  try {
    const response = await axios.get(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching grade scale:', error);
    throw error;
  }
}

/**
 * Create a new grade scale
 * @param {object} payload - { className, grades, passingPercentage, weights, allowExamLevelOverride }
 */
export async function createGradeScale(payload) {
  try {
    const response = await axios.post(API_BASE, payload);
    return response.data;
  } catch (error) {
    console.error('Error creating grade scale:', error);
    throw error;
  }
}

/**
 * Update a grade scale
 */
export async function updateGradeScale(id, payload) {
  try {
    const response = await axios.patch(`${API_BASE}/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating grade scale:', error);
    throw error;
  }
}

/**
 * Delete a grade scale (soft delete - marks as inactive)
 */
export async function deleteGradeScale(id) {
  try {
    const response = await axios.delete(`${API_BASE}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting grade scale:', error);
    throw error;
  }
}

/**
 * Get the effective grade scale for a class
 * Falls back to school-wide if no class-specific scale exists
 */
export async function resolveGradeScaleForClass(className) {
  try {
    const response = await axios.get(`${API_BASE}/resolve/for-class`, {
      params: { className }
    });
    return response.data;
  } catch (error) {
    console.error('Error resolving grade scale:', error);
    throw error;
  }
}

/**
 * List active grade scales only
 */
export async function listActiveGradeScales() {
  return listGradeScales({ active: true });
}

/**
 * List grade scales for a specific class
 */
export async function listGradeScalesForClass(className) {
  return listGradeScales({ className, active: true });
}

export default {
  listGradeScales,
  getGradeScale,
  createGradeScale,
  updateGradeScale,
  deleteGradeScale,
  resolveGradeScaleForClass,
  listActiveGradeScales,
  listGradeScalesForClass
};
