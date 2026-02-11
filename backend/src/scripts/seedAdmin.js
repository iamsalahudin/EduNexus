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

    const adminEmail = 'admin@edu.com';
    const adminPassword = 'admin@123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({ name: 'Admin', email: adminEmail, password: adminPassword, role: 'Admin' });
      console.log('Created admin user:', adminEmail);
    } else {
      console.log('Admin user already exists:', adminEmail);
    }

    console.log('Seeding complete');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed', err);
    process.exit(1);
  }
}

seed();
