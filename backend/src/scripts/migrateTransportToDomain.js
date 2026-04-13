/*
  Migrate legacy Transport records into the new transport domain.

  Usage:
    node src/scripts/migrateTransportToDomain.js
    node src/scripts/migrateTransportToDomain.js --with-payments
    node src/scripts/migrateTransportToDomain.js --yes
*/

const mongoose = require('mongoose');
const config = require('../config');
const { connectDB } = require('../config/db');
const {
  Student,
  Transport,
  TransportRoute,
  TransportEnrollment,
  TransportPayment
} = require('../models');

function normalizeText(value) {
  return String(value || '').trim();
}

function routeKey(row) {
  return [
    normalizeText(row.route).toLowerCase(),
    normalizeText(row.pickupPoint).toLowerCase(),
    normalizeText(row.dropoffPoint).toLowerCase(),
    String(Number(row.transportFee || 0))
  ].join('|');
}

function feeWithConcession(baseFee, concessionPercent) {
  const fee = Number(baseFee || 0);
  const concession = Number(concessionPercent || 0);
  if (!Number.isFinite(fee) || fee < 0) return 0;
  if (!Number.isFinite(concession) || concession <= 0) return fee;
  const discounted = fee - (fee * concession) / 100;
  return Math.max(Math.round(discounted), 0);
}

async function migrateLegacyTransport({ withPayments = false } = {}) {
  const legacyRows = await Transport.find({}).sort({ createdAt: 1, _id: 1 }).lean();
  const routeCache = new Map();
  const summary = {
    legacyRows: legacyRows.length,
    routesCreated: 0,
    enrollmentsCreated: 0,
    enrollmentsUpdated: 0,
    paymentsCreated: 0,
    skippedMissingStudent: 0,
    skippedMissingUser: 0
  };

  for (const row of legacyRows) {
    const student = await Student.findById(row.student).populate('user', '_id role').lean();
    if (!student) {
      summary.skippedMissingStudent += 1;
      continue;
    }
    if (!student.user?._id) {
      summary.skippedMissingUser += 1;
      continue;
    }

    const key = routeKey(row);
    let route = routeCache.get(key);
    if (!route) {
      route = await TransportRoute.findOneAndUpdate(
        {
          name: normalizeText(row.route),
          pickupPoint: normalizeText(row.pickupPoint),
          dropoffPoint: normalizeText(row.dropoffPoint),
          fee: Number(row.transportFee || 0)
        },
        {
          name: normalizeText(row.route),
          pickupPoint: normalizeText(row.pickupPoint),
          dropoffPoint: normalizeText(row.dropoffPoint),
          fee: Number(row.transportFee || 0),
          active: Boolean(row.active),
          updatedBy: student.user._id
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      ).lean();
      routeCache.set(key, route);
      summary.routesCreated += 1;
    }

    const enrollment = await TransportEnrollment.findOneAndUpdate(
      {
        user: student.user._id,
        subjectRole: 'Student'
      },
      {
        route: route._id,
        user: student.user._id,
        subjectRole: 'Student',
        student: student._id,
        status: row.active ? 'enrolled' : 'inactive',
        notes: 'Migrated from legacy Transport collection',
        enrolledOn: row.createdAt || new Date(),
        deactivatedOn: row.active ? null : (row.updatedAt || new Date()),
        assignedBy: student.user._id,
        updatedBy: student.user._id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    if (enrollment) {
      summary.enrollmentsCreated += 1;
      if (withPayments) {
        const now = new Date();
        const month = now.getUTCMonth() + 1;
        const year = now.getUTCFullYear();
        const due = feeWithConcession(row.transportFee, student.transportFeeConcession);
        const payment = await TransportPayment.findOneAndUpdate(
          { enrollment: enrollment._id, periodMonth: month, periodYear: year },
          {
            enrollment: enrollment._id,
            route: route._id,
            user: student.user._id,
            subjectRole: 'Student',
            student: student._id,
            periodMonth: month,
            periodYear: year,
            amountDue: due,
            amountPaid: 0,
            status: row.active ? 'pending' : 'overdue',
            dueDate: new Date(Date.UTC(year, now.getUTCMonth(), 25)),
            remarks: 'Migrated from legacy Transport collection',
            updatedBy: student.user._id
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean();
        if (payment) summary.paymentsCreated += 1;
      }
    } else {
      summary.enrollmentsUpdated += 1;
    }
  }

  return summary;
}

async function main() {
  const doWrite = process.argv.includes('--yes');
  const withPayments = process.argv.includes('--with-payments');

  await connectDB();
  console.log('Connected to DB');

  const preview = {
    uri: config.mongoUri ? 'configured' : 'fallback',
    withPayments,
    writeEnabled: doWrite
  };
  console.log('Migration options:', preview);

  if (!doWrite) {
    const legacyCount = await Transport.countDocuments({});
    console.log(`Dry run: found ${legacyCount} legacy transport records. Re-run with --yes to migrate.`);
    return;
  }

  const result = await migrateLegacyTransport({ withPayments });
  console.log('Transport migration completed:', result);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Transport migration failed:', err?.message || err);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect errors
    }
    process.exit(1);
  });
