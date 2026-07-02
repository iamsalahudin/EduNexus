const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const { User, Student, Subject, AttendanceAssignment, DailyDiary } = require('../models');

let mongoServer;
let adminUser;
let principalUser;
let teacherUser;
let otherTeacherUser;
let studentUser;
let parentUser;
let receptionUser;
let subject;
let adminToken;
let principalToken;
let teacherToken;
let otherTeacherToken;
let studentToken;
let parentToken;
let receptionToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({ name: 'Admin', username: 'dd_admin', email: 'dd_admin@test.com', password: 'hashed', role: 'Admin' });
  principalUser = await User.create({ name: 'Principal', username: 'dd_principal', email: 'dd_principal@test.com', password: 'hashed', role: 'Principal' });
  teacherUser = await User.create({ name: 'Teacher One', username: 'dd_teacher_1', email: 'dd_teacher_1@test.com', password: 'hashed', role: 'Teacher' });
  otherTeacherUser = await User.create({ name: 'Teacher Two', username: 'dd_teacher_2', email: 'dd_teacher_2@test.com', password: 'hashed', role: 'Teacher' });
  studentUser = await User.create({ name: 'Student One', username: 'dd_student_1', email: 'dd_student_1@test.com', password: 'hashed', role: 'Student' });
  parentUser = await User.create({ name: 'Parent One', username: 'dd_parent_1', email: 'dd_parent_1@test.com', password: 'hashed', role: 'Parent' });
  receptionUser = await User.create({ name: 'Reception One', username: 'dd_reception_1', email: 'dd_reception_1@test.com', password: 'hashed', role: 'Reception' });

  await Student.create({
    user: studentUser._id,
    studentId: 'STD-DD-1',
    registrationNumber: 'REG-DD-1',
    class: '10',
    section: 'A',
    parents: [parentUser._id],
    contact: '03001234567'
  });

  subject = await Subject.create({ className: '10', name: 'Math' });

  await AttendanceAssignment.create({
    teacher: teacherUser._id,
    className: '10',
    section: 'A'
  });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
  principalToken = jwt.sign({ sub: principalUser._id.toString(), role: 'Principal' }, secret);
  teacherToken = jwt.sign({ sub: teacherUser._id.toString(), role: 'Teacher' }, secret);
  otherTeacherToken = jwt.sign({ sub: otherTeacherUser._id.toString(), role: 'Teacher' }, secret);
  studentToken = jwt.sign({ sub: studentUser._id.toString(), role: 'Student' }, secret);
  parentToken = jwt.sign({ sub: parentUser._id.toString(), role: 'Parent' }, secret);
  receptionToken = jwt.sign({ sub: receptionUser._id.toString(), role: 'Reception' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await DailyDiary.deleteMany({});
});

describe('Daily diary module', () => {
  test('Teacher can create daily diary only for assigned incharge class', async () => {
    const allowedRes = await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: '2026-04-11',
        class: '10',
        section: 'A',
        subject: subject._id.toString(),
        title: 'Math Daily Diary',
        content: 'Chapter 3 revision',
        status: 'published'
      });

    expect(allowedRes.status).toBe(201);
    expect(allowedRes.body.diary.title).toBe('Math Daily Diary');

    const forbiddenRes = await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${otherTeacherToken}`)
      .send({
        date: '2026-04-11',
        class: '10',
        section: 'A',
        subject: subject._id.toString(),
        title: 'Math Diary Unauthorized',
        content: 'Should fail'
      });

    expect(forbiddenRes.status).toBe(403);
  });

  test('Diary uniqueness is enforced for class+section+subject+date', async () => {
    const payload = {
      date: '2026-04-11',
      class: '10',
      section: 'A',
      subject: subject._id.toString(),
      title: 'Math Daily Diary',
      content: 'Practice set 1',
      status: 'published'
    };

    const firstRes = await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(payload);

    expect(firstRes.status).toBe(201);

    const secondRes = await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ ...payload, content: 'Duplicate should fail' });

    expect(secondRes.status).toBe(409);
  });

  test('Parent sees child-wise summary and reception can update diary', async () => {
    const created = await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: '2026-04-11',
        class: '10',
        section: 'A',
        subject: subject._id.toString(),
        title: 'Math Daily Diary',
        content: 'Solve worksheet',
        status: 'published'
      });

    expect(created.status).toBe(201);

    const parentRes = await request(app)
      .get('/api/daily-diary')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(parentRes.status).toBe(200);
    expect(parentRes.body.diariesByChild).toHaveLength(1);
    expect(parentRes.body.diariesByChild[0].diaries).toHaveLength(1);
    expect(parentRes.body.diariesByChild[0].diaries[0].title).toBe('Math Daily Diary');
    expect(parentRes.body.diariesByChild[0].diaries[0].content).toBeUndefined();

    const diaryId = created.body.diary.id;
    const patchRes = await request(app)
      .patch(`/api/daily-diary/${diaryId}`)
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({ title: 'Math Daily Diary Updated by Reception' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.diary.title).toBe('Math Daily Diary Updated by Reception');
  });

  test('Admin and principal can create diary entries', async () => {
    const adminRes = await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: '2026-04-12',
        class: '10',
        section: 'A',
        subject: subject._id.toString(),
        title: 'Admin Diary',
        content: 'Admin note',
        teacherId: teacherUser._id.toString()
      });

    expect(adminRes.status).toBe(201);

    const principalRes = await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${principalToken}`)
      .send({
        date: '2026-04-13',
        class: '10',
        section: 'A',
        subject: subject._id.toString(),
        title: 'Principal Diary',
        content: 'Principal note',
        teacherId: teacherUser._id.toString()
      });

    expect(principalRes.status).toBe(201);
  });

  test('Student can list published diaries of own class', async () => {
    await request(app)
      .post('/api/daily-diary')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: '2026-04-11',
        class: '10',
        section: 'A',
        subject: subject._id.toString(),
        title: 'Math Daily Diary',
        content: 'Homework reminder',
        status: 'published'
      });

    const res = await request(app)
      .get('/api/daily-diary')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.diaries)).toBe(true);
    expect(res.body.diaries.length).toBeGreaterThan(0);
    expect(res.body.diaries[0].class).toBe('10');
    expect(res.body.diaries[0].section).toBe('A');
  });
});
