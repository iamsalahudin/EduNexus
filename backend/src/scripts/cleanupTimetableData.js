const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { Timetable } = require('../models');

function parseArgValue(name) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg).startsWith(prefix));
  if (!raw) return '';
  return String(raw).slice(prefix.length).trim();
}

function buildFilter() {
  const filter = {};

  const level = parseArgValue('level');
  if (level) filter.level = level;

  const yearRaw = parseArgValue('year');
  if (yearRaw) {
    const year = Number(yearRaw);
    if (Number.isFinite(year)) filter.year = year;
  }

  const status = parseArgValue('status');
  if (status) filter.status = status;

  const activeRaw = parseArgValue('isActive');
  if (activeRaw === 'true') filter.isActive = true;
  if (activeRaw === 'false') filter.isActive = false;

  return filter;
}

async function summarizeMatches(filter) {
  const [total, levelBreakdown, yearBreakdown] = await Promise.all([
    Timetable.countDocuments(filter),
    Timetable.aggregate([
      { $match: filter },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } }
    ]),
    Timetable.aggregate([
      { $match: filter },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ])
  ]);

  return { total, levelBreakdown, yearBreakdown };
}

async function main() {
  const doDelete = process.argv.includes('--yes');
  const filter = buildFilter();

  await connectDB();
  console.log('Connected to DB');

  const summary = await summarizeMatches(filter);
  console.log('Timetable cleanup filter:', filter);
  console.log('Matched timetables:', summary.total);
  console.log('By level:', summary.levelBreakdown);
  console.log('By year:', summary.yearBreakdown);

  if (!doDelete) {
    console.log('Dry-run only. Re-run with --yes to delete matched timetables.');
    return;
  }

  const result = await Timetable.deleteMany(filter);
  console.log('Deleted timetables:', result.deletedCount || 0);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Timetable cleanup failed:', err?.message || err);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect errors
    }
    process.exit(1);
  });
