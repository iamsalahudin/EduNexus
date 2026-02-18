import { api } from '@/services/api'

// --- Students roster ---
export async function fetchStudents({ classId, section, q, limit } = {}) {
  const res = await api.get('/students', {
    params: {
      ...(classId ? { classId } : {}),
      ...(section ? { section } : {}),
      ...(q ? { q } : {}),
      ...(limit ? { limit } : {})
    }
  })
  return res.data
}

// --- Student attendance ---
export async function fetchStudentAttendance({ studentId, classId, date, fromDate, toDate } = {}) {
  const res = await api.get('/attendance', {
    params: {
      ...(studentId ? { studentId } : {}),
      ...(classId ? { classId } : {}),
      ...(date ? { date } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {})
    }
  })
  return res.data
}

export async function fetchStudentAttendanceSummary({ classId, fromDate, toDate } = {}) {
  const res = await api.get('/attendance/summary', {
    params: {
      ...(classId ? { classId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {})
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

// --- Staff/Teacher attendance ---
export async function fetchStaffAttendance({ userId, date, fromDate, toDate } = {}) {
  const res = await api.get('/staff-attendance', {
    params: {
      ...(userId ? { userId } : {}),
      ...(date ? { date } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {})
    }
  })
  return res.data
}

export async function fetchStaffAttendanceSummary({ userId, fromDate, toDate } = {}) {
  const res = await api.get('/staff-attendance/summary', {
    params: {
      ...(userId ? { userId } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {})
    }
  })
  return res.data
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
