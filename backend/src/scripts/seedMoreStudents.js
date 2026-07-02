/*
  Additive student seeder.
  - Keeps every existing student row untouched (idempotent, never overwrites).
  - For each active class, adds 8 new students so the class ends up with
      5 in section A (existing 2 + 3 new) and 5 in section B (5 new) = 10 total.
  - Mixed parent strategy: a blend of single-child parents and shared-sibling parents.
      Per class (slots refer to new studentId slot inside STD-CC-NN):
        slot 03 (A)   -> fresh parent (single child)
        slots 04+05 (A) -> shared parent (siblings)
        slot 06 (B)   -> fresh parent (single child)
        slots 07+08 (B) -> shared parent (siblings)
        slots 09+10 (B) -> shared parent (siblings)
      => 5 new parents per class, 8 new students per class.
  - Adds section "B" to schoolclasses.sections if the class doesn't already list it.
  - Safe to re-run: any studentId already present is skipped.

  Usage:
    node backend/src/scripts/seedMoreStudents.js
    # or via npm if you wire it up:  "seed:more-students": "node backend/src/scripts/seedMoreStudents.js"
*/

const mongoose = require('mongoose');
const config = require('../config');

const { Parent, SchoolClass, Student, User } = require('../models');

const FALLBACK_URI = 'mongodb+srv://hussainahmaddev17_db_user:dHbBwHhY9hdR9tvq@cluster0.ttx1amp.mongodb.net/edu';
const DEFAULT_PASSWORD = 'Demo@12345';

// ---------- name pools ----------
const MALE_NAMES = [
  'Ali','Ahmad','Hassan','Hussain','Usman','Bilal','Hamza','Awais','Saad','Zain',
  'Abdullah','Talha','Umar','Yasir','Fahad','Muhammad','Imran','Asad','Danish','Shahzaib',
  'Rehan','Salman','Junaid','Faraz','Kashif','Adeel','Mustafa','Naveed','Owais','Sufyan',
];
const FEMALE_NAMES = [
  'Ayesha','Fatima','Hira','Iqra','Maryam','Noor','Sana','Zainab','Sara','Amna',
  'Areeba','Hina','Laiba','Rabia','Sadia','Sumaira','Tania','Yusra','Zoya','Mahnoor',
  'Aiman','Bushra','Eman','Hafsa','Javeria','Komal','Mehak','Nadia','Saima','Warda',
];
const LAST_NAMES = [
  'Ahmad','Khan','Malik','Butt','Cheema','Qureshi','Rana','Sheikh','Mughal','Chaudhry',
  'Bhatti','Mirza','Awan','Tariq','Hashmi','Siddiqui','Farooq','Ansari','Sial','Khokhar',
];

// ---------- helpers ----------
let nameCursor = 0;
function pick(arr) { return arr[(nameCursor++ + arr.length) % arr.length]; }

