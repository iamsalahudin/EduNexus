const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../index');
const { Fee, SchoolClass, Student, User } = require('../models');

let mongoServer;
let adminUser;
let receptionUser;
let adminToken;
let receptionToken;

async function createStudent({ suffix, className = '10', section = 'A', concession = 0, parents = [] }) {
  const user = await User.create({
    name: `Student ${suffix}`,
    username: `student_fee_${suffix}`,
    email: `student_fee_${suffix}@test.com`,
    password: 'hashedpassword',
    role: 'Student'
  });

  const student = await Student.create({
    user: user._id,
    studentId: `STU-FEE-${suffix}`,
    registrationNumber: `REG-FEE-${suffix}`,
    rollNumber: `R-${suffix}`,
    class: className,
    section,
    contact: '03001234567',
    dob: new Date('2010-01-01'),
    status: 'incampus',
    tutionFeeConcession: concession,
    parents
  });

  return { user, student };
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Admin User',
    username: 'admin_fee_test',
    email: 'admin_fee@test.com',
    password: 'hashedpassword',
    role: 'Admin'
  });

  receptionUser = await User.create({
    name: 'Reception User',
    username: 'reception_fee_test',
    email: 'reception_fee@test.com',
    password: 'hashedpassword',
    role: 'Reception'
  });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
  receptionToken = jwt.sign({ sub: receptionUser._id.toString(), role: 'Reception' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Fee.deleteMany({});
  await Student.deleteMany({});
  await User.deleteMany({ role: 'Student' });
  await SchoolClass.deleteMany({});
});

describe('Fee monthly generation and reporting', () => {
  test('generates monthly fee with class tuition concession applied', async () => {
    await SchoolClass.create({ name: '10', sections: ['A'], tutionFee: 10000, active: true });
    const { student } = await createStudent({ suffix: 'gen1', className: '10', section: 'A', concession: 20 });

    const res = await request(app)
      .post('/api/fees/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ year: 2026, month: 4, class: '10', section: 'A' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.createdCount).toBe(1);

    const fee = await Fee.findOne({ student: student._id, cycleMonth: '2026-04' });
    expect(fee).toBeTruthy();
    expect(fee.source).toBe('monthly');
    expect(Number(fee.baseAmount)).toBe(10000);
    expect(Number(fee.concessionPercent)).toBe(20);
    expect(Number(fee.amount)).toBe(8000);
  });

  test('filters records by custom period', async () => {
    const { student } = await createStudent({ suffix: 'period1', className: '8', section: 'B' });

    await Fee.create([
      {
        student: student._id,
        source: 'manual',
        amount: 5000,
        dueDate: new Date('2026-04-10'),
        status: 'pending'
      },
      {
        student: student._id,
        source: 'manual',
        amount: 7000,
        dueDate: new Date('2026-03-10'),
        status: 'pending'
      }
    ]);

    const res = await request(app)
      .get('/api/fees/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ period: 'custom', from: '2026-04-01', to: '2026-04-30' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].roll).toBe('R-period1');
    expect(Number(res.body[0].pendingFee)).toBe(5000);
  });

  test('defaulters endpoint returns only pending students for reception', async () => {
    const { student: pendingStudent } = await createStudent({ suffix: 'def1', className: '7', section: 'A' });
    const { student: paidStudent } = await createStudent({ suffix: 'def2', className: '7', section: 'A' });

    await Fee.create([
      {
        student: pendingStudent._id,
        source: 'manual',
        amount: 4500,
        dueDate: new Date('2026-04-05'),
        status: 'pending'
      },
      {
        student: paidStudent._id,
        source: 'manual',
        amount: 4500,
        dueDate: new Date('2026-04-05'),
        status: 'paid',
        payments: [{ amount: 4500, method: 'cash', transactionId: 'tx-1', paidAt: new Date('2026-04-06') }]
      }
    ]);

    const res = await request(app)
      .get('/api/fees/defaulters')
      .set('Authorization', `Bearer ${receptionToken}`)
      .query({ period: 'custom', from: '2026-04-01', to: '2026-04-30' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].roll).toBe('R-def1');
    expect(Number(res.body[0].pendingFee)).toBeGreaterThan(0);
  });
});
