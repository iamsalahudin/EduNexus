const POLICY_VERSION = '2026-04-15-v1';

const CANONICAL_ROLES = [
  'Admin',
  'Principal',
  'Accountant',
  'HR',
  'Reception',
  'Teacher',
  'Student',
  'Parent',
];

const ROLE_ALIASES = {
  principle: 'Principal',
  receptionist: 'Reception',
  accountant: 'Accountant',
};

const MODULES = [
  'attendance',
  'marksheets',
  'exams',
  'reportCards',
  'timetables',
  'homeworks',
  'fees',
  'salary',
  'transport',
  'complaints',
  'notifications',
  'students',
  'teachers',
  'users',
  'classes',
  'subjects',
  'dailyDiary',
  'staffAttendance',
];

const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];

function normalizeRole(role) {
  if (role === null || role === undefined) return role;
  const raw = String(role).trim();
  if (!raw) return raw;
  const lower = raw.toLowerCase();
  if (ROLE_ALIASES[lower]) return ROLE_ALIASES[lower];

  const canonicalByLower = new Map(CANONICAL_ROLES.map((name) => [name.toLowerCase(), name]));
  return canonicalByLower.get(lower) || raw;
}

function createMethodMap(overrides = {}) {
  const base = {};
  for (const method of METHODS) base[method] = false;
  for (const [method, value] of Object.entries(overrides)) {
    base[String(method).toUpperCase()] = Boolean(value);
  }
  return base;
}

function createModule(scope = 'none', methodOverrides = {}, notes = '') {
  return {
    scope,
    notes,
    methods: createMethodMap(methodOverrides),
  };
}

function createEmptyModules() {
  const modules = {};
  for (const moduleName of MODULES) {
    modules[moduleName] = createModule('none');
  }
  return modules;
}

function applyModuleOverrides(baseModules, overridesByModule = {}) {
  const modules = { ...baseModules };
  for (const [moduleName, override] of Object.entries(overridesByModule)) {
    const existing = modules[moduleName] || createModule('none');
    modules[moduleName] = {
      ...existing,
      ...override,
      methods: createMethodMap({
        ...(existing.methods || {}),
        ...((override && override.methods) || {}),
      }),
    };
  }
  return modules;
}

function enforceAdminOnlyPost(roleName, modules) {
  if (roleName === 'Admin') return modules;
  const next = { ...modules };
  for (const moduleName of Object.keys(next)) {
    next[moduleName] = {
      ...next[moduleName],
      methods: {
        ...next[moduleName].methods,
        POST: false,
      },
    };
  }
  return next;
}

const ADMIN_MODULES = applyModuleOverrides(createEmptyModules(), {
  attendance: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Full attendance management.'),
  marksheets: createModule('full-access', { GET: true, POST: true, PATCH: true, PUT: true, DELETE: true }, 'Full marksheet workflow.'),
  exams: createModule('full-access', { GET: true, POST: true, PATCH: true, PUT: true, DELETE: true }, 'Exam configuration, marks, and actions.'),
  reportCards: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Create, review, and publish report cards.'),
  timetables: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Timetable CRUD access.'),
  homeworks: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Homework management for all classes.'),
  fees: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Fee setup, generation, and status updates.'),
  salary: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Salary structures, generation, and slips.'),
  transport: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Transport routes, enrollments, and payments.'),
  complaints: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Complaint lifecycle and assignments.'),
  notifications: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Broadcast and notification administration.'),
  students: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Student records management.'),
  teachers: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Teacher records management.'),
  users: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'User and role management.'),
  classes: createModule('full-access', { GET: true, POST: true, PATCH: true, PUT: true, DELETE: true }, 'Class master data management.'),
  subjects: createModule('full-access', { GET: true, POST: true, PATCH: true, PUT: true, DELETE: true }, 'Subject master data management.'),
  dailyDiary: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Daily diary management.'),
  staffAttendance: createModule('full-access', { GET: true, POST: true, PATCH: true, DELETE: true }, 'Staff attendance operations.'),
});

