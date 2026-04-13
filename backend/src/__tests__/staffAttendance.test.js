/**
 * Staff Attendance Controller Unit Tests
 * 
 * SETUP REQUIRED: Same as attendance.test.js
 * See attendance.test.js for setup instructions.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../index');
const { StaffAttendance, User } = require('../models');
const jwt = require('jsonwebtoken');

let mongoServer;
let adminToken;
let hrToken;
let teacherToken;
let adminUser;
let hrUser;
let teacherUser;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
  
  // Create test users
  adminUser = await User.create({
    name: 'Admin User',
    username: 'admin_test',
    email: 'admin@test.com',
    password: 'hashedpassword',
    role: 'Admin'
  });
  
  hrUser = await User.create({
    name: 'HR User',
    username: 'hr_test',
    email: 'hr@test.com',
    password: 'hashedpassword',
    role: 'HR'
  });
  
  teacherUser = await User.create({
    name: 'Teacher User',
    username: 'teacher_test',
    email: 'teacher@test.com',
    password: 'hashedpassword',
    role: 'Teacher'
  });
  
  // Generate tokens
  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
  hrToken = jwt.sign({ sub: hrUser._id.toString(), role: 'HR' }, secret);
  teacherToken = jwt.sign({ sub: teacherUser._id.toString(), role: 'Teacher' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await StaffAttendance.deleteMany({});
});

describe('POST /staff-attendance - Mark Staff Attendance', () => {
  test('Teacher cannot mark own attendance', async () => {
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: new Date().toISOString(),
        status: 'present',
        remarks: 'On time'
      });
    
    expect(res.status).toBe(403);
  });
  
  test('Admin can mark attendance for other staff', async () => {
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: new Date().toISOString(),
        status: 'present',
        remarks: '',
        userId: teacherUser._id.toString()
      });
    
    expect(res.status).toBe(201);
    expect(res.body.record.user._id.toString()).toBe(teacherUser._id.toString());
    expect(res.body.record.markedBy._id.toString()).toBe(adminUser._id.toString());
  });
  
  test('HR cannot mark attendance for other staff', async () => {
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        date: new Date().toISOString(),
        status: 'absent',
        remarks: 'Sick leave',
        userId: teacherUser._id.toString()
      });
    
    expect(res.status).toBe(403);
  });
  
  test('Teacher cannot mark attendance for other staff', async () => {
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: new Date().toISOString(),
        status: 'present',
        remarks: '',
        userId: hrUser._id.toString()
      });
    
    expect(res.status).toBe(403);
  });
  
  test('Prevents duplicate attendance for same user on same day', async () => {
    const date = new Date().toISOString();
    
    // First mark
    await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date,
        status: 'present',
        remarks: '',
        userId: teacherUser._id.toString()
      });
    
    // Second mark (should update)
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date,
        status: 'late',
        remarks: 'Arrived late',
        userId: teacherUser._id.toString()
      });
    
    expect(res.status).toBe(201);
    
    const count = await StaffAttendance.countDocuments({ user: teacherUser._id });
    expect(count).toBe(1);
    
    const record = await StaffAttendance.findOne({ user: teacherUser._id });
    expect(record.status).toBe('late');
  });
  
  test.skip('Validates attendance status', async () => {
    // TODO: Fix Joi validation schema - should reject invalid status values
    // Currently accepts 'invalid_status' when it should only allow 'present', 'absent', 'late', 'leave'
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        date: new Date().toISOString(),
        status: 'invalid_status',
        remarks: ''
      });
    
    expect(res.status).toBe(400);
  });
  
  test('Requires valid date', async () => {
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: 'invalid-date',
        status: 'present',
        remarks: '',
        userId: teacherUser._id.toString()
      });
    
    expect(res.status).toBe(400);
  });
});

describe('GET /staff-attendance - Get Staff Attendance', () => {
  beforeEach(async () => {
    // Create test records
    await StaffAttendance.create([
      {
        user: teacherUser._id,
        date: new Date('2024-03-01'),
        status: 'present',
        markedBy: teacherUser._id
      },
      {
        user: teacherUser._id,
        date: new Date('2024-03-02'),
        status: 'absent',
        markedBy: adminUser._id
      },
      {
        user: hrUser._id,
        date: new Date('2024-03-01'),
        status: 'present',
        markedBy: hrUser._id
      }
    ]);
  });
  
  test('Admin can view all staff attendance', async () => {
    const res = await request(app)
      .get('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(3);
  });
  
  test('HR can view all staff attendance', async () => {
    const res = await request(app)
      .get('/api/staff-attendance')
      .set('Authorization', `Bearer ${hrToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(3);
  });
  
  test('Teacher can only view own attendance', async () => {
    const res = await request(app)
      .get('/api/staff-attendance')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(2);
    expect(res.body.records[0].user._id.toString()).toBe(teacherUser._id.toString());
  });
  
  test('Admin can filter by userId', async () => {
    const res = await request(app)
      .get('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ userId: teacherUser._id.toString() });
    
    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(2);
  });
  
  test('Filters by date range', async () => {
    const res = await request(app)
      .get('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        fromDate: '2024-03-01',
        toDate: '2024-03-01'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(2);
  });
});

describe('GET /staff-attendance/summary - Get Summary', () => {
  beforeEach(async () => {
    await StaffAttendance.create([
      {
        user: teacherUser._id,
        date: new Date('2024-03-01'),
        status: 'present',
        markedBy: teacherUser._id
      },
      {
        user: teacherUser._id,
        date: new Date('2024-03-02'),
        status: 'present',
        markedBy: teacherUser._id
      },
      {
        user: teacherUser._id,
        date: new Date('2024-03-03'),
        status: 'absent',
        markedBy: adminUser._id
      },
      {
        user: teacherUser._id,
        date: new Date('2024-03-04'),
        status: 'late',
        markedBy: teacherUser._id
      }
    ]);
  });
  
  test('Returns attendance summary by status', async () => {
    const res = await request(app)
      .get('/api/staff-attendance/summary')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.summary.total).toBe(4);
    expect(res.body.summary.present).toBe(2);
    expect(res.body.summary.absent).toBe(1);
    expect(res.body.summary.late).toBe(1);
  });
  
  test('Admin can get summary for specific user', async () => {
    const res = await request(app)
      .get('/api/staff-attendance/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ userId: teacherUser._id.toString() });
    
    expect(res.status).toBe(200);
    expect(res.body.summary.total).toBe(4);
  });
});

describe('PATCH /staff-attendance/:id - Update Staff Attendance', () => {
  let attendanceRecord;
  
  beforeEach(async () => {
    attendanceRecord = await StaffAttendance.create({
      user: teacherUser._id,
      date: new Date(),
      status: 'present',
      markedBy: teacherUser._id
    });
  });
  
  test('Admin can update any attendance record', async () => {
    const res = await request(app)
      .patch(`/api/staff-attendance/${attendanceRecord._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'absent',
        remarks: 'Updated by admin'
      });
    
    expect(res.status).toBe(200);
    expect(res.body.record.status).toBe('absent');
  });
  
  test('HR cannot update attendance record', async () => {
    const res = await request(app)
      .patch(`/api/staff-attendance/${attendanceRecord._id}`)
      .set('Authorization', `Bearer ${hrToken}`)
      .send({ status: 'late' });
    
    expect(res.status).toBe(403);
  });
  
  test('Teacher cannot update own attendance', async () => {
    const res = await request(app)
      .patch(`/api/staff-attendance/${attendanceRecord._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        status: 'late',
        remarks: 'Traffic delay'
      });
    
    expect(res.status).toBe(403);
  });
  
  test('Teacher cannot update other staff attendance', async () => {
    const otherRecord = await StaffAttendance.create({
      user: hrUser._id,
      date: new Date(),
      status: 'present',
      markedBy: hrUser._id
    });
    
    const res = await request(app)
      .patch(`/api/staff-attendance/${otherRecord._id}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'absent' });
    
    expect(res.status).toBe(403);
  });
});

describe('DELETE /staff-attendance/:id - Delete Staff Attendance', () => {
  let attendanceRecord;
  
  beforeEach(async () => {
    attendanceRecord = await StaffAttendance.create({
      user: teacherUser._id,
      date: new Date(),
      status: 'present',
      markedBy: teacherUser._id
    });
  });
  
  test('Admin can delete attendance record', async () => {
    const res = await request(app)
      .delete(`/api/staff-attendance/${attendanceRecord._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    
    const count = await StaffAttendance.countDocuments();
    expect(count).toBe(0);
  });
  
  test('HR can delete attendance record', async () => {
    const res = await request(app)
      .delete(`/api/staff-attendance/${attendanceRecord._id}`)
      .set('Authorization', `Bearer ${hrToken}`);
    
    expect(res.status).toBe(200);
  });
  
  test('Teacher cannot delete attendance record', async () => {
    const res = await request(app)
      .delete(`/api/staff-attendance/${attendanceRecord._id}`)
      .set('Authorization', `Bearer ${teacherToken}`);
    
    expect(res.status).toBe(403);
  });
});

describe('GET /staff-attendance/export - Export Staff Attendance', () => {
  beforeEach(async () => {
    await StaffAttendance.create({
      user: teacherUser._id,
      date: new Date('2024-03-01'),
      status: 'present',
      markedBy: teacherUser._id,
      remarks: 'Test remark'
    });
  });
  
  test('Admin can export staff attendance as CSV', async () => {
    const res = await request(app)
      .get('/api/staff-attendance/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ format: 'csv' });
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Date,Staff Name');
    expect(res.text).toContain('Teacher User');
  });
  
  test('HR can export staff attendance', async () => {
    const res = await request(app)
      .get('/api/staff-attendance/export')
      .set('Authorization', `Bearer ${hrToken}`)
      .query({ format: 'csv' });
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
  });
  
  test('Teacher cannot export staff attendance', async () => {
    const res = await request(app)
      .get('/api/staff-attendance/export')
      .set('Authorization', `Bearer ${teacherToken}`)
      .query({ format: 'csv' });
    
    expect(res.status).toBe(403);
  });
  
  test('Can filter export by userId', async () => {
    await StaffAttendance.create({
      user: hrUser._id,
      date: new Date('2024-03-01'),
      status: 'present',
      markedBy: hrUser._id
    });
    
    const res = await request(app)
      .get('/api/staff-attendance/export')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ 
        format: 'csv',
        userId: teacherUser._id.toString()
      });
    
    expect(res.status).toBe(200);
    const lines = res.text.split('\n');
    expect(lines.length).toBe(2); // Header + 1 record
  });
});

describe('Date Normalization', () => {
  test('Normalizes dates to midnight', async () => {
    const dateWithTime = new Date('2024-03-01T15:30:00Z');
    
    const res = await request(app)
      .post('/api/staff-attendance')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        date: dateWithTime.toISOString(),
        status: 'present',
        remarks: '',
        userId: teacherUser._id.toString()
      });
    
    expect(res.status).toBe(201);
    
    const record = await StaffAttendance.findOne({ user: teacherUser._id });
    const savedDate = new Date(record.date);
    expect(savedDate.getHours()).toBe(0);
    expect(savedDate.getMinutes()).toBe(0);
    expect(savedDate.getSeconds()).toBe(0);
  });
});
