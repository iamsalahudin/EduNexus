/*
  Seed script: creates default roles and an admin user.
  Usage: `npm run seed` (reads MONGO_URI from .env or falls back to the URI provided here)
*/
const { connectDB } = require('../config/db');
const config = require('../config');
const mongoose = require('mongoose');
const Role = require('../models/role');
const User = require('../models/user');

const FALLBACK_URI = 'mongodb+srv://hussain:aws%401317@cluster0.nuopsgu.mongodb.net/edu';

async function seed() {
  const uri = config.mongoUri || FALLBACK_URI;
  if (!uri) {
    console.error('No MONGO_URI provided. Set MONGO_URI in environment or edit this script.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB for seeding');

    const roles = ['Admin','Principal','Finance','HR','Reception','Teacher','Student','Parent'];
    for (const r of roles) {
      const exists = await Role.findOne({ name: r });
      if (!exists) {
        await Role.create({ name: r, description: `${r} role`, permissions: [] });
        console.log('Created role', r);
      }
    }

    const demoUsers = [
      { name: 'Admin', role: 'Admin', email: 'admin@edu.com', password: 'admin@123' },
      { name: 'Principal', role: 'Principal', email: 'principal@edu.com', password: 'principal@123' },
      { name: 'Teacher', role: 'Teacher', email: 'teacher@edu.com', password: 'teacher@123' },
      { name: 'Student', role: 'Student', email: 'student@edu.com', password: 'student@123' },
      { name: 'Parent', role: 'Parent', email: 'parent@edu.com', password: 'parent@123' },
      { name: 'HR', role: 'HR', email: 'hr@edu.com', password: 'hr@123' },
      { name: 'Finance', role: 'Finance', email: 'finance@edu.com', password: 'finance@123' },
      { name: 'Reception', role: 'Reception', email: 'reception@edu.com', password: 'reception@123' },
    ];

    for (const u of demoUsers) {
      // User schema lowercases email, but ensure consistent lookup here
      const email = u.email.toLowerCase();
      const existing = await User.findOne({ email });
      if (!existing) {
        await User.create({ name: u.name, email, password: u.password, role: u.role });
        console.log('Created user:', email, `(${u.role})`);
      } else {
        console.log('User already exists:', email, `(${existing.role})`);
      }
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
