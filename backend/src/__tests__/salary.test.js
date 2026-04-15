const request = require('supertest')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../index')
const { User, Teacher, SalaryStaff, SalarySlip, SalaryStructure } = require('../models')

let mongoServer
let adminToken
let principalToken
let hrToken
let financeToken
let teacherToken
let receptionistToken
let adminUser
let principalUser
let hrUser
let financeUser
let teacherUser
let receptionistUser
let teacherRecord

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())

  adminUser = await User.create({ name: 'Admin', username: 'salary_admin', email: 'salary_admin@test.com', password: 'hashedpassword', role: 'Admin' })
  principalUser = await User.create({ name: 'Principal', username: 'salary_principal', email: 'salary_principal@test.com', password: 'hashedpassword', role: 'Principal' })
  hrUser = await User.create({ name: 'HR', username: 'salary_hr', email: 'salary_hr@test.com', password: 'hashedpassword', role: 'HR' })
  financeUser = await User.create({ name: 'Finance', username: 'salary_finance', email: 'salary_finance@test.com', password: 'hashedpassword', role: 'Finance' })
  teacherUser = await User.create({ name: 'Teacher', username: 'salary_teacher', email: 'salary_teacher@test.com', password: 'hashedpassword', role: 'Teacher' })
  receptionistUser = await User.create({ name: 'Reception', username: 'salary_reception', email: 'salary_reception@test.com', password: 'hashedpassword', role: 'Reception' })

  teacherRecord = await Teacher.create({
    user: teacherUser._id,
    employeeId: 'T-1001',
    designation: 'Senior Teacher',
    department: 'Science',
    subjects: ['Math'],
    classesAssigned: ['10-A'],
    qualification: 'MSc',
    joiningDate: new Date('2020-01-01'),
    experienceYears: 5,
    salary: 60000,
    contactNumber: '03001234567',
    address: 'Test Address',
    status: 'Working'
  })

  const secret = process.env.JWT_SECRET || 'test-secret'
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret)
  principalToken = jwt.sign({ sub: principalUser._id.toString(), role: 'Principal' }, secret)
  hrToken = jwt.sign({ sub: hrUser._id.toString(), role: 'HR' }, secret)
  financeToken = jwt.sign({ sub: financeUser._id.toString(), role: 'Finance' }, secret)
  teacherToken = jwt.sign({ sub: teacherUser._id.toString(), role: 'Teacher' }, secret)
  receptionistToken = jwt.sign({ sub: receptionistUser._id.toString(), role: 'Reception' }, secret)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

beforeEach(async () => {
  await SalarySlip.deleteMany({})
  await SalaryStaff.deleteMany({})
  await SalaryStructure.deleteMany({})
  await Teacher.updateOne({ _id: teacherRecord._id }, { $set: { salary: 60000 } })
})

