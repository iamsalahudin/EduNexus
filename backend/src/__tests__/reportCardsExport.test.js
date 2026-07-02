const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Set Jest timeout BEFORE any hooks
jest.setTimeout(180000);

const app = require('../index');
const { User, Student, Subject, ReportCard } = require('../models');

let mongoServer;
let adminUser;
let adminToken;
let studentUser;
let studentRecord;
let subject;
let reportCard;

function parseBinary(res, callback) {
  res.setEncoding('binary');
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => callback(null, Buffer.from(data, 'binary')));
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Admin User',
    username: 'report_admin',
    email: 'report_admin@test.com',
    password: 'hashedpassword',
    role: 'Admin'
  });

  studentUser = await User.create({
    name: 'Student User',
    username: 'report_student',
    email: 'report_student@test.com',
    password: 'hashedpassword',
    role: 'Student'
  });

  studentRecord = await Student.create({
    user: studentUser._id,
    studentId: 'STU-REPORT-1',
    registrationNumber: 'REG-REPORT-1',
    class: '10',
    section: 'A',
    contact: '03001234567',
    dob: new Date('2010-01-01'),
    status: 'incampus'
  });

  subject = await Subject.create({
    name: 'Mathematics',
    code: 'MTH-1',
    className: '10',
    teacher: adminUser._id
  });

  reportCard = await ReportCard.create({
    student: studentRecord._id,
    term: 'Term 1',
    year: 2026,
    subjects: [
      { subject: subject._id, marks: 90, grade: 'A+', remarks: 'Excellent' }
    ],
    totalMarks: 90,
    percentage: 90,
    status: 'published',
    createdBy: adminUser._id
  });

  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, process.env.JWT_SECRET || 'test-secret');
});

afterAll(async () => {
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore disconnect errors
  }
  if (mongoServer) {
    try {
      await mongoServer.stop();
    } catch (e) {
      // ignore stop errors
    }
  }
});

describe('Report card export endpoints', () => {
  test('rejects invalid studentIds query on zip export', async () => {
    const res = await request(app)
      .get('/api/reports/export/zip')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ studentIds: 'bad-id' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation error');
  });

  test('exports a PDF for matching report cards', async () => {
    const res = await request(app)
      .get('/api/reports/export/pdf')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ term: 'Term 1', year: 2026, studentIds: studentRecord._id.toString() })
      .buffer(true)
      .parse(parseBinary);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('report-cards.pdf');
    expect(res.body.slice(0, 5).toString()).toBe('%PDF-');
  });

  test('exports a ZIP with per-student PDFs', async () => {
    const res = await request(app)
      .get('/api/reports/export/zip')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ term: 'Term 1', year: 2026, studentIds: studentRecord._id.toString() })
      .buffer(true)
      .parse(parseBinary);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/zip');
    expect(res.headers['content-disposition']).toContain('report-cards.zip');
    expect(res.body.slice(0, 2).toString()).toBe('PK');
  });
});
