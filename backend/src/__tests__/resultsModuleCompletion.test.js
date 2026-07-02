const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../index');
const { User, Student, Subject, Exam, Marksheet, ExamMark, ReportCard } = require('../models');

let mongoServer;
let adminUser;
let studentUser;
let student;
let subject;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Results Admin',
    username: 'results_admin',
    email: 'results_admin@test.com',
    password: 'password123',
    role: 'Admin'
  });

  studentUser = await User.create({
    name: 'Results Student',
    username: 'results_student',
    email: 'results_student@test.com',
    password: 'password123',
    role: 'Student'
  });

  student = await Student.create({
    user: studentUser._id,
    studentId: 'STD-RESULT-1',
    registrationNumber: 'REG-RESULT-1',
    class: '10',
    section: 'A',
    contact: '03000000001'
  });

  subject = await Subject.create({
    className: '10',
    name: 'Mathematics',
    active: true,
    order: 1
  });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await ExamMark.deleteMany({});
  await Marksheet.deleteMany({});
  await Exam.deleteMany({});
  await ReportCard.deleteMany({});
});

describe('Results module completion endpoints', () => {
  test('Admin imports marks from CSV and updates marksheet + exam marks', async () => {
    const exam = await Exam.create({
      className: '10',
      type: 'mid',
      name: 'Mid Term 2026',
      year: 2026,
      subjects: [{ subject: subject._id, maxMarks: 100 }],
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const marksheet = await Marksheet.create({
      exam: exam._id,
      className: '10',
      section: 'A',
      subjects: [subject._id],
      subjectMaxMarks: { [String(subject._id)]: 100 },
      studentRows: [
        {
          student: student._id,
          subjectMarks: [{ subject: subject._id, marks: 0 }]
        }
      ],
      status: 'draft',
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    const csv = 'Student ID,Mathematics\nSTD-RESULT-1,88\n';

    const res = await request(app)
      .post(`/api/marksheets/${marksheet._id}/import/csv`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('file', Buffer.from(csv, 'utf8'), 'marks.csv');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.updatedMarks).toBe(1);

    const updatedMarksheet = await Marksheet.findById(marksheet._id).lean();
    expect(updatedMarksheet.studentRows[0].subjectMarks[0].marks).toBe(88);

    const examMark = await ExamMark.findOne({
      exam: exam._id,
      student: student._id,
      subject: subject._id
    }).lean();

    expect(examMark).toBeTruthy();
    expect(examMark.marks).toBe(88);
  });

  test('Admin archives old published report cards via archive endpoint', async () => {
    const nowYear = new Date().getFullYear();

    const oldCard = await ReportCard.create({
      student: student._id,
      term: 'Final',
      year: nowYear - 5,
      subjects: [{ subject: subject._id, marks: 77, grade: 'B' }],
      totalMarks: 77,
      percentage: 77,
      status: 'published',
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date()
    });

    const recentCard = await ReportCard.create({
      student: student._id,
      term: 'Mid',
      year: nowYear - 1,
      subjects: [{ subject: subject._id, marks: 82, grade: 'A' }],
      totalMarks: 82,
      percentage: 82,
      status: 'published',
      createdBy: adminUser._id,
      approvedBy: adminUser._id,
      approvedAt: new Date()
    });

    const res = await request(app)
      .post('/api/reports/archive/run')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ years: 3 });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.archivedCount).toBe(1);

    const oldAfter = await ReportCard.findById(oldCard._id).lean();
    const recentAfter = await ReportCard.findById(recentCard._id).lean();

    expect(oldAfter.archived).toBe(true);
    expect(oldAfter.archivedAt).toBeTruthy();
    expect(recentAfter.archived).toBe(false);
  });
});
