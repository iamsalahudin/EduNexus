const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const app = require('../index');
const {
  User,
  Student,
  Teacher,
  TransportRoute,
  TransportRequest,
  TransportEnrollment,
  TransportPayment,
  Transport
} = require('../models');

let mongoServer;

let adminUser;
let principalUser;
let receptionUser;
let studentUser;
let teacherUser;
let parentUser;

let studentProfile;
let teacherProfile;

let adminToken;
let principalToken;
let receptionToken;
let studentToken;
let teacherToken;
let parentToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Transport Admin',
    username: 'transport_admin',
    email: 'transport_admin@test.com',
    password: 'hashedpassword',
    role: 'Admin'
  });

  principalUser = await User.create({
    name: 'Transport Principal',
    username: 'transport_principal',
    email: 'transport_principal@test.com',
    password: 'hashedpassword',
    role: 'Principal'
  });

  receptionUser = await User.create({
    name: 'Transport Reception',
    username: 'transport_reception',
    email: 'transport_reception@test.com',
    password: 'hashedpassword',
    role: 'Reception'
  });

  studentUser = await User.create({
    name: 'Transport Student',
    username: 'transport_student',
    email: 'transport_student@test.com',
    password: 'hashedpassword',
    role: 'Student'
  });

  teacherUser = await User.create({
    name: 'Transport Teacher',
    username: 'transport_teacher',
    email: 'transport_teacher@test.com',
    password: 'hashedpassword',
    role: 'Teacher'
  });

  parentUser = await User.create({
    name: 'Transport Parent',
    username: 'transport_parent',
    email: 'transport_parent@test.com',
    password: 'hashedpassword',
    role: 'Parent'
  });

  studentProfile = await Student.create({
    user: studentUser._id,
    studentId: 'ST-TR-001',
    registrationNumber: 'REG-TR-001',
    class: '10',
    section: 'A',
    contact: '03000000001',
    parents: [parentUser._id]
  });

  teacherProfile = await Teacher.create({
    user: teacherUser._id,
    employeeId: 'EMP-TR-001',
    designation: 'Math Teacher',
    qualification: 'BS Math',
    joiningDate: new Date('2022-01-01'),
    contactNumber: '03000000002',
    address: 'Teacher Street'
  });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
  principalToken = jwt.sign({ sub: principalUser._id.toString(), role: 'Principal' }, secret);
  receptionToken = jwt.sign({ sub: receptionUser._id.toString(), role: 'Reception' }, secret);
  studentToken = jwt.sign({ sub: studentUser._id.toString(), role: 'Student' }, secret);
  teacherToken = jwt.sign({ sub: teacherUser._id.toString(), role: 'Teacher' }, secret);
  parentToken = jwt.sign({ sub: parentUser._id.toString(), role: 'Parent' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    TransportRoute.deleteMany({}),
    TransportRequest.deleteMany({}),
    TransportEnrollment.deleteMany({}),
    TransportPayment.deleteMany({}),
    Transport.deleteMany({})
  ]);
});

describe('Transport module', () => {
  test('Admin can create route and Principal cannot delete route', async () => {
    const createRes = await request(app)
      .post('/api/transport/routes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Canal Road Route',
        code: 'CR-1',
        pickupPoint: 'Canal Chowk',
        dropoffPoint: 'Campus Gate',
        fee: 2000,
        driverName: 'Ali',
        vehicleNumber: 'LEA-1234'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.route.name).toBe('Canal Road Route');

    const deleteRes = await request(app)
      .delete(`/api/transport/routes/${createRes.body.route._id}`)
      .set('Authorization', `Bearer ${principalToken}`);

    expect(deleteRes.status).toBe(403);
  });

  test('Student request can be approved by Reception to create enrollment and payment', async () => {
    const route = await TransportRoute.create({
      name: 'Satyana Road',
      code: 'SR-1',
      pickupPoint: 'D Ground',
      dropoffPoint: 'Campus',
      fee: 1800,
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const requestRes = await request(app)
      .post('/api/transport/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ routeId: route._id.toString(), reason: 'Need school commute' });

    expect(requestRes.status).toBe(201);
    expect(requestRes.body.request.status).toBe('pending');

    const approveRes = await request(app)
      .patch(`/api/transport/requests/${requestRes.body.request._id}/status`)
      .set('Authorization', `Bearer ${receptionToken}`)
      .send({ status: 'approved' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.request.status).toBe('approved');

    const enrollment = await TransportEnrollment.findOne({ user: studentUser._id, status: 'enrolled' }).lean();
    expect(enrollment).toBeTruthy();

    const payment = await TransportPayment.findOne({ enrollment: enrollment._id }).lean();
    expect(payment).toBeTruthy();
    expect(payment.status).toBe('pending');

    const legacy = await Transport.findOne({ student: studentProfile._id }).lean();
    expect(legacy).toBeTruthy();
    expect(legacy.active).toBe(true);
  });

  test('Teacher can request and manager can enroll teacher using teacherUserId', async () => {
    const route = await TransportRoute.create({
      name: 'Clock Tower Route',
      pickupPoint: 'Clock Tower',
      dropoffPoint: 'Campus Main',
      fee: 1600,
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const teacherReq = await request(app)
      .post('/api/transport/requests')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ routeId: route._id.toString(), reason: 'Teacher commute request' });

    expect(teacherReq.status).toBe(201);

    const manualEnroll = await request(app)
      .post('/api/transport/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        routeId: route._id.toString(),
        subjectRole: 'Teacher',
        teacherUserId: teacherUser._id.toString(),
        notes: 'Manual enrollment'
      });

    expect(manualEnroll.status).toBe(201);
    expect(manualEnroll.body.enrollment.subjectRole).toBe('Teacher');
    expect(String(manualEnroll.body.enrollment.teacher._id)).toBe(String(teacherProfile._id));
  });

  test('Parent can list linked children and submit child-specific request', async () => {
    const route = await TransportRoute.create({
      name: 'Millat Route',
      pickupPoint: 'Millat Town',
      dropoffPoint: 'Campus East',
      fee: 1900,
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const childrenRes = await request(app)
      .get('/api/transport/parent/children')
      .set('Authorization', `Bearer ${parentToken}`);

    expect(childrenRes.status).toBe(200);
    expect(Array.isArray(childrenRes.body.children)).toBe(true);
    expect(childrenRes.body.children.length).toBe(1);

    const reqRes = await request(app)
      .post('/api/transport/requests')
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        routeId: route._id.toString(),
        studentId: studentProfile._id.toString(),
        reason: 'Child needs transport'
      });

    expect(reqRes.status).toBe(201);
    expect(reqRes.body.request.subjectRole).toBe('Student');
    expect(String(reqRes.body.request.student._id)).toBe(String(studentProfile._id));
  });
});
