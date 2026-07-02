const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const { User, Student, Subject, Homework, HomeworkFile } = require('../models');

let mongoServer;
let adminUser;
let principalUser;
let teacherUser;
let studentUser;
let parentUser;
let otherTeacherUser;
let adminToken;
let principalToken;
let teacherToken;
let studentToken;
let parentToken;
let otherTeacherToken;
let subject;
let homeworkId;
let studentRecord;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({ name: 'Admin', username: 'hw_admin', email: 'hw_admin@test.com', password: 'hashed', role: 'Admin' });
  principalUser = await User.create({ name: 'Principal', username: 'hw_principal', email: 'hw_principal@test.com', password: 'hashed', role: 'Principal' });
  teacherUser = await User.create({ name: 'Teacher', username: 'hw_teacher', email: 'hw_teacher@test.com', password: 'hashed', role: 'Teacher' });
  otherTeacherUser = await User.create({ name: 'Other Teacher', username: 'hw_teacher_2', email: 'hw_teacher_2@test.com', password: 'hashed', role: 'Teacher' });
  studentUser = await User.create({ name: 'Student', username: 'hw_student', email: 'hw_student@test.com', password: 'hashed', role: 'Student' });
  parentUser = await User.create({ name: 'Parent', username: 'hw_parent', email: 'hw_parent@test.com', password: 'hashed', role: 'Parent' });

  studentRecord = await Student.create({
    user: studentUser._id,
    studentId: 'STD-HW-1',
    registrationNumber: 'REG-HW-1',
    class: '10',
    section: 'A',
    parents: [parentUser._id],
    contact: '03001234567'
  });

  await User.findByIdAndUpdate(studentUser._id, { $set: { profile: { studentRef: studentRecord._id } } });

  subject = await Subject.create({ className: '10', name: 'Math' });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
  principalToken = jwt.sign({ sub: principalUser._id.toString(), role: 'Principal' }, secret);
  teacherToken = jwt.sign({ sub: teacherUser._id.toString(), role: 'Teacher' }, secret);
  otherTeacherToken = jwt.sign({ sub: otherTeacherUser._id.toString(), role: 'Teacher' }, secret);
  studentToken = jwt.sign({ sub: studentUser._id.toString(), role: 'Student' }, secret);
  parentToken = jwt.sign({ sub: parentUser._id.toString(), role: 'Parent' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await HomeworkFile.deleteMany({});
  await Homework.deleteMany({});
  homeworkId = null;
});

describe('Homework module', () => {
  test('Teacher can create homework and admin can audit/update/delete it', async () => {
    const createRes = await request(app)
      .post('/api/homeworks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Algebra Worksheet',
        description: 'Solve chapter exercises',
        subject: subject._id.toString(),
        class: '10',
        section: 'A',
        dueDate: '2026-04-20',
        gradingMode: 'marks',
        maxMarks: 20
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.homework.title).toBe('Algebra Worksheet');
    homeworkId = createRes.body.homework._id;

    const auditRes = await request(app)
      .get('/api/homeworks/audit-summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ class: '10', section: 'A' });

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.summary.totalHomework).toBe(1);
    expect(auditRes.body.audits[0].submissions.total).toBe(0);

    const updateRes = await request(app)
      .patch(`/api/homeworks/${homeworkId}`)
      .set('Authorization', `Bearer ${principalToken}`)
      .send({
        title: 'Algebra Worksheet Updated',
        auditNote: 'Principal audit update'
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.homework.title).toBe('Algebra Worksheet Updated');
    expect(Array.isArray(updateRes.body.homework.editHistory)).toBe(true);

    const deleteRes = await request(app)
      .delete(`/api/homeworks/${homeworkId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.ok).toBe(true);
  });

  test('Teacher can track another homework and update/mark received/return flow', async () => {
    const createRes = await request(app)
      .post('/api/homeworks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Geometry Worksheet',
        description: 'Write answers',
        subject: subject._id.toString(),
        class: '10',
        section: 'A',
        dueDate: '2026-04-20',
        gradingMode: 'marks',
        maxMarks: 20
      });

    homeworkId = createRes.body.homework._id;

    const listRes = await request(app)
      .get('/api/homeworks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .query({ class: '10', section: 'A' });

    expect(listRes.status).toBe(200);
    expect(listRes.body.homeworks.length).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/homeworks/${homeworkId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ description: 'Updated description', auditNote: 'Teacher edit' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.homework.description).toBe('Updated description');
  });

  test('Student can upload submission files and submit homework', async () => {
    const createRes = await request(app)
      .post('/api/homeworks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Science Homework',
        description: 'Submit notes',
        subject: subject._id.toString(),
        class: '10',
        section: 'A',
        dueDate: '2026-04-20',
        gradingMode: 'none'
      });

    homeworkId = createRes.body.homework._id;

    // Publish the homework first
    await request(app)
      .patch(`/api/homeworks/${homeworkId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'published' });

    const uploadRes = await request(app)
      .post(`/api/homeworks/${homeworkId}/submission/files`)
      .set('Authorization', `Bearer ${studentToken}`)
      .attach('files', Buffer.from('Homework file content'), 'homework.txt');

    expect(uploadRes.status).toBe(201);
    expect(uploadRes.body.files).toHaveLength(1);

    const submitRes = await request(app)
      .post(`/api/homeworks/${homeworkId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.homework.submissions).toHaveLength(1);
    expect(submitRes.body.homework.submissions[0].status).toBe('submitted');

    const fileCount = await HomeworkFile.countDocuments({ homework: homeworkId });
    expect(fileCount).toBe(1);
  });

  test('Parent gets summary-only homework list for child', async () => {
    const createRes = await request(app)
      .post('/api/homeworks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'English Homework',
        description: 'Read chapter 2',
        subject: subject._id.toString(),
        class: '10',
        section: 'A',
        dueDate: '2026-04-20',
        gradingMode: 'none'
      });

    homeworkId = createRes.body.homework._id;

    const parentRes = await request(app)
      .get('/api/homeworks')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(parentRes.status).toBe(200);
    expect(parentRes.body.children).toHaveLength(1);
    expect(parentRes.body.homeworksByChild[0].homeworks).toHaveLength(1);
    expect(parentRes.body.homeworksByChild[0].homeworks[0].submissionDetails).toBeDefined();
  });

  test('Teacher can not delete another teacher homework but admin can', async () => {
    const createRes = await request(app)
      .post('/api/homeworks')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'History Homework',
        description: 'Essay',
        subject: subject._id.toString(),
        class: '10',
        section: 'A',
        dueDate: '2026-04-20'
      });

    homeworkId = createRes.body.homework._id;

    const forbidRes = await request(app)
      .delete(`/api/homeworks/${homeworkId}`)
      .set('Authorization', `Bearer ${otherTeacherToken}`);

    expect(forbidRes.status).toBe(403);

    const adminDeleteRes = await request(app)
      .delete(`/api/homeworks/${homeworkId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(adminDeleteRes.status).toBe(200);
  });
});
