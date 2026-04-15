const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/user');

function sanitizeUsername(value, fallback = 'user') {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return cleaned || fallback;
}

function derivePreferredUsername(user) {
  const existing = sanitizeUsername(user.username || '');
  if (existing) return existing;

  const emailLocal = String(user.email || '').split('@')[0];
  const fromEmail = sanitizeUsername(emailLocal || '');
  if (fromEmail) return fromEmail;

  const fromName = sanitizeUsername(String(user.name || '').replace(/\s+/g, '.'));
  if (fromName) return fromName;

  return 'user';
}

async function backfillUsernames() {
  await connectDB();
  console.log('Connected to DB');

  const users = await User.find({}).sort({ createdAt: 1, _id: 1 });
  const used = new Set();
  let updated = 0;

  for (const user of users) {
    const preferred = derivePreferredUsername(user);
    let candidate = preferred;
    let suffix = 1;

    while (used.has(candidate)) {
      candidate = `${preferred}${suffix}`;
      suffix += 1;
    }

    used.add(candidate);

    const normalizedCurrent = sanitizeUsername(user.username || '');
    if (normalizedCurrent !== candidate) {
      user.username = candidate;
      await user.save();
      updated += 1;
    }
  }

  console.log(`Processed ${users.length} users`);
  console.log(`Updated ${updated} users`);
}

backfillUsernames()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Username backfill failed:', err?.message || err);
    await mongoose.disconnect();
    process.exit(1);
  });
