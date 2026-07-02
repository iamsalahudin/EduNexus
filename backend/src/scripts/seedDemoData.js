/*
  Demo seed script:
  - Ensures a class catalog exists
  - Creates 2 students for each class in an available section
  - Creates 1 teacher for each class
  - Links parent/teacher/student user profiles to the generated records
  - Seeds default subjects for each class

  Usage:
    npm run seed:demo
*/

const mongoose = require('mongoose');
const config = require('../config');

const {
  Parent,
  SchoolClass,
  Student,
  Teacher,
  User,
} = require('../models');
const { DEFAULT_SUBJECTS, ensureDefaultSubjectsForClass } = require('../controllers/subjectsController');

const FALLBACK_URI = 'mongodb+srv://hussainahmaddev17_db_user:dHbBwHhY9hdR9tvq@cluster0.ttx1amp.mongodb.net/edu';
const DEFAULT_PASSWORD = 'Demo@12345';

const MALE_NAMES = [
  'Ali',
  'Ahmad',
  'Hassan',
  'Hussain',
  'Usman',
  'Bilal',
  'Hamza',
  'Awais',
  'Saad',
  'Zain',
  'Abdullah',
  'Talha',
  'Umar',
  'Yasir',
  'Fahad',
  'Muhammad',
  'Imran',
  'Asad',
  'Danish',
  'Shahzaib',
];

const FEMALE_NAMES = [
  'Ayesha',
  'Fatima',
  'Zainab',
  'Maryam',
  'Iqra',
  'Sana',
  'Laiba',
  'Hira',
  'Maham',
  'Areeba',
  'Noor',
  'Amna',
  'Eman',
  'Komal',
  'Rabia',
];

const LAST_NAMES = [
  'Ahmad',
  'Khan',
  'Malik',
  'Butt',
  'Sheikh',
  'Rana',
  'Qureshi',
  'Farooq',
  'Hashmi',
  'Ansari',
  'Chaudhry',
  'Nawaz',
];

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePersonName(isFemale = false) {
  const firstName = isFemale
    ? randomItem(FEMALE_NAMES)
    : randomItem(MALE_NAMES);

  const lastName = randomItem(LAST_NAMES);

  return `${firstName} ${lastName}`;
}

function createEmail(name, suffix = '') {
  const slug = slugify(name);
  return `${slug}${suffix}@edu.com`;
}

function createUsername(name, suffix = '') {
  return `${slugify(name)}${suffix}`;
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickSection(classDoc) {
  const sections = Array.isArray(classDoc?.sections)
    ? classDoc.sections.map((section) => String(section || '').trim()).filter(Boolean)
    : [];

  return sections[0] || 'A';
}

function buildPhone(index, offset = 0) {
  const normalized = 1000000000 + (index * 10) + offset;
  return `03${String(normalized).slice(1)}`;
}

function buildDob(classIndex, studentIndex) {
  return new Date(2010 + Math.floor(classIndex / 2), studentIndex, 10 + studentIndex);
}

async function ensureUser({ name, username, email, password, role, profile }) {
  const normalizedEmail = String(email).toLowerCase();
  const normalizedUsername = String(username || '').trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user && normalizedUsername) {
    user = await User.findOne({ username: normalizedUsername });
  }

  if (!user) {
    user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      role,
      active: true,
      profile: profile || {},
    });
    return { user, created: true };
  }

  let changed = false;
  if (!user.name && name) {
    user.name = name;
    changed = true;
  }
  if (!user.username && normalizedUsername) {
    user.username = normalizedUsername;
    changed = true;
  }
  if (profile && typeof profile === 'object') {
    user.profile = { ...(user.profile || {}), ...profile };
    changed = true;
  }
  if (changed) {
    await user.save();
  }
  return { user, created: false };
}

