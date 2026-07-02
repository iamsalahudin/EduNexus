import { api } from './api';

const API_BASE = '/marksheets';

/**
 * List marksheets for an exam or class
 */
export async function listMarksheets(params = {}) {
  try {
    const response = await api.get(API_BASE, { params });
    return response.data;
  } catch (error) {
    console.error('Error listing marksheets:', error);
    throw error;
  }
}

/**
 * Get marksheet detail with student rows
 */
export async function getMarksheetDetail(marksheetId) {
  try {
    const response = await api.get(`${API_BASE}/${marksheetId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching marksheet:', error);
    throw error;
  }
}

/**
 * Update student marks (teacher updates assigned subjects only)
 * @param {string} marksheetId - Marksheet ID
 * @param {object} payload - { studentId, subjectId, marks, theoryMarks, practicalMarks }
 */
export async function updateStudentMarks(marksheetId, payload) {
  try {
    const response = await api.patch(`${API_BASE}/${marksheetId}/student-marks`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating student marks:', error);
    throw error;
  }
}

/**
 * Update GR (General Report) marks for a student
 * @param {string} marksheetId - Marksheet ID
 * @param {object} payload - { studentId, grPerformanceMarks }
 */
export async function updateGRMarks(marksheetId, payload) {
  try {
    const response = await api.patch(`${API_BASE}/${marksheetId}/gr-marks`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating GR marks:', error);
    throw error;
  }
}

/**
 * Update teacher comments for a student
 * @param {string} marksheetId - Marksheet ID
 * @param {object} payload - { studentId, teacherComments }
 */
export async function updateTeacherComments(marksheetId, payload) {
  try {
    const response = await api.patch(`${API_BASE}/${marksheetId}/teacher-comments`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating teacher comments:', error);
    throw error;
  }
}

/**
 * Lock marksheet (prevent teacher updates)
 */
export async function lockMarksheet(marksheetId) {
  try {
    const response = await api.post(`${API_BASE}/${marksheetId}/lock`);
    return response.data;
  } catch (error) {
    console.error('Error locking marksheet:', error);
    throw error;
  }
}

/**
 * Unlock marksheet (allow teacher edits again)
 */
export async function unlockMarksheet(marksheetId) {
  try {
    const response = await api.post(`${API_BASE}/${marksheetId}/unlock`);
    return response.data;
  } catch (error) {
    console.error('Error unlocking marksheet:', error);
    throw error;
  }
}

/**
 * Publish marksheet (compute results and generate report cards)
 */
export async function publishMarksheet(marksheetId) {
  try {
    const response = await api.post(`${API_BASE}/${marksheetId}/publish`);
    return response.data;
  } catch (error) {
    console.error('Error publishing marksheet:', error);
    throw error;
  }
}

export async function exportMarksheetCsv(marksheetId) {
  try {
    const response = await api.get(`${API_BASE}/${marksheetId}/export/csv`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting marksheet CSV:', error);
    throw error;
  }
}

export async function exportMarksheetPdf(marksheetId) {
  try {
    const response = await api.get(`${API_BASE}/${marksheetId}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting marksheet PDF:', error);
    throw error;
  }
}

export async function importMarksheetCsv(marksheetId, file) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`${API_BASE}/${marksheetId}/import/csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error importing marksheet CSV:', error);
    throw error;
  }
}

/**
 * Batch get marksheets for multiple exams
 */
export async function listMarksheetsByClass(className, examId = null) {
  try {
    const params = { className };
    if (examId) params.examId = examId;
    return listMarksheets(params);
  } catch (error) {
    console.error('Error fetching class marksheets:', error);
    throw error;
  }
}

export default {
  listMarksheets,
  getMarksheetDetail,
  updateStudentMarks,
  updateGRMarks,
  updateTeacherComments,
  lockMarksheet,
  unlockMarksheet,
  publishMarksheet,
  exportMarksheetCsv,
  exportMarksheetPdf,
  importMarksheetCsv,
  listMarksheetsByClass
};
