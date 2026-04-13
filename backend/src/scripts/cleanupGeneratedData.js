const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const {
  Attendance,
  ExamMark,
  Fee,
  Homework,
  HomeworkFile,
  Notification,
  Parent,
  RefreshToken,
  ReportCard,
  Student,
  StudentCertificate,
  Transport,
  User,
} = require('../models');

function dedupeObjectIds(values) {
  const strings = (Array.isArray(values) ? values : [])
    .filter(Boolean)
    .map((v) => String(v));
  return [...new Set(strings)].map((id) => new mongoose.Types.ObjectId(id));
}

async function unlinkIfExists(filePath) {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (err) {
    if (err && err.code === 'ENOENT') return false;
    throw err;
  }
}

async function gatherCleanupTargets() {
  const seededStudents = await Student.find({
    $or: [
      { notes: /Admitted via resetAndSeedStudents script/i },
      { studentId: /^STU-26-/i },
      { registrationNumber: /^REG-26-/i },
    ],
  })
    .select('_id user parents')
    .lean();

  const seededStudentIds = seededStudents.map((s) => s._id);
  const seededStudentUserIds = seededStudents.map((s) => s.user);
  const seededParentUserIds = seededStudents.flatMap((s) =>
    Array.isArray(s.parents) ? s.parents : []
  );

  const localUsers = await User.find({ email: /@edunexus\.local$/i })
    .select('_id role')
    .lean();

  const localStudentUserIds = localUsers
    .filter((u) => String(u.role || '').toLowerCase() === 'student')
    .map((u) => u._id);

  const localParentUserIds = localUsers
    .filter((u) => String(u.role || '').toLowerCase() === 'parent')
    .map((u) => u._id);

  const candidateCerts = await StudentCertificate.find({
    $or: [
      { 'studentSnapshot.studentId': /^STU-26-/i },
      { certificateNumber: /^SLC-\d{4}-\d+-STU-26-/i },
      { certificateNumber: /^TC-\d{4}-\d+-STU-26-/i },
    ],
  })
    .select('_id pdf.relativePath student')
    .lean();

  const explicitGeneratedPdfPaths = [
    path.resolve(process.cwd(), 'uploads', 'certificates', '2026', 'slc', 'SLC-2026-00001-STU-26-0003.pdf'),
    path.resolve(process.cwd(), 'uploads', 'certificates', '2026', 'slc', 'SLC-2026-00002-STU-26-0003.pdf'),
  ];

  const certFilePaths = [
    ...candidateCerts
      .map((c) => c?.pdf?.relativePath)
      .filter(Boolean)
      .map((relativePath) => path.resolve(process.cwd(), relativePath)),
    ...explicitGeneratedPdfPaths,
  ];

  return {
    studentIds: dedupeObjectIds(seededStudentIds),
    studentUserIds: dedupeObjectIds([...seededStudentUserIds, ...localStudentUserIds]),
    parentUserIds: dedupeObjectIds([...seededParentUserIds, ...localParentUserIds]),
    certificateIds: dedupeObjectIds(candidateCerts.map((c) => c._id)),
    certFilePaths: [...new Set(certFilePaths.map((p) => String(p)))],
  };
}

async function executeCleanup(targets) {
  const {
    studentIds,
    studentUserIds,
    parentUserIds,
    certificateIds,
    certFilePaths,
  } = targets;

  const removed = {
    attendance: 0,
    examMarks: 0,
    fees: 0,
    homework: 0,
    homeworkFiles: 0,
    reportCards: 0,
    transports: 0,
    certificates: 0,
    students: 0,
    studentUsers: 0,
    parents: 0,
    parentUsers: 0,
    refreshTokens: 0,
    filesDeleted: 0,
  };

  if (studentIds.length > 0) {
    const [attendance, examMarks, fees, homework, homeworkFiles, reportCards, transports, students] = await Promise.all([
      Attendance.deleteMany({ student: { $in: studentIds } }),
      ExamMark.deleteMany({ student: { $in: studentIds } }),
      Fee.deleteMany({ student: { $in: studentIds } }),
      Homework.deleteMany({ student: { $in: studentIds } }),
      HomeworkFile.deleteMany({ student: { $in: studentIds } }),
      ReportCard.deleteMany({ student: { $in: studentIds } }),
      Transport.deleteMany({ student: { $in: studentIds } }),
      Student.deleteMany({ _id: { $in: studentIds } }),
    ]);

    await Notification.updateMany(
      { targetStudents: { $in: studentIds } },
      { $pull: { targetStudents: { $in: studentIds } } }
    );

    removed.attendance = attendance.deletedCount || 0;
    removed.examMarks = examMarks.deletedCount || 0;
    removed.fees = fees.deletedCount || 0;
    removed.homework = homework.deletedCount || 0;
    removed.homeworkFiles = homeworkFiles.deletedCount || 0;
    removed.reportCards = reportCards.deletedCount || 0;
    removed.transports = transports.deletedCount || 0;
    removed.students = students.deletedCount || 0;
  }

  if (certificateIds.length > 0) {
    const certificates = await StudentCertificate.deleteMany({ _id: { $in: certificateIds } });
    removed.certificates = certificates.deletedCount || 0;
  }

  if (studentUserIds.length > 0) {
    const [refreshTokens, studentUsers] = await Promise.all([
      RefreshToken.deleteMany({ user: { $in: studentUserIds } }),
      User.deleteMany({ _id: { $in: studentUserIds } }),
    ]);
    removed.refreshTokens += refreshTokens.deletedCount || 0;
    removed.studentUsers = studentUsers.deletedCount || 0;
  }

  if (parentUserIds.length > 0) {
    const [parentDocs, refreshTokens, parentUsers] = await Promise.all([
      Parent.deleteMany({ user: { $in: parentUserIds } }),
      RefreshToken.deleteMany({ user: { $in: parentUserIds } }),
      User.deleteMany({ _id: { $in: parentUserIds } }),
    ]);
    removed.parents = parentDocs.deletedCount || 0;
    removed.refreshTokens += refreshTokens.deletedCount || 0;
    removed.parentUsers = parentUsers.deletedCount || 0;
  }

  for (const filePath of certFilePaths) {
    // Best-effort file cleanup for generated certificate PDFs.
    // Missing files are ignored so this script stays idempotent.
    // eslint-disable-next-line no-await-in-loop
    const deleted = await unlinkIfExists(filePath);
    if (deleted) removed.filesDeleted += 1;
  }

  return removed;
}

async function main() {
  const doDelete = process.argv.includes('--yes');

  await connectDB();
  console.log('Connected to DB');

  const targets = await gatherCleanupTargets();
  const summary = {
    studentIds: targets.studentIds.length,
    studentUserIds: targets.studentUserIds.length,
    parentUserIds: targets.parentUserIds.length,
    certificateIds: targets.certificateIds.length,
    certFiles: targets.certFilePaths.length,
  };

  console.log('Cleanup target summary:', summary);

  if (!doDelete) {
    console.log('Dry-run only. Re-run with --yes to apply cleanup.');
    return;
  }

  const removed = await executeCleanup(targets);
  console.log('Cleanup completed:', removed);
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('Generated data cleanup failed:', err?.message || err);
    try {
      await mongoose.disconnect();
    } catch (_) {
      // ignore disconnect errors
    }
    process.exit(1);
  });
