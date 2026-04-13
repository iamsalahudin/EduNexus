/*
  Cleanup script: deletes duplicate draft exams.
  Keeps the latest draft per (className, type, year, month-for-monthly).

  Usage:
    node src/scripts/cleanupDuplicateDraftExams.js        # dry-run
    node src/scripts/cleanupDuplicateDraftExams.js --yes  # delete

  Requires MONGO_URI in backend/.env (or environment).
*/

const mongoose = require('mongoose');
const config = require('../config');
const Exam = require('../models/exam');

function keyOf(exam) {
  const className = String(exam?.className || '').trim();
  const type = String(exam?.type || '').trim();
  const year = String(exam?.year ?? '').trim();
  const month = type === 'monthly' ? String(exam?.month ?? '').trim() : '';
  return `${className}__${type}__${year}__${month}`;
}

async function main() {
  const uri = config.mongoUri;
  if (!uri) {
    console.error('Missing MONGO_URI. Set it in backend/.env or environment variables.');
    process.exit(1);
  }

  const doDelete = process.argv.includes('--yes');

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const drafts = await Exam.find({ status: 'draft' })
    .select('_id className type year month createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const seen = new Set();
  const toDelete = [];

  for (const ex of drafts) {
    const key = keyOf(ex);
    if (!seen.has(key)) {
      seen.add(key);
      continue;
    }
    toDelete.push(ex._id);
  }

  if (!toDelete.length) {
    console.log('No duplicate draft exams found.');
    process.exit(0);
  }

  console.log(`Duplicate draft exams to delete: ${toDelete.length}`);

  if (!doDelete) {
    console.log('Dry-run only. Re-run with --yes to delete.');
    process.exit(0);
  }

  const result = await Exam.deleteMany({ _id: { $in: toDelete } });
  console.log(`Deleted: ${result.deletedCount}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Cleanup failed', err);
  process.exit(1);
});
