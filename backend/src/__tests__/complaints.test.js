const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../index');
const { Complaint, User } = require('../models');

let mongoServer;
let adminUser;
let teacherUser;
let studentUser;
let parentUser;
let otherStudentUser;

let adminToken;
let teacherToken;
let studentToken;
let parentToken;
let otherStudentToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Admin User',
    username: 'complaint_admin',
    email: 'complaint_admin@test.com',
    password: 'hashedpassword',
    role: 'Admin'
  });

  teacherUser = await User.create({
    name: 'Teacher User',
    username: 'complaint_teacher',
    email: 'complaint_teacher@test.com',
    password: 'hashedpassword',
    role: 'Teacher'
  });

  studentUser = await User.create({
    name: 'Student User',
    username: 'complaint_student',
    email: 'complaint_student@test.com',
    password: 'hashedpassword',
    role: 'Student'
  });

  parentUser = await User.create({
    name: 'Parent User',
    username: 'complaint_parent',
    email: 'complaint_parent@test.com',
    password: 'hashedpassword',
    role: 'Parent'
  });

  otherStudentUser = await User.create({
    name: 'Other Student',
    username: 'complaint_other_student',
    email: 'complaint_other_student@test.com',
    password: 'hashedpassword',
    role: 'Student'
  });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
  teacherToken = jwt.sign({ sub: teacherUser._id.toString(), role: 'Teacher' }, secret);
  studentToken = jwt.sign({ sub: studentUser._id.toString(), role: 'Student' }, secret);
  parentToken = jwt.sign({ sub: parentUser._id.toString(), role: 'Parent' }, secret);
  otherStudentToken = jwt.sign({ sub: otherStudentUser._id.toString(), role: 'Student' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Complaint.deleteMany({});
});

describe('Complaints module', () => {
  test('Student can submit a complaint', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Bus delay',
        description: 'Transport bus arrived very late today.',
        category: 'transport',
        priority: 'high'
      });

    expect(res.status).toBe(201);
    expect(res.body.complaint.title).toBe('Bus delay');
    expect(res.body.complaint.status).toBe('open');
    expect(res.body.complaint.createdBy._id.toString()).toBe(studentUser._id.toString());
  });

  test('Admin can assign complaint to teacher', async () => {
    const complaint = await Complaint.create({
      title: 'Classroom issue',
      description: 'Need projector repair.',
      category: 'academic',
      priority: 'medium',
      createdBy: studentUser._id
    });

    const res = await request(app)
      .patch(`/api/complaints/${complaint._id}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: teacherUser._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.complaint.assignedTo._id.toString()).toBe(teacherUser._id.toString());
    expect(res.body.complaint.status).toBe('assigned');
  });

  test('Assigned teacher can update complaint status', async () => {
    const complaint = await Complaint.create({
      title: 'Lab issue',
      description: 'Systems are not working.',
      category: 'academic',
      priority: 'high',
      status: 'assigned',
      createdBy: studentUser._id,
      assignedTo: teacherUser._id
    });

    const res = await request(app)
      .patch(`/api/complaints/${complaint._id}/status`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.complaint.status).toBe('in_progress');
  });

  test('Unrelated student cannot comment on another student complaint', async () => {
    const complaint = await Complaint.create({
      title: 'Cafeteria issue',
      description: 'Food quality needs improvement.',
      category: 'general',
      priority: 'medium',
      createdBy: studentUser._id
    });

    const res = await request(app)
      .post(`/api/complaints/${complaint._id}/comments`)
      .set('Authorization', `Bearer ${otherStudentToken}`)
      .send({ message: 'I disagree' });

    expect(res.status).toBe(403);
  });

  test('Creator can comment and admin can list all complaints', async () => {
    const complaint = await Complaint.create({
      title: 'Gate security concern',
      description: 'No guard available in morning shift.',
      category: 'discipline',
      priority: 'urgent',
      createdBy: parentUser._id
    });

    const commentRes = await request(app)
      .post(`/api/complaints/${complaint._id}/comments`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({ message: 'Please resolve soon.' });

    expect(commentRes.status).toBe(200);
    expect(Array.isArray(commentRes.body.complaint.comments)).toBe(true);
    expect(commentRes.body.complaint.comments).toHaveLength(1);
    expect(commentRes.body.complaint.comments[0].message).toBe('Please resolve soon.');

    const listRes = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 });

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.complaints)).toBe(true);
    expect(listRes.body.complaints.length).toBeGreaterThanOrEqual(1);
    expect(listRes.body.pagination.total).toBeGreaterThanOrEqual(1);
  });
});
