/* eslint-disable no-console */
require('dotenv').config();

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const { SchoolClass, Timetable } = require('../models');

function keyForSlot(slot) {
  return [
    String(slot?.day || ''),
    String(slot?.startTime || ''),
    String(slot?.endTime || ''),
    String(slot?.class || ''),
    String(slot?.section || ''),
    String(slot?.subject || ''),
    String(slot?.teacher || ''),
    String(slot?.room || ''),
  ].join('|');
}

function normalizeSlot(slot = {}, fallbackClass, fallbackSection) {
  return {
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
    class: String(slot.class || fallbackClass || '').trim() || undefined,
    section: String(slot.section || fallbackSection || '').trim() || undefined,
    subject: slot.subject || undefined,
    teacher: slot.teacher || undefined,
    room: String(slot.room || '').trim() || undefined,
  };
}

async function main() {
  await connectDB();

  const classes = await SchoolClass.find({}).select('name level').lean();
  const classLevelMap = new Map(
    classes
      .map((c) => [String(c?.name || '').trim(), String(c?.level || '').trim()])
      .filter(([name, level]) => name && level)
  );

  const timetables = await Timetable.find({}).sort({ createdAt: 1 }).lean();
  console.log(`Found ${timetables.length} timetable records`);

  const grouped = new Map();
  const skipped = [];

  for (const doc of timetables) {
    const rootClass = String(doc?.class || '').trim();
    const rootLevel = String(doc?.level || '').trim();
    const resolvedLevel = rootLevel || classLevelMap.get(rootClass) || '';

    if (!resolvedLevel || !doc?.year) {
      skipped.push(String(doc?._id));
      continue;
    }

    const key = `${resolvedLevel}::${doc.year}`;
    const bucket = grouped.get(key) || {
      level: resolvedLevel,
      year: doc.year,
      keeperId: String(doc._id),
      createdBy: doc.createdBy,
      slotMap: new Map(),
      mergedFrom: [],
      removeIds: [],
    };

    bucket.mergedFrom.push(String(doc._id));

    const slots = Array.isArray(doc?.slots) ? doc.slots : [];
    for (const row of slots) {
      const normalized = normalizeSlot(row, rootClass, doc?.section);
      if (!normalized.day || !normalized.startTime || !normalized.endTime || !normalized.class) {
        continue;
      }
      const keyForRow = keyForSlot(normalized);
      if (!bucket.slotMap.has(keyForRow)) {
        bucket.slotMap.set(keyForRow, normalized);
      }
    }

    if (bucket.keeperId !== String(doc._id)) {
      bucket.removeIds.push(String(doc._id));
    }

    grouped.set(key, bucket);
  }

  let updatedCount = 0;
  let removedCount = 0;

  for (const [, bucket] of grouped) {
    const slots = Array.from(bucket.slotMap.values());

    await Timetable.findByIdAndUpdate(
      bucket.keeperId,
      {
        $set: {
          level: bucket.level,
          year: bucket.year,
          slots,
          createdBy: bucket.createdBy,
          updatedAt: new Date(),
        },
        $unset: {
          class: 1,
          section: 1,
        },
      },
      { new: false }
    );

    updatedCount += 1;

    if (bucket.removeIds.length) {
      const result = await Timetable.deleteMany({ _id: { $in: bucket.removeIds } });
      removedCount += result.deletedCount || 0;
    }
  }

  console.log(`Updated keepers: ${updatedCount}`);
  console.log(`Deleted merged records: ${removedCount}`);
  if (skipped.length) {
    console.log(`Skipped records (missing level/year): ${skipped.length}`);
    console.log(skipped.join(', '));
  }

  await mongoose.disconnect();
}

main()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Migration failed:', err);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore
    }
    process.exit(1);
  });
