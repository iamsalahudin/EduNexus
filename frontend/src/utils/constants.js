/**
 * Frontend Constants - Centralized status, state, and configuration values
 */

export const DIARY_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft'
}

export const DIARY_STATUS_DISPLAY = {
  [DIARY_STATUS.PUBLISHED]: 'Published',
  [DIARY_STATUS.DRAFT]: 'Draft'
}

export const DIARY_STATUS_OPTIONS = [
  { value: DIARY_STATUS.PUBLISHED, label: 'Published' },
  { value: DIARY_STATUS.DRAFT, label: 'Draft' }
]

export const TRANSPORT_PAYMENT_STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  PENDING: 'pending'
}

export const TRANSPORT_PAYMENT_STATUS_DISPLAY = {
  [TRANSPORT_PAYMENT_STATUS.PAID]: 'Paid',
  [TRANSPORT_PAYMENT_STATUS.PARTIAL]: 'Partial',
  [TRANSPORT_PAYMENT_STATUS.OVERDUE]: 'Overdue',
  [TRANSPORT_PAYMENT_STATUS.PENDING]: 'Pending'
}

export const TRANSPORT_PAYMENT_STATUS_OPTIONS = [
  { value: TRANSPORT_PAYMENT_STATUS.PAID, label: 'Paid' },
  { value: TRANSPORT_PAYMENT_STATUS.PARTIAL, label: 'Partial' },
  { value: TRANSPORT_PAYMENT_STATUS.OVERDUE, label: 'Overdue' },
  { value: TRANSPORT_PAYMENT_STATUS.PENDING, label: 'Pending' }
]

export const TRANSPORT_REQUEST_STATUS = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  PENDING: 'pending'
}

export const TRANSPORT_REQUEST_STATUS_DISPLAY = {
  [TRANSPORT_REQUEST_STATUS.APPROVED]: 'Approved',
  [TRANSPORT_REQUEST_STATUS.REJECTED]: 'Rejected',
  [TRANSPORT_REQUEST_STATUS.CANCELLED]: 'Cancelled',
  [TRANSPORT_REQUEST_STATUS.PENDING]: 'Pending'
}

export const TRANSPORT_REQUEST_STATUS_OPTIONS = [
  { value: TRANSPORT_REQUEST_STATUS.APPROVED, label: 'Approved' },
  { value: TRANSPORT_REQUEST_STATUS.REJECTED, label: 'Rejected' },
  { value: TRANSPORT_REQUEST_STATUS.CANCELLED, label: 'Cancelled' },
  { value: TRANSPORT_REQUEST_STATUS.PENDING, label: 'Pending' }
]

export const SUBJECT_ROLE = {
  STUDENT: 'Student',
  TEACHER: 'Teacher'
}

export const SUBJECT_ROLE_OPTIONS = [
  { value: SUBJECT_ROLE.STUDENT, label: 'Student' },
  { value: SUBJECT_ROLE.TEACHER, label: 'Teacher' }
]

export const HOMEWORK_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  CLOSED: 'closed'
}

export const HOMEWORK_STATUS_DISPLAY = {
  [HOMEWORK_STATUS.PUBLISHED]: 'Published',
  [HOMEWORK_STATUS.DRAFT]: 'Draft',
  [HOMEWORK_STATUS.CLOSED]: 'Closed'
}

export const HOMEWORK_STATUS_OPTIONS = [
  { value: HOMEWORK_STATUS.PUBLISHED, label: 'Published' },
  { value: HOMEWORK_STATUS.DRAFT, label: 'Draft' },
  { value: HOMEWORK_STATUS.CLOSED, label: 'Closed' }
]

export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused'
}

export const ATTENDANCE_STATUS_DISPLAY = {
  [ATTENDANCE_STATUS.PRESENT]: 'Present',
  [ATTENDANCE_STATUS.ABSENT]: 'Absent',
  [ATTENDANCE_STATUS.LATE]: 'Late',
  [ATTENDANCE_STATUS.EXCUSED]: 'Excused'
}

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: ATTENDANCE_STATUS.PRESENT, label: 'Present' },
  { value: ATTENDANCE_STATUS.ABSENT, label: 'Absent' },
  { value: ATTENDANCE_STATUS.LATE, label: 'Late' },
  { value: ATTENDANCE_STATUS.EXCUSED, label: 'Excused' }
]

export const COMPLAINT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
}

