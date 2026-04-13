const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('express-mongo-sanitize', () => () => (req, res, next) => next());
jest.mock('../queues/chatQueue', () => ({
  chatQueue: { close: jest.fn() },
  addChatJob: jest.fn(),
  waitForQueueReady: jest.fn(async () => true),
  isQueueReady: jest.fn(() => true)
}));

const app = require('../index');
const { User, Student, SchoolClass, Timetable } = require('../models');

let mongoServer;

let adminUser;
let receptionUser;
let teacherUser;
let studentUser;
let parentUser;
let otherParentUser;

let adminToken;
let receptionToken;
let teacherToken;
let studentToken;
let parentToken;

function tokenFor(user) {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign({ sub: String(user._id), role: user.role }, secret);
}

function buildSlot(overrides = {}) {
  return {
    day: 'Monday',
    startTime: '08:00',
    endTime: '08:45',
    class: 'Class 10',
    section: 'A',
    teacher: teacherUser._id,
    ...overrides
  };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Admin User',
    username: 'admin_timetable',
    email: 'admin.timetable@test.com',
    password: 'Password@123',
    role: 'Admin'
  });

  receptionUser = await User.create({
    name: 'Reception User',
    username: 'reception_timetable',
    email: 'reception.timetable@test.com',
    password: 'Password@123',
    role: 'Reception'
  });

  teacherUser = await User.create({
    name: 'Teacher User',
    username: 'teacher_timetable',
    email: 'teacher.timetable@test.com',
    password: 'Password@123',
    role: 'Teacher'
  });

  studentUser = await User.create({
    name: 'Student User',
    username: 'student_timetable',
    email: 'student.timetable@test.com',
    password: 'Password@123',
    role: 'Student'
  });

  parentUser = await User.create({
    name: 'Parent User',
    username: 'parent_timetable',
    email: 'parent.timetable@test.com',
    password: 'Password@123',
    role: 'Parent'
  });

  otherParentUser = await User.create({
    name: 'Other Parent User',
    username: 'other_parent_timetable',
    email: 'other.parent.timetable@test.com',
    password: 'Password@123',
    role: 'Parent'
  });

  await SchoolClass.create({ name: 'Class 10', level: 'high', sections: ['A'], active: true });
  await SchoolClass.create({ name: 'Class 9', level: 'middle', sections: ['B'], active: true });

  await Student.create({
    user: studentUser._id,
    studentId: 'STU-TT-001',
    registrationNumber: 'REG-TT-001',
    class: 'Class 10',
    section: 'A',
    contact: '03001234567',
    status: 'incampus',
    parents: [parentUser._id]
  });

  await Student.create({
    user: new mongoose.Types.ObjectId(),
    studentId: 'STU-TT-002',
    registrationNumber: 'REG-TT-002',
    class: 'Class 9',
    section: 'B',
    contact: '03001234568',
    status: 'incampus',
    parents: [otherParentUser._id]
  });

  adminToken = tokenFor(adminUser);
  receptionToken = tokenFor(receptionUser);
  teacherToken = tokenFor(teacherUser);
  studentToken = tokenFor(studentUser);
  parentToken = tokenFor(parentUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Timetable.deleteMany({});
});

describe('Timetable API (level model)', () => {
  test('rejects class-based root payload on create', async () => {
    const response = await request(app)
      .post('/api/timetables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        level: 'high',
        class: 'Class 10',
        year: 2026,
        slots: [buildSlot()]
      });

    expect(response.status).toBe(400);
  });

  test('enforces unique level/year', async () => {
    const payload = {
      level: 'high',
      year: 2026,
      slots: [buildSlot()]
    };

    const first = await request(app)
      .post('/api/timetables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    const second = await request(app)
      .post('/api/timetables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });

  test('reception can update but cannot create or delete', async () => {
    const created = await request(app)
      .post('/api/timetables')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        level: 'high',
        year: 2026,
        slots: [buildSlot()]
      });

    expect(created.status).toBe(201);
    const timetableId = created.body.timetable._id;

    const createAsReception = await request(app)
      .post('/api/timetables')
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({
        level: 'middle',
        year: 2026,
        slots: [buildSlot({ class: 'Class 9', section: 'B' })]
      });

    const patchAsReception = await request(app)
      .patch(`/api/timetables/${timetableId}`)
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({ isActive: false });

    const deleteAsReception = await request(app)
      .delete(`/api/timetables/${timetableId}`)
      .set('Authorization', `Bearer ${receptionToken}`);

    expect(createAsReception.status).toBe(403);
    expect(patchAsReception.status).toBe(200);
    expect(patchAsReception.body.timetable.isActive).toBe(false);
    expect(deleteAsReception.status).toBe(403);
  });

  test('student only sees timetable for own class/section', async () => {
    await Timetable.create({
      level: 'high',
      year: 2026,
      slots: [buildSlot({ class: 'Class 10', section: 'A' })],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    await Timetable.create({
      level: 'middle',
      year: 2026,
      slots: [buildSlot({ class: 'Class 9', section: 'B' })],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const response = await request(app)
      .get('/api/timetables')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.timetables)).toBe(true);
    expect(response.body.timetables).toHaveLength(1);
    expect(response.body.timetables[0].level).toBe('high');
  });

  test('teacher and parent scope filters apply correctly', async () => {
    await Timetable.create({
      level: 'high',
      year: 2026,
      slots: [buildSlot({ class: 'Class 10', section: 'A', teacher: teacherUser._id })],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    await Timetable.create({
      level: 'middle',
      year: 2026,
      slots: [buildSlot({ class: 'Class 9', section: 'B', teacher: adminUser._id })],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const teacherResponse = await request(app)
      .get('/api/timetables')
      .set('Authorization', `Bearer ${teacherToken}`);

    const parentDeniedClassResponse = await request(app)
      .get('/api/timetables')
      .query({ class: 'Class 9' })
      .set('Authorization', `Bearer ${parentToken}`);

    expect(teacherResponse.status).toBe(200);
    expect(teacherResponse.body.timetables).toHaveLength(1);

    expect(parentDeniedClassResponse.status).toBe(200);
    expect(parentDeniedClassResponse.body.timetables).toHaveLength(0);
  });
});
