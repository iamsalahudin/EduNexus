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
const { User, Teacher, SchoolClass } = require('../models');

let mongoServer;
let teacherUser;
let teacherProfile;
let teacherToken;
let otherTeacherUser;
let otherTeacherToken;

function tokenFor(user) {
  const secret = process.env.JWT_SECRET || 'test-secret';
  return jwt.sign({ sub: String(user._id), role: user.role }, secret);
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  teacherUser = await User.create({
    name: 'Teacher User',
    username: 'teacher_test',
    email: 'teacher@test.com',
    password: 'Password@123',
    role: 'Teacher'
  });

  otherTeacherUser = await User.create({
    name: 'Other Teacher',
    username: 'other_teacher_test',
    email: 'other_teacher@test.com',
    password: 'Password@123',
    role: 'Teacher'
  });

  teacherProfile = await Teacher.create({
    user: teacherUser._id,
    employeeId: 'T-0001',
    designation: 'Math Teacher',
    joiningDate: new Date(),
    classesAssigned: ['Class 10', 'Class 9'],
    qualification: 'M.Sc Math',
    contactNumber: '03001234567',
    address: 'Teacher Street'
  });

  await SchoolClass.create({ name: 'Class 10', level: 'high', sections: ['A'], active: true });
  await SchoolClass.create({ name: 'Class 9', level: 'middle', sections: ['B'], active: true });
  await SchoolClass.create({ name: 'Class 8', level: 'middle', sections: ['C'], active: true });

  teacherToken = tokenFor(teacherUser);
  otherTeacherToken = tokenFor(otherTeacherUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Teachers API - getMyClasses', () => {
  test('returns only classes assigned to the logged-in teacher', async () => {
    const res = await request(app)
      .get('/api/teachers/my-classes')
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(res.status).toBe(200);
    expect(res.body.classes).toHaveLength(2);
    const names = res.body.classes.map(c => c.name);
    expect(names).toContain('Class 10');
    expect(names).toContain('Class 9');
    expect(names).not.toContain('Class 8');
  });

  test('returns 404/empty error when teacher profile is missing', async () => {
    const res = await request(app)
      .get('/api/teachers/my-classes')
      .set('Authorization', `Bearer ${otherTeacherToken}`);

    expect(res.status).toBe(404);
  });
});
