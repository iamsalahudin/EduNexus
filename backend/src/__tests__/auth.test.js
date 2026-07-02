const request = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { MongoMemoryServer } = require('mongodb-memory-server')
const app = require('../index')
const { User, RefreshToken } = require('../models')

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

beforeEach(async () => {
  await User.deleteMany({})
  await RefreshToken.deleteMany({})
})

describe('Auth login', () => {
  test('accepts teacher accounts stored with mixed-case username and legacy plain-text password', async () => {
    await User.collection.insertOne({
      name: 'Teacher User',
      username: 'TeacherOne',
      email: 'teacher.one@example.com',
      password: 'teacher@123',
      role: 'Teacher',
      active: true,
      failedLoginAttempts: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'teacherone', password: 'teacher@123' })

    expect(response.status).toBe(200)
    expect(response.body.user.role).toBe('Teacher')
    expect(response.body.user.username).toBe('TeacherOne')
    expect(response.body.accessToken).toBeTruthy()

    const storedUser = await User.findOne({ email: 'teacher.one@example.com' }).lean()
    expect(storedUser.password).not.toBe('teacher@123')
    expect(await bcrypt.compare('teacher@123', storedUser.password)).toBe(true)
  })
})