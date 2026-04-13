const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const { User, Student, Subject, SchoolClass, Exam, ExamMark } = require('../models');

let mongoServer;
let adminUser;
let teacherUser;
let studentUser;
let parentUser;
let receptionUser;
let adminToken;
let teacherToken;
let studentToken;
let parentToken;
let receptionToken;
let subject10Math;
let subject9Eng;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({ name: 'Exam Admin', username: 'ex_admin', email: 'ex_admin@test.com', password: 'hashed', role: 'Admin' });
  teacherUser = await User.create({ name: 'Exam Teacher', username: 'ex_teacher', email: 'ex_teacher@test.com', password: 'hashed', role: 'Teacher' });
  studentUser = await User.create({ name: 'Exam Student', username: 'ex_student', email: 'ex_student@test.com', password: 'hashed', role: 'Student' });
  parentUser = await User.create({ name: 'Exam Parent', username: 'ex_parent', email: 'ex_parent@test.com', password: 'hashed', role: 'Parent' });
  receptionUser = await User.create({ name: 'Exam Reception', username: 'ex_reception', email: 'ex_reception@test.com', password: 'hashed', role: 'Reception' });

  await SchoolClass.create([
    { name: '9', sections: ['A'] },
    { name: '10', sections: ['A'] }
  ]);

  subject10Math = await Subject.create({ className: '10', name: 'Mathematics', active: true, order: 1 });
  subject9Eng = await Subject.create({ className: '9', name: 'English', active: true, order: 1 });

  await Student.create({
    user: studentUser._id,
    studentId: 'STD-EX-1',
    registrationNumber: 'REG-EX-1',
    class: '10',
    section: 'A',
    parents: [parentUser._id],
    contact: '03001234567'
  });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
  teacherToken = jwt.sign({ sub: teacherUser._id.toString(), role: 'Teacher' }, secret);
  studentToken = jwt.sign({ sub: studentUser._id.toString(), role: 'Student' }, secret);
  parentToken = jwt.sign({ sub: parentUser._id.toString(), role: 'Parent' }, secret);
  receptionToken = jwt.sign({ sub: receptionUser._id.toString(), role: 'Reception' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await ExamMark.deleteMany({});
  await Exam.deleteMany({});
});

describe('Exams module', () => {
  test('Admin bulk setup creates exam records for all classes with default subjects', async () => {
    const res = await request(app)
      .post('/api/exams/bulk-setup')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'mid', year: 2026, name: 'Mid 2026' });

    expect(res.status).toBe(201);
    expect(res.body.summary.totalClasses).toBe(2);
    expect(res.body.summary.created).toBe(2);

    const exams = await Exam.find({ type: 'mid', year: 2026 }).lean();
    expect(exams).toHaveLength(2);
    const class10 = exams.find((e) => e.className === '10');
    const class9 = exams.find((e) => e.className === '9');
    expect(Array.isArray(class10.subjects)).toBe(true);
    expect(Array.isArray(class9.subjects)).toBe(true);
    expect(class10.subjects.length).toBeGreaterThan(0);
    expect(class9.subjects.length).toBeGreaterThan(0);
  });

  test('Setup summary returns pending when exam is not yet created', async () => {
    const res = await request(app)
      .get('/api/exams/setup-summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ type: 'final', year: 2026 });

    expect(res.status).toBe(200);
    expect(res.body.summary.totalClasses).toBe(2);
    expect(res.body.summary.pending).toBe(2);
    expect(res.body.rows.every((r) => r.state === 'pending')).toBe(true);
  });

  test('Student/Parent get published-only class-scoped visibility; Reception gets all published', async () => {
    await Exam.create({
      className: '10',
      type: 'mid',
      name: 'Mid Draft',
      year: 2026,
      status: 'draft',
      subjects: [{ subject: subject10Math._id }],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    await Exam.create({
      className: '10',
      type: 'final',
      name: 'Final Published 10',
      year: 2026,
      status: 'published',
      subjects: [{ subject: subject10Math._id }],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    await Exam.create({
      className: '9',
      type: 'final',
      name: 'Final Published 9',
      year: 2026,
      status: 'published',
      subjects: [{ subject: subject9Eng._id }],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const studentRes = await request(app)
      .get('/api/exams')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ year: 2026 });

    expect(studentRes.status).toBe(200);
    expect(studentRes.body.exams).toHaveLength(1);
    expect(studentRes.body.exams[0].className).toBe('10');
    expect(studentRes.body.exams[0].status).toBe('published');

    const parentRes = await request(app)
      .get('/api/exams')
      .set('Authorization', `Bearer ${parentToken}`)
      .query({ year: 2026 });

    expect(parentRes.status).toBe(200);
    expect(parentRes.body.exams).toHaveLength(1);
    expect(parentRes.body.exams[0].className).toBe('10');

    const receptionRes = await request(app)
      .get('/api/exams')
      .set('Authorization', `Bearer ${receptionToken}`)
      .query({ year: 2026 });

    expect(receptionRes.status).toBe(200);
    expect(receptionRes.body.exams).toHaveLength(2);
    expect(receptionRes.body.exams.every((e) => e.status === 'published')).toBe(true);
  });

  test('Admin can archive and hard-delete archived exam only', async () => {
    const createRes = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ className: '10', type: 'mid', name: 'Mid Archive', year: 2026 });

    expect([200, 201]).toContain(createRes.status);
    const examId = createRes.body.exam._id;

    const archiveRes = await request(app)
      .post(`/api/exams/${examId}/archive`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(archiveRes.status).toBe(200);
    expect(archiveRes.body.exam.isArchived).toBe(true);

    const activeList = await request(app)
      .get('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ year: 2026 });

    expect(activeList.status).toBe(200);
    expect(activeList.body.exams.find((e) => String(e._id) === String(examId))).toBeUndefined();

    const hardDeleteRes = await request(app)
      .delete(`/api/exams/${examId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(hardDeleteRes.status).toBe(200);
    expect(hardDeleteRes.body.ok).toBe(true);
  });

  test('Hard-delete is rejected for non-archived exams', async () => {
    const createRes = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ className: '10', type: 'final', name: 'Final Active', year: 2026 });

    const examId = createRes.body.exam._id;

    const deleteRes = await request(app)
      .delete(`/api/exams/${examId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(409);
  });
});
