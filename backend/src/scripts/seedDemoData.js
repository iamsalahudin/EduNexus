/*
  Demo seed script:
  - Ensures demo users exist (uses existing seedAdmin behavior)
  - Creates demo Student records
  - Links demo Student login (user.profile.studentRef)
  - Assigns demo Teacher class/section (user.profile.class/section)
  - Inserts a few student/staff attendance records

  Usage:
    npm run seed:demo
*/

const mongoose = require('mongoose');
const config = require('../config');

const { User, Student, Attendance, StaffAttendance, SchoolClass } = require('../models');
const { ensureDefaultSubjectsForClass } = require('../controllers/subjectsController');

const FALLBACK_URI = 'mongodb+srv://hussain:aws%401317@cluster0.nuopsgu.mongodb.net/edu';

function normalizeDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function ensureUser({ name, username, email, password, role, profile }) {
  const normalizedEmail = String(email).toLowerCase();
  const normalizedUsername = String(username || '').toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    user = await User.create({ name, username: normalizedUsername, email: normalizedEmail, password, role, profile: profile || {} });
    return { user, created: true };
  }
  if (!user.username && normalizedUsername) {
    user.username = normalizedUsername;
  }
  if (profile && typeof profile === 'object') {
    user.profile = { ...(user.profile || {}), ...profile };
  }
  await user.save();
  return { user, created: false };
}

async function ensureStudent({ userId, studentId, registrationNumber, cls, section, contact, parentIds = [] }) {
  let student = await Student.findOne({ studentId });
  if (!student) {
    student = await Student.create({
      user: userId,
      studentId,
      registrationNumber,
      class: String(cls),
      section: section || '',
      contact: String(contact || '00000000000'),
      parents: parentIds
    });
    return { student, created: true };
  }

  if (userId) student.user = userId;
  if (!student.registrationNumber) student.registrationNumber = registrationNumber;
  if (!student.contact) student.contact = String(contact || '00000000000');
  student.class = String(cls);
  student.section = section || '';

  // merge parents
  const existing = new Set((student.parents || []).map((p) => p.toString()));
  for (const pid of parentIds) existing.add(pid.toString());
  student.parents = Array.from(existing);
  await student.save();
  return { student, created: false };
}

async function upsertStudentAttendance({ student, teacherUser, date, status }) {
  const day = normalizeDay(date);
  await Attendance.findOneAndUpdate(
    { student: student._id, date: day },
    {
      student: student._id,
      date: day,
      status,
      teacher: teacherUser._id,
      class: student.class,
      section: student.section,
      remarks: ''
    },
    { upsert: true, new: true }
  );
}

async function upsertStaffAttendance({ user, markedBy, date, status }) {
  const day = normalizeDay(date);
  await StaffAttendance.findOneAndUpdate(
    { user: user._id, date: day },
    { user: user._id, date: day, status, remarks: '', markedBy: markedBy._id },
    { upsert: true, new: true }
  );
}

async function ensureSchoolClass({ name, sections }) {
  const clsName = String(name || '').trim();
  if (!clsName) return null;

  const existing = await SchoolClass.findOne({ name: clsName });
  if (existing) {
    if (Array.isArray(sections)) {
      const merged = new Map();
      for (const s of (existing.sections || [])) merged.set(String(s || '').trim().toLowerCase(), String(s || '').trim());
      for (const s of sections) merged.set(String(s || '').trim().toLowerCase(), String(s || '').trim());
      existing.sections = Array.from(merged.values()).filter(Boolean);
      await existing.save();
    }
    return existing;
  }

  const created = await SchoolClass.create({
    name: clsName,
    sections: Array.isArray(sections) ? sections.map((s) => String(s || '').trim()).filter(Boolean) : ['Boys', 'Girls'],
    active: true
  });
  return created;
}

async function seedDemo() {
  const uri = config.mongoUri || FALLBACK_URI;
  if (!uri) {
    console.error('No MONGO_URI provided. Set MONGO_URI in environment or edit this script.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB for demo seeding');

  // Ensure demo users exist (same emails as login page quick-fill)
  const admin = (await ensureUser({ name: 'Admin', username: 'admin', role: 'Admin', email: 'admin@edu.com', password: 'admin@123' })).user;
  const parent = (await ensureUser({ name: 'Parent', username: 'parent', role: 'Parent', email: 'parent@edu.com', password: 'parent@123' })).user;
  const teacher = (await ensureUser({
    name: 'Teacher',
    username: 'teacher',
    role: 'Teacher',
    email: 'teacher@edu.com',
    password: 'teacher@123',
    profile: { class: '10', section: 'A' }
  })).user;
  const studentLogin = (await ensureUser({ name: 'Student', username: 'student', role: 'Student', email: 'student@edu.com', password: 'student@123' })).user;

  // Ensure demo class exists in master data (needed for Subjects + dropdowns)
  await ensureSchoolClass({ name: '10', sections: ['A'] });

  // Ensure default subjects exist for demo class (best-effort)
  try {
    await ensureDefaultSubjectsForClass('10');
  } catch (e) {
    // ignore
  }

  // Create a small class roster
  const roster = [];
  for (let i = 1; i <= 5; i += 1) {
    const sid = `S-10A-${String(i).padStart(3, '0')}`;
    const registrationNumber = `REG-10A-${String(i).padStart(3, '0')}`;

    const loginUser = i === 1
      ? studentLogin
      : (await ensureUser({
        name: `Student${i}`,
        username: `student${i}`,
        role: 'Student',
        email: `student${i}@edu.com`,
        password: `student${i}@123`
      })).user;

    const { student } = await ensureStudent({
      userId: loginUser._id,
      studentId: sid,
      registrationNumber,
      cls: '10',
      section: 'A',
      contact: `03000000${String(i).padStart(3, '0')}`,
      parentIds: i === 1 ? [parent._id] : []
    });
    roster.push(student);
  }

  // Link demo student login to the first student record
  studentLogin.profile = { ...(studentLogin.profile || {}), studentRef: roster[0]._id };
  await studentLogin.save();

  // Insert a few days of attendance
  const days = [0, 1, 2].map((d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000));

  for (const day of days) {
    // staff attendance for teacher
    await upsertStaffAttendance({ user: teacher, markedBy: teacher, date: day, status: 'present' });

    // student attendance
    for (const s of roster) {
      const status = s.studentId.endsWith('001') && day.getDate() % 2 === 0 ? 'absent' : 'present';
      await upsertStudentAttendance({ student: s, teacherUser: teacher, date: day, status });
    }
  }

  console.log('Demo seeding complete');
  await mongoose.disconnect();
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error('Demo seeding failed', err);
  process.exit(1);
});
