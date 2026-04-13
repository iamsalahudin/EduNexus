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
  SchoolClass,
  Student,
  StudentCertificate,
  Transport,
  User,
} = require('../models');

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function dedupeObjectIds(ids) {
  const asStrings = ids.filter(Boolean).map((id) => String(id));
  return [...new Set(asStrings)].map((id) => new mongoose.Types.ObjectId(id));
}

async function ensureSeedClasses() {
  let classes = await SchoolClass.find({ active: true }).sort({ name: 1 }).lean();
  if (classes.length > 0) return classes;

  const fallback = [
    { name: 'Class 7', sections: ['A', 'B'], active: true, tutionFee: 4500 },
    { name: 'Class 8', sections: ['A', 'B'], active: true, tutionFee: 5000 },
    { name: 'Class 9', sections: ['A'], active: true, tutionFee: 5500 },
  ];

  await SchoolClass.insertMany(fallback);
  classes = await SchoolClass.find({ active: true }).sort({ name: 1 }).lean();
  return classes;
}

async function purgeStudentsAndLinkedData() {
  const studentDocs = await Student.find({}, '_id user').lean();
  const studentIds = studentDocs.map((s) => s._id);
  const studentUserIdsFromStudentDocs = studentDocs.map((s) => s.user);
  const studentRoleUsers = await User.find({ role: 'Student' }, '_id').lean();
  const studentUserIdsByRole = studentRoleUsers.map((u) => u._id);

  const studentUserIds = dedupeObjectIds([
    ...studentUserIdsFromStudentDocs,
    ...studentUserIdsByRole,
  ]);

  if (studentIds.length > 0) {
    await Promise.all([
      Attendance.deleteMany({ student: { $in: studentIds } }),
      ExamMark.deleteMany({ student: { $in: studentIds } }),
      Fee.deleteMany({ student: { $in: studentIds } }),
      Homework.deleteMany({ student: { $in: studentIds } }),
      HomeworkFile.deleteMany({ student: { $in: studentIds } }),
      ReportCard.deleteMany({ student: { $in: studentIds } }),
      StudentCertificate.deleteMany({ student: { $in: studentIds } }),
      Transport.deleteMany({ student: { $in: studentIds } }),
      Notification.updateMany(
        { targetStudents: { $in: studentIds } },
        { $pull: { targetStudents: { $in: studentIds } } }
      ),
    ]);

    await Student.deleteMany({ _id: { $in: studentIds } });
  }

  if (studentUserIds.length > 0) {
    await Promise.all([
      RefreshToken.deleteMany({ user: { $in: studentUserIds } }),
      User.deleteMany({ _id: { $in: studentUserIds } }),
    ]);
  }

  return {
    removedStudents: studentIds.length,
    removedStudentUsers: studentUserIds.length,
  };
}