async function ensureSchoolClass({ name, sections }) {
  const clsName = String(name || '').trim();
  if (!clsName) return null;

  const normalizedSections = Array.isArray(sections)
    ? sections.map((section) => String(section || '').trim()).filter(Boolean)
    : [];

  const existing = await SchoolClass.findOne({ name: clsName });
  if (existing) {
    const merged = new Map();
    for (const section of existing.sections || []) {
      const normalized = String(section || '').trim();
      if (normalized) merged.set(normalized.toLowerCase(), normalized);
    }
    for (const section of normalizedSections) {
      merged.set(section.toLowerCase(), section);
    }

    const nextSections = Array.from(merged.values());
    if (nextSections.length > 0) {
      existing.sections = nextSections;
      await existing.save();
    }
    return existing;
  }

  return SchoolClass.create({
    name: clsName,
    sections: normalizedSections.length > 0 ? normalizedSections : ['A', 'B'],
    active: true,
    tutionFee: 5000,
    admissionFee: 1500,
    registrationFee: 500,
    stationeryFee: 750,
    annualFee: 2500,
  });
}

async function ensureSeedClasses() {
  let classes = await SchoolClass.find({ active: true }).sort({ name: 1 }).lean();

  if (classes.length === 0) {
    const fallback = Array.from({ length: 10 }, (_, index) => ({
      name: String(index + 1),
      sections: ['A', 'B'],
      active: true,
      tutionFee: 5000 + (index * 250),
      admissionFee: 1500,
      registrationFee: 500,
      stationeryFee: 750,
      annualFee: 2500,
    }));

    await SchoolClass.insertMany(fallback, { ordered: false });
    classes = await SchoolClass.find({ active: true }).sort({ name: 1 }).lean();
    return classes;
  }

  const ensured = [];
  for (const classDoc of classes) {
    const saved = await ensureSchoolClass({
      name: classDoc.name,
      sections: Array.isArray(classDoc.sections) && classDoc.sections.length > 0
        ? classDoc.sections
        : ['A', 'B'],
    });
    ensured.push(saved.toObject ? saved.toObject() : saved);
  }

  return ensured;
}

async function ensureParentForClass(classDoc, classIndex, section) {
  const classSlug = slugify(classDoc.name) || `class-${classIndex + 1}`;
  const name = generatePersonName(false);

  const username = createUsername(
    name,
    `-parent-${classIndex + 1}`
  );

  const email = createEmail(
    name,
    `-parent-${classIndex + 1}`
  );
  const phone = buildPhone(classIndex, 50);

  const { user } = await ensureUser({
    name,
    username,
    email,
    password: DEFAULT_PASSWORD,
    role: 'Parent',
    profile: { class: classDoc.name, section },
  });

  let parent = await Parent.findOne({ user: user._id });
  if (!parent) {
    parent = await Parent.create({
      user: user._id,
      name,
      email,
      phone,
      relation: 'Father',
      occupation: 'Business',
      address: `${classDoc.name} Family Address`,
    });
  } else {
    parent.name = name;
    parent.email = email;
    parent.phone = phone;
    parent.relation = parent.relation || 'Father';
    parent.occupation = parent.occupation || 'Business';
    parent.address = parent.address || `${classDoc.name} Family Address`;
    await parent.save();
  }

  return { user, parent };
}

async function ensureTeacherForClass(classDoc, classIndex, section) {
  const classSlug = slugify(classDoc.name) || `class-${classIndex + 1}`;
  const teacherName = generatePersonName(false);

  const username = createUsername(
    teacherName,
    `-teacher-${classIndex + 1}`
  );

  const email = createEmail(
    teacherName,
    `-teacher-${classIndex + 1}`
  );
  const subjects = DEFAULT_SUBJECTS.slice();
  const classLabel = `${classDoc.name}-${section}`;

  const { user } = await ensureUser({
    name: teacherName,
    username,
    email,
    password: DEFAULT_PASSWORD,
    role: 'Teacher',
    profile: {
      class: classDoc.name,
      section,
    },
  });

  let teacher = await Teacher.findOne({ user: user._id });
  const teacherData = {
    user: user._id,
    employeeId: `EMP-${String(classIndex + 1).padStart(3, '0')}`,
    designation: 'Class Teacher',
    department: 'Academics',
    subjects,
    classesAssigned: [classLabel],
    qualification: 'M.A. / B.Ed.',
    certifications: ['Classroom Management', 'Child Psychology'],
    joiningDate: new Date(2020 + (classIndex % 4), classIndex % 12, 1 + classIndex),
    experienceYears: 3 + (classIndex % 8),
    salary: 55000 + (classIndex * 1500),
    contactNumber: buildPhone(classIndex, 1),
    address: `${classDoc.name} Staff Quarter`,
    emergencyContact: {
      name: `${teacherName} Emergency`,
      phone: buildPhone(classIndex, 2),
    },
    status: 'Working',
    notes: `Seeded teacher for ${classDoc.name}`,
  };

  if (!teacher) {
    teacher = await Teacher.create(teacherData);
    return { user, teacher, created: true };
  }

  Object.assign(teacher, teacherData);
  await teacher.save();
  return { user, teacher, created: false };
}