const PRINCIPAL_MODULES = enforceAdminOnlyPost(
  'Principal',
  applyModuleOverrides(createEmptyModules(), {
    attendance: createModule('managed-operations', { GET: true, PATCH: true }, 'Can review and correct attendance.'),
    marksheets: createModule('managed-operations', { GET: true, PATCH: true, PUT: true, DELETE: true }, 'Can review and govern marksheets.'),
    exams: createModule('managed-operations', { GET: true, PATCH: true, PUT: true, DELETE: true }, 'Can review and govern exams.'),
    reportCards: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can approve/reject and audit report cards.'),
    timetables: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can manage timetable quality.'),
    homeworks: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can supervise homework operations.'),
    fees: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can monitor and adjust fee records.'),
    salary: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can monitor salary runs and updates.'),
    transport: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can review transport operations.'),
    complaints: createModule('managed-operations', { GET: true, PATCH: true }, 'Can assign and resolve complaints.'),
    notifications: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can manage notifications except restricted system actions.'),
    students: createModule('managed-operations', { GET: true, PATCH: true }, 'Can review and update student profiles.'),
    teachers: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can maintain teacher records.'),
    users: createModule('none', { GET: false, PATCH: false, DELETE: false }, 'No direct user admin rights.'),
    classes: createModule('managed-operations', { GET: true, PATCH: true, PUT: true, DELETE: true }, 'Can manage class structure.'),
    subjects: createModule('managed-operations', { GET: true, PATCH: true, PUT: true, DELETE: true }, 'Can manage subject catalog.'),
    dailyDiary: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can supervise daily diary content.'),
    staffAttendance: createModule('managed-operations', { GET: true, PATCH: true }, 'Can review and fix staff attendance records.'),
  })
);

const ACCOUNTANT_MODULES = enforceAdminOnlyPost(
  'Accountant',
  applyModuleOverrides(createEmptyModules(), {
    fees: createModule('managed-operations', { GET: true, PATCH: true }, 'Can read and update fee records.'),
    salary: createModule('managed-operations', { GET: true, PATCH: true }, 'Can access salary summaries and operational updates.'),
    complaints: createModule('assigned-operations', { GET: true, PATCH: true }, 'Can handle assigned complaint workflows.'),
    notifications: createModule('role-targeted-read', { GET: true }, 'Can read role-targeted notifications.'),
    students: createModule('reference-read', { GET: true }, 'Read access for finance workflows.'),
    transport: createModule('reference-read', { GET: true }, 'Read access for transport fee context.'),
  })
);

const HR_MODULES = enforceAdminOnlyPost(
  'HR',
  applyModuleOverrides(createEmptyModules(), {
    salary: createModule('managed-operations', { GET: true, PATCH: true }, 'Can manage salary structures and records.'),
    teachers: createModule('managed-operations', { GET: true, PATCH: true }, 'Can read and update teacher data.'),
    staffAttendance: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can review and clean staff attendance.'),
    complaints: createModule('assigned-operations', { GET: true, PATCH: true }, 'Can process assigned complaints.'),
    notifications: createModule('role-targeted-read', { GET: true }, 'Can read role-targeted notifications.'),
    students: createModule('reference-read', { GET: true }, 'Read-only support access.'),
  })
);

const RECEPTION_MODULES = enforceAdminOnlyPost(
  'Reception',
  applyModuleOverrides(createEmptyModules(), {
    attendance: createModule('reference-read', { GET: true }, 'Read access for attendance inquiries.'),
    fees: createModule('managed-operations', { GET: true, PATCH: true }, 'Can update fee status and support payment flow.'),
    transport: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can manage operational transport records.'),
    students: createModule('managed-operations', { GET: true, PATCH: true, DELETE: true }, 'Can update student office records.'),
    teachers: createModule('reference-read', { GET: true }, 'Read access for teacher lookup.'),
    timetables: createModule('managed-operations', { GET: true, PATCH: true }, 'Can apply timetable adjustments.'),
    dailyDiary: createModule('managed-operations', { GET: true, PATCH: true }, 'Can assist diary updates.'),
    staffAttendance: createModule('managed-operations', { GET: true, PATCH: true }, 'Can mark and adjust staff attendance status.'),
    complaints: createModule('assigned-operations', { GET: true, PATCH: true }, 'Can handle assigned complaints.'),
    exams: createModule('reference-read', { GET: true }, 'Read access for exam desk support.'),
    notifications: createModule('role-targeted-read', { GET: true }, 'Can read office notifications.'),
  })
);

const TEACHER_MODULES = enforceAdminOnlyPost(
  'Teacher',
  applyModuleOverrides(createEmptyModules(), {
    attendance: createModule('assigned-class-sections', { GET: true, PATCH: true }, 'Assigned class-section attendance only.'),
    marksheets: createModule('assigned-subjects', { GET: true, PATCH: true, PUT: true }, 'Assigned subject marks only.'),
    exams: createModule('assigned-subjects', { GET: true, PUT: true }, 'Assigned exam marks workflows only.'),
    reportCards: createModule('created-by-and-class-responsibility', { GET: true, PATCH: true }, 'Teacher-owned report card workflows.'),
    timetables: createModule('assigned-class-sections', { GET: true }, 'View own timetable slots/classes only.'),
    homeworks: createModule('assigned-class-sections', { GET: true, PATCH: true, DELETE: true }, 'Homework within assigned teaching scope.'),
    salary: createModule('own-records', { GET: true }, 'Only own salary information.'),
    transport: createModule('own-records', { GET: true }, 'Own transport enrollments/requests only.'),
    complaints: createModule('created-by-or-assigned', { GET: true, PATCH: true }, 'Own or assigned complaints only.'),
    notifications: createModule('role-targeted-read', { GET: true }, 'Role-targeted notification reads.'),
    students: createModule('assigned-class-sections', { GET: true }, 'Read students within academic scope.'),
    dailyDiary: createModule('assigned-class-sections', { GET: true, PATCH: true }, 'Class diary in assigned scope.'),
    staffAttendance: createModule('reference-read', { GET: true }, 'Read-only staff attendance view where allowed.'),
  })
);

