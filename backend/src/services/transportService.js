const mongoose = require('mongoose');
const { Student, Teacher } = require('../models');

const MANAGER_ROLES = new Set(['Admin', 'Principal', 'Reception']);
const REQUESTER_ROLES = new Set(['Student', 'Teacher', 'Parent']);

function isManagerRole(role) {
  return MANAGER_ROLES.has(String(role || ''));
}

function canConfigureRoutes(role) {
  return role === 'Admin' || role === 'Principal';
}

function canDeleteAsRole(role) {
  return role === 'Admin' || role === 'Reception';
}

function normalizeStatus(value, allowed, fallback) {
  const lower = String(value || '').trim().toLowerCase();
  if (allowed.includes(lower)) return lower;
  return fallback;
}

function parsePositiveInt(value, fallback) {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function toObjectId(value) {
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

async function resolveTransportSubject({ requester, subjectRole, studentId, teacherId, teacherUserId }) {
  const role = String(requester?.role || '');

  if (role === 'Student') {
    const student = await Student.findOne({ user: requester.id }).select('_id user').lean();
    if (!student) return { error: 'Student profile not found' };
    return {
      subjectRole: 'Student',
      userId: student.user,
      studentId: student._id,
      teacherId: null
    };
  }

  if (role === 'Teacher') {
    const teacher = await Teacher.findOne({ user: requester.id }).select('_id user').lean();
    if (!teacher) return { error: 'Teacher profile not found' };
    return {
      subjectRole: 'Teacher',
      userId: teacher.user,
      studentId: null,
      teacherId: teacher._id
    };
  }

  if (role === 'Parent') {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return { error: 'Valid studentId is required for parent requests' };
    }

    const student = await Student.findOne({ _id: studentId, parents: requester.id }).select('_id user').lean();
    if (!student) return { error: 'Student not found for parent or not linked' };

    return {
      subjectRole: 'Student',
      userId: student.user,
      studentId: student._id,
      teacherId: null
    };
  }

  if (isManagerRole(role)) {
    const normalizedRole = String(subjectRole || '').trim();
    if (!normalizedRole || !['Student', 'Teacher'].includes(normalizedRole)) {
      return { error: 'subjectRole must be Student or Teacher' };
    }

    if (normalizedRole === 'Student') {
      if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
        return { error: 'Valid studentId is required for Student enrollment' };
      }
      const student = await Student.findById(studentId).select('_id user').lean();
      if (!student) return { error: 'Student not found' };
      return {
        subjectRole: 'Student',
        userId: student.user,
        studentId: student._id,
        teacherId: null
      };
    }

    let teacher = null;
    if (teacherId && mongoose.Types.ObjectId.isValid(teacherId)) {
      teacher = await Teacher.findOne({ _id: teacherId }).select('_id user').lean();
    } else if (teacherUserId && mongoose.Types.ObjectId.isValid(teacherUserId)) {
      teacher = await Teacher.findOne({ user: teacherUserId }).select('_id user').lean();
    }
    if (!teacher) return { error: 'Valid teacherId is required for Teacher enrollment' };
    return {
      subjectRole: 'Teacher',
      userId: teacher.user,
      studentId: null,
      teacherId: teacher._id
    };
  }

  if (REQUESTER_ROLES.has(role)) {
    return { error: 'Unsupported requester context' };
  }

  return { error: 'Role is not allowed for transport action' };
}

module.exports = {
  MANAGER_ROLES,
  REQUESTER_ROLES,
  isManagerRole,
  canConfigureRoutes,
  canDeleteAsRole,
  normalizeStatus,
  parsePositiveInt,
  toObjectId,
  resolveTransportSubject
};