describe('Salary module', () => {
  test('Admin can create salary-only staff and generate slips', async () => {
    const staffRes = await request(app)
      .post('/api/salary/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Office Assistant',
        employeeId: 'S-1001',
        designation: 'Assistant',
        department: 'Admin',
        staffType: 'staff',
        salaryOnly: true,
        monthlySalary: 30000,
        status: 'active'
      })

    expect(staffRes.status).toBe(201)
    expect(staffRes.body.staff.employeeId).toBe('S-1001')

    const generateRes = await request(app)
      .post('/api/salary/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ periodMonth: '2026-04' })

    expect(generateRes.status).toBe(201)
    expect(generateRes.body.createdCount).toBeGreaterThanOrEqual(2)
  })

  test('Teacher salary view is personal only', async () => {
    await request(app)
      .post('/api/salary/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ periodMonth: '2026-04' })

    const summaryRes = await request(app)
      .get('/api/salary/summary')
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(summaryRes.status).toBe(200)
    expect(summaryRes.body.staffCount).toBe(1)
    expect(summaryRes.body.slipCount).toBe(1)

    const recordsRes = await request(app)
      .get('/api/salary/records')
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(recordsRes.status).toBe(200)
    expect(recordsRes.body.records).toHaveLength(1)
    expect(recordsRes.body.records[0].name).toBe(teacherUser.name)
  })

  test('Principal can read salary summary and records', async () => {
    await request(app)
      .post('/api/salary/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ periodMonth: '2026-04' })

    const summaryRes = await request(app)
      .get('/api/salary/summary')
      .set('Authorization', `Bearer ${principalToken}`)

    expect(summaryRes.status).toBe(200)
    expect(summaryRes.body.slipCount).toBeGreaterThan(0)

    const recordsRes = await request(app)
      .get('/api/salary/records')
      .set('Authorization', `Bearer ${principalToken}`)

    expect(recordsRes.status).toBe(200)
    expect(recordsRes.body.records.length).toBeGreaterThan(0)
  })

  test('HR can create and list salary structures', async () => {
    const createRes = await request(app)
      .post('/api/salary/structures')
      .set('Authorization', `Bearer ${hrToken}`)
      .send({
        name: 'Teacher Base',
        staffType: 'teacher',
        baseSalary: 50000,
        allowancesTotal: 5000,
        deductionsTotal: 1000,
        active: true
      })

    expect(createRes.status).toBe(201)

    const listRes = await request(app)
      .get('/api/salary/structures')
      .set('Authorization', `Bearer ${hrToken}`)

    expect(listRes.status).toBe(200)
    expect(listRes.body.structures).toHaveLength(1)
  })

  test('Finance can read transaction reports without teacher names', async () => {
    await request(app)
      .post('/api/salary/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ periodMonth: '2026-04' })

    const res = await request(app)
      .get('/api/salary/reports')
      .set('Authorization', `Bearer ${financeToken}`)
      .query({ periodMonth: '2026-04' })

    expect(res.status).toBe(200)
    expect(res.body.rows.length).toBeGreaterThan(0)
    expect(res.body.rows[0].name).toBeUndefined()
  })

  test('Reception can update salary status', async () => {
    await request(app)
      .post('/api/salary/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ periodMonth: '2026-04' })

    const slip = await SalarySlip.findOne({ periodMonth: '2026-04' })
    expect(slip).toBeTruthy()

    const res = await request(app)
      .patch(`/api/salary/slips/${slip._id}/status`)
      .set('Authorization', `Bearer ${receptionistToken}`)
      .send({ status: 'paid' })

    expect(res.status).toBe(200)
    expect(res.body.slip.status).toBe('paid')
  })

  test('Teacher can download personal salary slip PDF', async () => {
    await request(app)
      .post('/api/salary/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ periodMonth: '2026-04' })

    const teacherStaff = await SalaryStaff.findOne({ user: teacherUser._id })
    expect(teacherStaff).toBeTruthy()

    const teacherSlip = await SalarySlip.findOne({ periodMonth: '2026-04', staff: teacherStaff._id })
    expect(teacherSlip).toBeTruthy()

    const res = await request(app)
      .get(`/api/salary/slips/${teacherSlip._id}/pdf`)
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('application/pdf')
  })

  test('Teacher cannot download another staff salary slip PDF', async () => {
    await request(app)
      .post('/api/salary/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Office Assistant',
        employeeId: 'S-2001',
        designation: 'Assistant',
        department: 'Admin',
        staffType: 'staff',
        salaryOnly: true,
        monthlySalary: 30000,
        status: 'active'
      })

    await request(app)
      .post('/api/salary/generate-monthly')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ periodMonth: '2026-04' })

    const staffRow = await SalaryStaff.findOne({ employeeId: 'S-2001' })
    expect(staffRow).toBeTruthy()

    const selectedSlip = await SalarySlip.findOne({ periodMonth: '2026-04', staff: staffRow._id })
    expect(selectedSlip).toBeTruthy()

    const res = await request(app)
      .get(`/api/salary/slips/${selectedSlip._id}/pdf`)
      .set('Authorization', `Bearer ${teacherToken}`)

    expect(res.status).toBe(403)
  })
})