export const COMPLAINT_STATUS_DISPLAY = {
  [COMPLAINT_STATUS.OPEN]: 'Open',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'In Progress',
  [COMPLAINT_STATUS.RESOLVED]: 'Resolved',
  [COMPLAINT_STATUS.CLOSED]: 'Closed'
}

export const COMPLAINT_STATUS_OPTIONS = [
  { value: COMPLAINT_STATUS.OPEN, label: 'Open' },
  { value: COMPLAINT_STATUS.IN_PROGRESS, label: 'In Progress' },
  { value: COMPLAINT_STATUS.RESOLVED, label: 'Resolved' },
  { value: COMPLAINT_STATUS.CLOSED, label: 'Closed' }
]

export const TEACHER_EMPLOYMENT_STATUS = {
  WORKING: 'Working',
  RESIGNED: 'Resigned'
}

export const TEACHER_EMPLOYMENT_STATUS_OPTIONS = [
  { value: TEACHER_EMPLOYMENT_STATUS.WORKING, label: 'Working' },
  { value: TEACHER_EMPLOYMENT_STATUS.RESIGNED, label: 'Resigned' }
]

export const FINANCE_PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled'
}

export const FINANCE_PAYMENT_STATUS_DISPLAY = {
  [FINANCE_PAYMENT_STATUS.PAID]: 'Paid',
  [FINANCE_PAYMENT_STATUS.PENDING]: 'Pending',
  [FINANCE_PAYMENT_STATUS.OVERDUE]: 'Overdue',
  [FINANCE_PAYMENT_STATUS.CANCELLED]: 'Cancelled'
}

export const FINANCE_PAYMENT_STATUS_OPTIONS = [
  { value: FINANCE_PAYMENT_STATUS.PAID, label: 'Paid' },
  { value: FINANCE_PAYMENT_STATUS.PENDING, label: 'Pending' },
  { value: FINANCE_PAYMENT_STATUS.OVERDUE, label: 'Overdue' },
  { value: FINANCE_PAYMENT_STATUS.CANCELLED, label: 'Cancelled' }
]

export const SYSTEM_ROLES = ['Admin', 'HR', 'Reception', 'Principal', 'Teacher']

export const getStatusColor = (status, type) => {
  const colorMap = {
    // Diary & Homework statuses
    published: 'inline-flex px-2 py-1 rounded text-xs border border-green-200 text-green-700 bg-green-50',
    draft: 'inline-flex px-2 py-1 rounded text-xs border border-gray-200 text-gray-700 bg-gray-50',
    closed: 'inline-flex px-2 py-1 rounded text-xs border border-red-200 text-red-700 bg-red-50',
    // Transport payment & Finance payment statuses
    paid: 'inline-flex px-2 py-1 rounded text-xs border border-green-200 text-green-700 bg-green-50',
    partial: 'inline-flex px-2 py-1 rounded text-xs border border-yellow-200 text-yellow-700 bg-yellow-50',
    overdue: 'inline-flex px-2 py-1 rounded text-xs border border-red-200 text-red-700 bg-red-50',
    pending: 'inline-flex px-2 py-1 rounded text-xs border border-gray-200 text-gray-700 bg-gray-50',
    cancelled: 'inline-flex px-2 py-1 rounded text-xs border border-gray-200 text-gray-700 bg-gray-50',
    // Transport request statuses
    approved: 'inline-flex px-2 py-1 rounded text-xs border border-green-200 text-green-700 bg-green-50',
    rejected: 'inline-flex px-2 py-1 rounded text-xs border border-red-200 text-red-700 bg-red-50',
    // Attendance statuses
    present: 'inline-flex px-2 py-1 rounded text-xs border border-green-200 text-green-700 bg-green-50',
    absent: 'inline-flex px-2 py-1 rounded text-xs border border-red-200 text-red-700 bg-red-50',
    late: 'inline-flex px-2 py-1 rounded text-xs border border-yellow-200 text-yellow-700 bg-yellow-50',
    excused: 'inline-flex px-2 py-1 rounded text-xs border border-blue-200 text-blue-700 bg-blue-50',
    // Complaint statuses
    open: 'inline-flex px-2 py-1 rounded text-xs border border-blue-200 text-blue-700 bg-blue-50',
    in_progress: 'inline-flex px-2 py-1 rounded text-xs border border-yellow-200 text-yellow-700 bg-yellow-50',
    resolved: 'inline-flex px-2 py-1 rounded text-xs border border-green-200 text-green-700 bg-green-50'
  }
  return colorMap[status] || colorMap.pending
}