const STUDENT_MODULES = enforceAdminOnlyPost(
  'Student',
  applyModuleOverrides(createEmptyModules(), {
    attendance: createModule('own-records', { GET: true }, 'Only own attendance records.'),
    marksheets: createModule('own-records', { GET: true }, 'Only own marksheets.'),
    exams: createModule('own-records', { GET: true }, 'Only own class exam data.'),
    reportCards: createModule('own-records-published', { GET: true }, 'Only own published report cards.'),
    timetables: createModule('own-class-section', { GET: true }, 'Only own class timetable.'),
    homeworks: createModule('own-class-section', { GET: true, PATCH: true }, 'Only own class homework and own submissions.'),
    fees: createModule('own-records', { GET: true }, 'Only own fee records.'),
    transport: createModule('own-records', { GET: true, PATCH: true }, 'Only own transport data and request status updates where allowed.'),
    complaints: createModule('created-by-or-assigned', { GET: true, PATCH: true }, 'Only own complaints and permitted updates.'),
    notifications: createModule('role-targeted-read', { GET: true }, 'Only notifications addressed to role/user.'),
    classes: createModule('reference-read', { GET: true }, 'Reference class catalog where applicable.'),
    subjects: createModule('reference-read', { GET: true }, 'Reference subject catalog where applicable.'),
    dailyDiary: createModule('own-class-section', { GET: true }, 'Only own class diary entries.'),
  })
);

const PARENT_MODULES = enforceAdminOnlyPost(
  'Parent',
  applyModuleOverrides(createEmptyModules(), {
    attendance: createModule('linked-children', { GET: true }, 'Only linked children attendance.'),
    marksheets: createModule('linked-children', { GET: true }, 'Only linked children marksheets.'),
    exams: createModule('linked-children', { GET: true }, 'Only linked children exam data.'),
    reportCards: createModule('linked-children-published', { GET: true }, 'Only linked children published report cards.'),
    timetables: createModule('linked-children', { GET: true }, 'Only linked children class timetables.'),
    homeworks: createModule('linked-children', { GET: true }, 'Only linked children homework view.'),
    fees: createModule('linked-children', { GET: true }, 'Only linked children fee records.'),
    transport: createModule('linked-children', { GET: true, PATCH: true }, 'Only linked children transport data.'),
    complaints: createModule('created-by-or-assigned', { GET: true, PATCH: true }, 'Only own complaints and permitted updates.'),
    notifications: createModule('role-targeted-read', { GET: true }, 'Only notifications addressed to role/user.'),
    classes: createModule('reference-read', { GET: true }, 'Reference class catalog where applicable.'),
    subjects: createModule('reference-read', { GET: true }, 'Reference subject catalog where applicable.'),
    dailyDiary: createModule('linked-children', { GET: true }, 'Only linked children diary entries.'),
  })
);

const ROLE_MODULES = {
  Admin: ADMIN_MODULES,
  Principal: PRINCIPAL_MODULES,
  Accountant: ACCOUNTANT_MODULES,
  HR: HR_MODULES,
  Reception: RECEPTION_MODULES,
  Teacher: TEACHER_MODULES,
  Student: STUDENT_MODULES,
  Parent: PARENT_MODULES,
};

const rolesAccess = CANONICAL_ROLES.map((role) => ({
  role,
  policyVersion: POLICY_VERSION,
  modules: ROLE_MODULES[role],
}));

function getRoleAccessProfile(role) {
  const normalizedRole = normalizeRole(role);
  const profile = rolesAccess.find((entry) => entry.role === normalizedRole);
  if (!profile) {
    return {
      role: normalizedRole,
      policyVersion: POLICY_VERSION,
      unknownRole: true,
      modules: createEmptyModules(),
    };
  }
  return profile;
}

function canRoleAccess(role, moduleName, method) {
  const profile = getRoleAccessProfile(role);
  const modulePolicy = profile.modules[String(moduleName)] || createModule('none');
  const normalizedMethod = String(method || '').toUpperCase();
  if (!METHODS.includes(normalizedMethod)) return false;
  return Boolean(modulePolicy.methods[normalizedMethod]);
}

module.exports = {
  POLICY_VERSION,
  CANONICAL_ROLES,
  ROLE_ALIASES,
  MODULES,
  METHODS,
  rolesAccess,
  normalizeRole,
  getRoleAccessProfile,
  canRoleAccess,
};
