const fs = require('fs/promises');
const path = require('path');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const app = require('../index');
const { Notification, User } = require('../models');

let mongoServer;
let adminUser;
let adminToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  adminUser = await User.create({
    name: 'Admin User',
    username: 'admin_notifications_test',
    email: 'admin_notifications@test.com',
    password: 'hashedpassword',
    role: 'Admin'
  });

  const secret = process.env.JWT_SECRET || 'test-secret';
  adminToken = jwt.sign({ sub: adminUser._id.toString(), role: 'Admin' }, secret);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Notification.deleteMany({});
});

describe('Notifications attachments', () => {
  test('creates a broadcast announcement with a file attachment', async () => {
    const res = await request(app)
      .post('/api/notifications/broadcast')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('scope', 'global')
      .field('category', 'info')
      .field('title', 'Attachment Notice')
      .field('body', 'Please review the attached notice.')
      .attach('attachments', Buffer.from('notice file content'), 'notice.txt');

    expect(res.status).toBe(201);
    expect(res.body.notification).toBeTruthy();
    expect(Array.isArray(res.body.notification.attachments)).toBe(true);
    expect(res.body.notification.attachments).toHaveLength(1);
    expect(res.body.notification.attachments[0]).toMatch(/^\/uploads\/notifications\//);

    const notification = await Notification.findById(res.body.notification._id).lean();
    expect(notification).toBeTruthy();
    expect(notification.attachments).toHaveLength(1);

    const relativePath = notification.attachments[0].replace(/^\//, '');
    const filePath = path.resolve(process.cwd(), relativePath);
    await expect(fs.access(filePath)).resolves.toBeUndefined();

    const listRes = await request(app)
      .get('/api/notifications/broadcast')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body.notifications)).toBe(true);
    expect(listRes.body.notifications).toHaveLength(1);
    expect(listRes.body.notifications[0].attachments).toHaveLength(1);
  });
});