async function ensureStudentForClass(classDoc, classIndex, studentIndex, section, parentUser) {
  const classSlug = slugify(classDoc.name) || `class-${classIndex + 1}`;
  const slot = studentIndex + 1;
  const isFemale = Math.random() > 0.5;

  const studentName = generatePersonName(isFemale);

  const username = createUsername(
    studentName,
    `-student-${classIndex + 1}-${slot}`
  );

  const email = createEmail(
    studentName,
    `-student-${classIndex + 1}-${slot}`
  );
  const studentId = `STD-${String(classIndex + 1).padStart(2, '0')}-${String(slot).padStart(2, '0')}`;
  const registrationNumber = `REG-${String(classIndex + 1).padStart(2, '0')}-${String(slot).padStart(2, '0')}`;

  const { user } = await ensureUser({
    name: studentName,
    username,
    email,
    password: DEFAULT_PASSWORD,
    role: 'Student',
    profile: {
      class: classDoc.name,
      section,
      parentRef: parentUser._id,
    },
  });

  let student = await Student.findOne({ studentId });
  const studentData = {
    user: user._id,
    studentId,
    registrationNumber,
    rollNumber: `${String(classIndex + 1).padStart(2, '0')}-${section}-${slot}`,
    class: String(classDoc.name),
    section,
    dob: buildDob(classIndex, studentIndex),
    parents: [parentUser._id],
    contact: buildPhone(classIndex, slot + 10),
    address: `${classDoc.name} Student Residence ${slot}`,
    enrollDate: new Date(2024, classIndex % 12, slot + 1),
    profilePicture: '',
    documents: [],
    tutionFeeConcession: 0,
    lastFeePaid: false,
    lastFeePaidAmount: 0,
    availTransport: false,
    balance: 0,
    bloodGroup: slot % 2 === 0 ? 'A+' : 'B+',
    gender: isFemale ? 'Female' : 'Male',
    healthConditions: 'None',
    status: 'incampus',
    notes: `Seeded student for ${classDoc.name}`,
  };

  if (!student) {
    student = await Student.create(studentData);
    return { user, student, created: true };
  }

  Object.assign(student, studentData);
  await student.save();
  return { user, student, created: false };
}

async function seedDemo() {
  const uri = config.mongoUri || FALLBACK_URI;
  if (!uri) {
    console.error('No MONGO_URI provided. Set MONGO_URI in environment or edit this script.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB for demo seeding');

  const classes = await ensureSeedClasses();
  const summary = [];

  for (let classIndex = 0; classIndex < classes.length; classIndex += 1) {
    const classDoc = classes[classIndex];
    const section = pickSection(classDoc);

    await ensureDefaultSubjectsForClass(classDoc.name);

    const { user: parentUser } = await ensureParentForClass(classDoc, classIndex, section);
    const { teacher } = await ensureTeacherForClass(classDoc, classIndex, section);

    const seededStudents = [];
    for (let studentIndex = 0; studentIndex < 2; studentIndex += 1) {
      const { student } = await ensureStudentForClass(
        classDoc,
        classIndex,
        studentIndex,
        section,
        parentUser,
      );
      seededStudents.push({
        studentId: student.studentId,
        registrationNumber: student.registrationNumber,
        class: student.class,
        section: student.section,
      });
    }

    summary.push({
      class: classDoc.name,
      section,
      teacher: teacher.employeeId,
      students: seededStudents.map((student) => student.studentId).join(', '),
    });
  }

  console.log(`Seeded ${classes.length} classes with 1 teacher and 2 students each.`);
  console.table(summary);
  await mongoose.disconnect();
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error('Demo seeding failed', err);
  process.exit(1);
});