function generatePersonName(isFemale) {
  const first = pick(isFemale ? FEMALE_NAMES : MALE_NAMES);
  const last = pick(LAST_NAMES);
  return `${first} ${last}`;
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createUsername(name, suffix) {
  return slugify(name) + suffix;
}
function createEmail(name, suffix) {
  return slugify(name) + suffix + '@edu.com';
}

function buildPhone(classIndex, offset = 0) {
  const normalized = 1000000000 + (classIndex * 100) + offset;
  return `03${String(normalized).slice(1)}`;
}

function buildDob(classIndex, slot) {
  return new Date(2010 + Math.floor(classIndex / 2), slot % 12, ((slot * 3) % 27) + 1);
}

async function ensureUser({ name, username, email, password, role, profile }) {
  const normalizedEmail = String(email).toLowerCase();
  const normalizedUsername = String(username || '').trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  if (!user && normalizedUsername) user = await User.findOne({ username: normalizedUsername });
  if (user) return { user, created: false };
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

async function ensureSectionOnClass(classDoc, section) {
  if (!classDoc) return;
  const existing = Array.isArray(classDoc.sections) ? classDoc.sections.map((s) => String(s).toUpperCase()) : [];
  if (existing.includes(String(section).toUpperCase())) return;
  await SchoolClass.updateOne(
    { _id: classDoc._id },
    { $addToSet: { sections: section } }
  );
}

async function createParent({ classDoc, classIndex, parentTag }) {
  // Stable identity so re-runs hit existing rows instead of creating fresh ones.
  const ccPad = String(classIndex + 1).padStart(2, '0');
  const tagPad = String(parentTag).padStart(2, '0');
  const username = `parent-${ccPad}-${tagPad}`;
  const email = `parent-${ccPad}-${tagPad}@edu.com`;

  // Quick path: if the user already exists, also ensure the parent profile and return.
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const existingParent = await Parent.findOne({ user: existingUser._id });
    if (existingParent) return { parentUser: existingUser, parent: existingParent, created: false };
  }

  const isFemale = Math.random() > 0.5;
  const personName = generatePersonName(isFemale);
  const phone = buildPhone(classIndex, 50 + parentTag);

  const { user, created: userCreated } = await ensureUser({
    name: personName,
    username,
    email,
    password: DEFAULT_PASSWORD,
    role: 'Parent',
    profile: { class: classDoc.name },
  });

  let parent = await Parent.findOne({ user: user._id });
  if (!parent) {
    parent = await Parent.create({
      user: user._id,
      name: personName,
      email,
      phone,
      cnic: `35202-${String(classIndex + 1).padStart(7, '0')}-${parentTag}`,
      occupation: 'Business',
      relation: isFemale ? 'Mother' : 'Father',
      address: `${classDoc.name} Parent Residence ${parentTag}`,
    });
  }
  return { parentUser: user, parent, created: userCreated };
}

async function createStudentIfMissing({ classDoc, classIndex, slot, section, sectionSlot, parentUser }) {
  const studentId = `STD-${String(classIndex + 1).padStart(2, '0')}-${String(slot).padStart(2, '0')}`;
  const existing = await Student.findOne({ studentId }).lean();
  if (existing) return { skipped: true, studentId };

  const isFemale = Math.random() > 0.5;
  const personName = generatePersonName(isFemale);
  const username = createUsername(personName, `-student-${classIndex + 1}-${slot}`);
  const email = createEmail(personName, `-student-${classIndex + 1}-${slot}`);
  const registrationNumber = `REG-${String(classIndex + 1).padStart(2, '0')}-${String(slot).padStart(2, '0')}`;
  const rollNumber = `${String(classIndex + 1).padStart(2, '0')}-${section}-${sectionSlot}`;

  const { user } = await ensureUser({
    name: personName,
    username,
    email,
    password: DEFAULT_PASSWORD,
    role: 'Student',
    profile: { class: classDoc.name, section, parentRef: parentUser._id },
  });

  const student = await Student.create({
    user: user._id,
    studentId,
    registrationNumber,
    rollNumber,
    class: String(classDoc.name),
    section,
    dob: buildDob(classIndex, slot),
    parents: [parentUser._id],
    contact: buildPhone(classIndex, slot + 10),
    address: `${classDoc.name} Student Residence ${slot}`,
    enrollDate: new Date(2024, classIndex % 12, slot),
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
    notes: `Additive seed (${section} batch slot ${slot}) for class ${classDoc.name}`,
  });

  return { skipped: false, studentId, studentName: personName, section, _id: student._id };
}

// Parent group plan per class. Returns array of { slot, section, sectionSlot, groupTag }.
// Same groupTag => students share a parent.
function plannedSlots() {
  return [
    { slot: 3,  section: 'A', sectionSlot: 3, groupTag: 'a3' },     // single
    { slot: 4,  section: 'A', sectionSlot: 4, groupTag: 'a45' },    // sibling pair (1)
    { slot: 5,  section: 'A', sectionSlot: 5, groupTag: 'a45' },    // sibling pair (2)
    { slot: 6,  section: 'B', sectionSlot: 1, groupTag: 'b6' },     // single
    { slot: 7,  section: 'B', sectionSlot: 2, groupTag: 'b78' },    // sibling pair (1)
    { slot: 8,  section: 'B', sectionSlot: 3, groupTag: 'b78' },    // sibling pair (2)
    { slot: 9,  section: 'B', sectionSlot: 4, groupTag: 'b910' },   // sibling pair (1)
    { slot: 10, section: 'B', sectionSlot: 5, groupTag: 'b910' },   // sibling pair (2)
  ];
}

async function seed() {
  const uri = config.mongoUri || FALLBACK_URI;
  if (!uri) {
    console.error('No MONGO_URI provided. Set MONGO_URI or edit FALLBACK_URI.');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('[seedMoreStudents] connected');

  const classes = await SchoolClass.find({ active: true }).sort({ name: 1 });
  if (!classes.length) {
    console.error('No active classes found. Run the original seed first.');
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`[seedMoreStudents] found ${classes.length} active classes`);

  const summary = { classes: 0, studentsCreated: 0, studentsSkipped: 0, parentsCreated: 0, errors: [] };

  for (let classIndex = 0; classIndex < classes.length; classIndex++) {
    const classDoc = classes[classIndex];
    summary.classes++;
    console.log(`\n--- Class ${classDoc.name} (index ${classIndex}) ---`);

    try { await ensureSectionOnClass(classDoc, 'B'); } catch (e) { summary.errors.push(`class ${classDoc.name} section B: ${e.message}`); }

    const slots = plannedSlots();
    const groupParents = new Map(); // groupTag -> parentUser
    let parentTagCounter = 0;

    for (const s of slots) {
      try {
        if (!groupParents.has(s.groupTag)) {
          parentTagCounter++;
          const { parentUser, created: parentWasCreated } = await createParent({
            classDoc,
            classIndex,
            parentTag: parentTagCounter,
          });
          groupParents.set(s.groupTag, parentUser);
          if (parentWasCreated) summary.parentsCreated++; else summary.parentsSkipped = (summary.parentsSkipped || 0) + 1;
        }
        const parentUser = groupParents.get(s.groupTag);
        const res = await createStudentIfMissing({
          classDoc, classIndex,
          slot: s.slot,
          section: s.section,
          sectionSlot: s.sectionSlot,
          parentUser,
        });
        if (res.skipped) {
          summary.studentsSkipped++;
          console.log(`  - ${res.studentId}: already exists, skipped`);
        } else {
          summary.studentsCreated++;
          console.log(`  + ${res.studentId}: ${res.studentName} (section ${res.section})`);
        }
      } catch (e) {
        summary.errors.push(`class ${classDoc.name} slot ${s.slot}: ${e.message}`);
        console.error(`  ! slot ${s.slot} failed: ${e.message}`);
      }
    }
  }

  console.log('\n===== Summary =====');
  console.log(summary);

  await mongoose.disconnect();
  console.log('[seedMoreStudents] disconnected');
}

seed().catch((err) => {
  console.error('[seedMoreStudents] fatal:', err);
  process.exit(1);
});