async function seedThreeStudents() {
  const classes = await ensureSeedClasses();

  const seedRows = [
    {
      studentName: 'Hassan Raza',
      studentUsername: 'hassan.raza7',
      studentEmail: 'hassan.raza7@edunexus.local',
      registrationNumber: 'REG-26-7001',
      rollNumber: '07-A-12',
      gender: 'Male',
      contact: '03001234561',
      address: 'Street 12, Madina Town, Faisalabad',
      parentName: 'Raza Ahmed',
      parentUsername: 'raza.ahmed.guardian',
      parentEmail: 'raza.ahmed.guardian@edunexus.local',
      parentPhone: '03001112223',
      relation: 'Father',
      occupation: 'Textile Supervisor',
      withTransport: true,
      route: 'Canal Road Route',
      pickupPoint: 'Gulberg Chowk',
      dropoffPoint: 'Campus Gate 1',
      transportFee: 1800,
    },
    {
      studentName: 'Ayesha Noor',
      studentUsername: 'ayesha.noor8',
      studentEmail: 'ayesha.noor8@edunexus.local',
      registrationNumber: 'REG-26-8002',
      rollNumber: '08-B-08',
      gender: 'Female',
      contact: '03002223334',
      address: 'Sitara Colony, Faisalabad',
      parentName: 'Nadia Saleem',
      parentUsername: 'nadia.saleem.guardian',
      parentEmail: 'nadia.saleem.guardian@edunexus.local',
      parentPhone: '03003334445',
      relation: 'Mother',
      occupation: 'School Teacher',
      withTransport: false,
    },
    {
      studentName: 'Usman Tariq',
      studentUsername: 'usman.tariq9',
      studentEmail: 'usman.tariq9@edunexus.local',
      registrationNumber: 'REG-26-9003',
      rollNumber: '09-A-03',
      gender: 'Male',
      contact: '03004445556',
      address: 'People Colony No. 1, Faisalabad',
      parentName: 'Tariq Mehmood',
      parentUsername: 'tariq.mehmood.guardian',
      parentEmail: 'tariq.mehmood.guardian@edunexus.local',
      parentPhone: '03005556667',
      relation: 'Father',
      occupation: 'Account Manager',
      withTransport: true,
      route: 'D-Ground Route',
      pickupPoint: 'D-Ground Main',
      dropoffPoint: 'Campus Gate 2',
      transportFee: 2000,
    },
  ];

  const seeded = [];
  const defaultPassword = 'Std@12345';

  for (let i = 0; i < seedRows.length; i += 1) {
    const row = seedRows[i];
    const classDoc = classes[i % classes.length];
    const firstSection = Array.isArray(classDoc.sections) && classDoc.sections.length > 0
      ? classDoc.sections[0]
      : '';

    const parentUser = await User.create({
      name: row.parentName,
      username: row.parentUsername,
      email: row.parentEmail,
      password: defaultPassword,
      role: 'Parent',
      active: true,
    });

    await Parent.create({
      user: parentUser._id,
      name: row.parentName,
      email: row.parentEmail,
      phone: row.parentPhone,
      relation: row.relation,
      occupation: row.occupation,
      address: row.address,
    });

    const studentUser = await User.create({
      name: row.studentName,
      username: row.studentUsername,
      email: row.studentEmail,
      password: defaultPassword,
      role: 'Student',
      active: true,
    });

    const student = await Student.create({
      user: studentUser._id,
      studentId: `STU-26-${String(i + 1).padStart(4, '0')}`,
      registrationNumber: row.registrationNumber,
      rollNumber: row.rollNumber,
      class: classDoc.name,
      section: firstSection,
      dob: addDays(new Date('2011-01-01'), i * 120),
      parents: [parentUser._id],
      contact: row.contact,
      address: row.address,
      enrollDate: new Date(),
      gender: row.gender,
      status: 'incampus',
      notes: 'Admitted via resetAndSeedStudents script',
      lastFeePaid: false,
      balance: Number(classDoc.tutionFee || 0),
      availTransport: Boolean(row.withTransport),
    });

    await Fee.create({
      student: student._id,
      amount: Number(classDoc.tutionFee || 0),
      dueDate: addDays(new Date(), 15),
      status: 'pending',
      notes: 'Initial monthly fee generated by seed script',
    });

    if (row.withTransport) {
      await Transport.create({
        student: student._id,
        route: row.route,
        pickupPoint: row.pickupPoint,
        dropoffPoint: row.dropoffPoint,
        transportFee: row.transportFee,
        active: true,
      });
    }

    seeded.push({
      studentName: row.studentName,
      studentId: student.studentId,
      registrationNumber: student.registrationNumber,
      class: student.class,
      section: student.section,
      studentUsername: row.studentUsername,
      parentName: row.parentName,
      parentUsername: row.parentUsername,
      password: defaultPassword,
    });
  }

  return seeded;
}

async function main() {
  try {
    await connectDB();

    const cleanup = await purgeStudentsAndLinkedData();
    const seeded = await seedThreeStudents();

    console.log('Student cleanup completed.');
    console.log(cleanup);
    console.log('Seeded students:');
    console.table(seeded);
  } catch (err) {
    console.error('Failed to reset/seed students:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
