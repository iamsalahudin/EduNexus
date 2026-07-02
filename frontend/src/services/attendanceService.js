import { api } from '@/services/api'

// --- Students roster ---
export async function fetchStudents({ classId, section, q, limit, status } = {}) {
  const res = await api.get('/students', {
    params: {
      ...(classId ? { classId } : {}),
      ...(section ? { section } : {}),
      ...(q ? { q } : {}),
      ...(limit ? { limit } : {}),
      ...(status ? { status } : {})
    }
  })
  return res.data
}

// --- Student attendance ---
export async function fetchStudentAttendance({ studentId, childId, classId, section, date, fromDate, toDate, period, month, year } = {}) {
  const res = await api.get('/attendance', {
    params: {
      ...(studentId ? { studentId } : {}),
      ...(childId ? { childId } : {}),
      ...(classId ? { classId } : {}),
      ...(section ? { section } : {}),
      ...(date ? { date } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(period ? { period } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {})
    }
  })
  return res.data
}

export async function fetchStudentAttendanceSummary({ classId, studentId, childId, fromDate, toDate, period, month, year } = {}) {
  const res = await api.get('/attendance/summary', {
    params: {
      ...(classId ? { classId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(childId ? { childId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(period ? { period } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {})
    }
  })
  return res.data
}

export async function markStudentAttendance({ date, entries }) {
  const res = await api.post('/attendance', { date, entries })
  return res.data
}

export async function updateStudentAttendance(id, { status, remarks }) {
  const res = await api.patch(`/attendance/${id}`, { status, remarks })
  return res.data
}

export async function deleteStudentAttendance(id) {
  const res = await api.delete(`/attendance/${id}`)
  return res.data
}

export async function exportStudentAttendance({ studentId, childId, classId, fromDate, toDate, period, month, year, format = 'csv' } = {}) {
  const res = await api.get('/attendance/export', {
    params: {
      ...(studentId ? { studentId } : {}),
      ...(childId ? { childId } : {}),
      ...(classId ? { classId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(period ? { period } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
      format
    },
    responseType: 'blob'
  })
  return res.data
}

// --- Staff/Teacher attendance ---
export async function fetchStaffAttendance({ role, userId, date, fromDate, toDate, period, month, year } = {}) {
  const res = await api.get('/staff-attendance', {
    params: {
      ...(role ? { role } : {}),
      ...(userId ? { userId } : {}),
      ...(date ? { date } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(period ? { period } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {})
    }
  })
  return res.data
}

export async function fetchStaffAttendanceSummary({ role, userId, fromDate, toDate, period, month, year } = {}) {
  const res = await api.get('/staff-attendance/summary', {
    params: {
      ...(role ? { role } : {}),
      ...(userId ? { userId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(period ? { period } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {})
    }
  })
  // The staff-attendance controller wraps the payload as { success, message, data: { summary, perUser } }.
  // Unwrap so callers can read `.summary`/`.perUser` directly (matching the student summary shape).
  return res.data?.data ?? res.data
}

export async function markStaffAttendance({ date, status, remarks, userId } = {}) {
  const res = await api.post('/staff-attendance', { date, status, remarks, userId })
  return res.data
}

export async function updateStaffAttendance(id, { status, remarks }) {
  const res = await api.patch(`/staff-attendance/${id}`, { status, remarks })
  return res.data
}

export async function deleteStaffAttendance(id) {
  const res = await api.delete(`/staff-attendance/${id}`)
  return res.data
}

export async function exportStaffAttendance({ role, userId, fromDate, toDate, period, month, year, format = 'csv' } = {}) {
  const res = await api.get('/staff-attendance/export', {
    params: {
      ...(role ? { role } : {}),
      ...(userId ? { userId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(period ? { period } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
      format
    },
    responseType: 'blob'
  })
  return res.data
}

// --- Attendance setup assignments ---
export async function fetchAttendanceAssignments() {
  const res = await api.get('/attendance/setup/assignments')
  return res.data
}

export async function saveAttendanceAssignment({ id, teacherId, className, section }) {
  const payload = {
    teacherId,
    className,
    section: section ?? '',
  }

  const res = id
    ? await api.put(`/attendance/setup/assignments/${id}`, payload)
    : await api.post('/attendance/setup/assignments', payload)

  return res.data
}

export async function deleteAttendanceAssignment(id) {
  const res = await api.delete(`/attendance/setup/assignments/${id}`)
  return res.data
}

export async function fetchAttendanceReport({ reportType, classId, fromDate, toDate, period, month, year } = {}) {
  const res = await api.get('/attendance/reports', {
    params: {
      ...(reportType ? { reportType } : {}),
      ...(classId ? { classId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
      ...(period ? { period } : {}),
      ...(month ? { month } : {}),
      ...(year ? { year } : {})
    }
  })
  return res.data
}

// --- Attendance leave-requests (student/parent) ---
export async function submitLeaveRequest({ fromDate, toDate, type = 'full-day', reason, childId } = {}) {
  const res = await api.post('/attendance/leave-requests', { fromDate, toDate, type, reason, childId });
  return res.data;
}

export async function fetchLeaveRequests({ studentId, status } = {}) {
  const res = await api.get('/attendance/leave-requests', { params: { ...(studentId ? { studentId } : {}), ...(status ? { status } : {}) } });
  return res.data;
}

export async function editLeaveRequest(id, payload) {
  const res = await api.patch(`/attendance/leave-requests/${id}`, payload);
  return res.data;
}
