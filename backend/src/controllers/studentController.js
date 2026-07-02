const {
  Attendance,
  ExamMark,
  FCMToken,
  Fee,
  Homework,
  HomeworkFile,
  Notification,
  NotificationRead,
  Parent,
  RefreshToken,
  ReportCard,
  SchoolClass,
  Student,
  StudentCertificate,
  Transport,
  User
} = require('../models');
const { sendWelcomeCredentialsEmail } = require('../services/mailService');
const { uploadBufferToCloudinary } = require('../services/cloudinaryService');
const { createWelcomeNotificationSafe } = require('../services/notificationService');

function parseJSONField(value, fallback = {}) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseBoolean(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const raw = String(value).trim().toLowerCase();
  if (raw === 'true' || raw === '1' || raw === 'yes') return true;
  if (raw === 'false' || raw === '0' || raw === 'no') return false;
  return undefined;
}

function splitName(fullName) {
  const raw = String(fullName || '').trim();
  if (!raw) return { firstName: '', lastName: '' };
  const [firstName, ...rest] = raw.split(/\s+/);
  return { firstName, lastName: rest.join(' ') };
}

function sanitizeUsername(value, fallback = 'user') {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '');
  return cleaned || fallback;
}

async function buildUniqueUsername(preferred, currentUserId = null) {
  const base = sanitizeUsername(preferred);
  let candidate = base;
  let index = 1;

  while (index < 2000) {
    const owner = await User.findOne({ username: candidate }).select('_id').lean();
    if (!owner || (currentUserId && String(owner._id) === String(currentUserId))) {
      return candidate;
    }
    candidate = `${base}${index}`;
    index += 1;
  }

  const err = new Error('Unable to allocate unique username');
  err.status = 500;
  throw err;
}

function generatePassword(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return password;
}

async function nextStudentId() {
  const latest = await Student.findOne({ studentId: /^ST-\d+$/ })
    .sort({ createdAt: -1 })
    .select('studentId')
    .lean();

  const latestNumber = latest?.studentId ? Number(String(latest.studentId).replace(/^ST-/, '')) : 0;
  const next = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;
  return `ST-${String(next).padStart(5, '0')}`;
}

async function uploadStudentAssets(files) {
  const profilePictureFile = files?.profilePicture?.[0] || null;
  const documentFiles = Array.isArray(files?.documents) ? files.documents : [];

  let profilePicture = null;
  if (profilePictureFile?.buffer) {
    const uploaded = await uploadBufferToCloudinary({
      buffer: profilePictureFile.buffer,
      folder: 'edunexus/students/profile',
      resourceType: 'image',
      originalFilename: profilePictureFile.originalname
    });
    profilePicture = uploaded.secureUrl;
  }

  const documents = await Promise.all(
    documentFiles.map(async (file) => {
      const uploaded = await uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: 'edunexus/students/documents',
        resourceType: 'auto',
        originalFilename: file.originalname
      });
      return uploaded.secureUrl;
    })
  );

  return { profilePicture, documents: documents.filter(Boolean) };
}

async function resolveClassData(studentInput = {}) {
  const classValue = String(studentInput.class || '').trim();
  if (!classValue) {
    const err = new Error('Class is required');
    err.status = 400;
    throw err;
  }

  let schoolClass = null;
  if (/^[a-f\d]{24}$/i.test(classValue)) {
    schoolClass = await SchoolClass.findById(classValue).lean();
  }

  if (!schoolClass) {
    schoolClass = await SchoolClass.findOne({ name: classValue }).lean();
  }

  if (!schoolClass) {
    const err = new Error('Selected class not found');
    err.status = 404;
    throw err;
  }

  const section = String(studentInput.section || '').trim();
  if (section && Array.isArray(schoolClass.sections) && schoolClass.sections.length > 0) {
    const valid = schoolClass.sections.some((s) => String(s).toLowerCase() === section.toLowerCase());
    if (!valid) {
      const err = new Error('Selected section does not belong to selected class');
      err.status = 400;
      throw err;
    }
  }

  return {
    schoolClass,
    className: schoolClass.name,
    section,
    classTuitionFee: Number(schoolClass.tutionFee || 0)
  };
}

async function ensureStudentUser(userInput = {}) {
  const name = String(userInput.name || '').trim();
  const explicitUsername = String(userInput.username || '').trim().toLowerCase();
  const hasExplicitUsername = Boolean(explicitUsername);
  const email = String(userInput.email || '').trim().toLowerCase();
  let username = explicitUsername || sanitizeUsername(email.split('@')[0] || name || 'student');
  if (!name || !email) {
    const err = new Error('Student user name and email are required');
    err.status = 400;
    throw err;
  }

  let user = await User.findOne({ username });
  if (!user && !hasExplicitUsername) {
    const usernameOwner = await User.findOne({ username }).select('_id').lean();
    if (usernameOwner) {
      username = await buildUniqueUsername(username);
    }
    user = await User.findOne({ username });
  }

  let temporaryPassword = null;

  if (!user) {
    temporaryPassword = generatePassword();
    user = await User.create({
      name,
      username,
      email,
      password: temporaryPassword,
      role: 'Student',
      active: true,
      profile: {}
    });
    await createWelcomeNotificationSafe({
      userId: user._id,
      recipientName: name,
      role: user.role,
      createdBy: null
    });
  } else if (user.role !== 'Student') {
    const err = new Error('Student username already exists under another role');
    err.status = 409;
    throw err;
  } else {
    const currentUsername = String(user.username || '').trim().toLowerCase();
    if (hasExplicitUsername && currentUsername && currentUsername !== username) {
      const err = new Error('Student username already exists');
      err.status = 409;
      throw err;
    }
    if (!currentUsername) {
      if (!hasExplicitUsername) {
        username = await buildUniqueUsername(username, user._id);
      }
      user.username = username;
    }
    if (email && String(user.email || '').trim().toLowerCase() !== email) {
      user.email = email;
    }
    if (name && String(user.name || '').trim() !== name) {
      user.name = name;
    }
    if (user.isModified()) {
      await user.save();
    }
    username = String(user.username || username).trim().toLowerCase();
  }

  if (temporaryPassword) {
    try {
      await sendWelcomeCredentialsEmail({
        to: email,
        recipientName: name,
        roleLabel: 'Student',
        username,
        temporaryPassword
      });
    } catch {
      // Keep admission successful even if email service is unavailable.
    }
  }

  return { user, temporaryPassword };
}

async function ensureParentProfile(parentInput = {}) {
  if (!parentInput || typeof parentInput !== 'object') return null;

  const mode = String(parentInput.mode || 'new').toLowerCase();

  if (mode === 'existing') {
    const parentProfileId = String(parentInput.parentProfileId || parentInput.parentId || '').trim();
    if (!parentProfileId) {
      const err = new Error('Parent selection is required');
      err.status = 400;
      throw err;
    }

    let profile = await Parent.findById(parentProfileId).populate('user', 'name username email role').lean();
    if (!profile && /^[a-f\d]{24}$/i.test(parentProfileId)) {
      profile = await Parent.findOne({ user: parentProfileId }).populate('user', 'name username email role').lean();
    }
    if (!profile) {
      const err = new Error('Selected parent not found');
      err.status = 404;
      throw err;
    }

    if (!String(profile.phone || '').trim()) {
      const err = new Error('Selected parent must have a phone number');
      err.status = 400;
      throw err;
    }

    return profile;
  }

  const name = String(parentInput.name || '').trim();
  const username = String(parentInput.username || '').trim().toLowerCase();
  const email = String(parentInput.email || '').trim().toLowerCase();
  const phone = String(parentInput.phone || '').trim();
  if (!name || !username || !email || !phone) {
    const err = new Error('Parent name, username, email, and phone are required');
    err.status = 400;
    throw err;
  }

  let user = await User.findOne({ username });

  let temporaryPassword = null;
  if (!user) {
    temporaryPassword = generatePassword();
    user = await User.create({
      name,
      username,
      email,
      password: temporaryPassword,
      role: 'Parent',
      active: true,
      profile: {}
    });
    await createWelcomeNotificationSafe({
      userId: user._id,
      recipientName: name,
      role: user.role,
      createdBy: null
    });
  } else if (user.role !== 'Parent') {
    const err = new Error('Parent username already exists under another role');
    err.status = 409;
    throw err;
  } else {
    const currentUsername = String(user.username || '').trim().toLowerCase();
    if (currentUsername && currentUsername !== username) {
      const err = new Error('Parent username already exists');
      err.status = 409;
      throw err;
    }
    if (!currentUsername) {
      user.username = username;
    }
    if (email && String(user.email || '').trim().toLowerCase() !== email) {
      user.email = email;
    }
    if (name && String(user.name || '').trim() !== name) {
      user.name = name;
    }
    if (user.isModified()) {
      await user.save();
    }
  }

  const profilePayload = {
    user: user._id,
    name,
    email,
    phone,
    cnic: String(parentInput.cnic || '').trim() || undefined,
    dob: asDate(parentInput.dob),
    occupation: String(parentInput.occupation || '').trim() || undefined,
    salary: parentInput.salary !== undefined && parentInput.salary !== '' ? Number(parentInput.salary) : undefined,
    relation: String(parentInput.relation || '').trim() || undefined,
    address: String(parentInput.address || '').trim() || undefined
  };

  let profile = await Parent.findOne({ user: user._id });
  if (!profile) {
    profile = await Parent.create(profilePayload);
  } else {
    Object.assign(profile, profilePayload);
    await profile.save();
  }

  if (temporaryPassword) {
    try {
      await sendWelcomeCredentialsEmail({
        to: email,
        recipientName: name,
        roleLabel: 'Parent',
        username,
        temporaryPassword
      });
    } catch {
      // Keep admission successful even if email service is unavailable.
    }
  }

  const populated = await Parent.findById(profile._id).populate('user', 'name username email role').lean();
  return populated;
}

function toStudentListItem(doc) {
  const fullName = String(doc?.user?.name || '').trim();
  const { firstName, lastName } = splitName(fullName);
  return {
    _id: doc._id,
    studentId: doc.studentId,
    registrationNumber: doc.registrationNumber,
    rollNumber: doc.rollNumber,
    firstName,
    lastName,
    name: fullName,
    class: doc.class,
    section: doc.section,
    status: doc.status,
    contact: doc.contact,
    user: doc.user,
    parents: Array.isArray(doc.parents)
      ? doc.parents.map((parent) => ({
          _id: parent?._id,
          name: parent?.name,
          username: parent?.username,
          email: parent?.email,
          active: parent?.active,
          profile: parent?.profile
        }))
      : [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
}

async function getStudentsSummary(req, res, next) {
  try {
    const [total, incampus, alumni, activeRows] = await Promise.all([
      Student.countDocuments({}),
      Student.countDocuments({ status: 'incampus' }),
      Student.countDocuments({ status: 'alumni' }),
      Student.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDoc'
          }
        },
        { $unwind: '$userDoc' },
        { $match: { 'userDoc.active': true } },
        { $count: 'count' }
      ])
    ]);

    res.json({
      summary: {
        total,
        incampus,
        active: activeRows[0]?.count || 0,
        alumni
      }
    });
  } catch (err) {
    next(err);
  }
}

async function searchParents(req, res, next) {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);

    const filter = {};
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { phone: regex },
        { cnic: regex }
      ];
    }

    const rows = await Parent.find(filter)
      .populate('user', 'name username email role active')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const qLower = q.toLowerCase();
    const enriched = rows.filter((row) => {
      if (!qLower) return true;
      const username = String(row?.user?.username || '').toLowerCase();
      return username.includes(qLower)
        || String(row?.name || '').toLowerCase().includes(qLower)
        || String(row?.email || '').toLowerCase().includes(qLower)
        || String(row?.phone || '').toLowerCase().includes(qLower)
        || String(row?.cnic || '').toLowerCase().includes(qLower);
    });

    res.json({ parents: enriched });
  } catch (err) {
    next(err);
  }
}

async function listStudents(req, res, next) {
  try {
    const { classId, section, status, active, q, limit, page, sortBy, sortOrder, recentHours, studentId, registrationNumber, admissionNumber, fatherName, mobile } = req.query;
    const filter = {};

    if (classId) filter.class = String(classId).trim();
    if (section) filter.section = String(section).trim();
    if (status) filter.status = String(status).trim();

    if (recentHours !== undefined && recentHours !== '') {
      const hours = Number(recentHours);
      if (Number.isFinite(hours) && hours > 0) {
        filter.updatedAt = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
      }
    }

    const qLower = String(q || '').trim().toLowerCase();
    const activeFilter = parseBoolean(active);

    const max = Math.min(parseInt(limit || '200', 10) || 200, 500);
    const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
    const students = await Student.find(filter)
      .populate('user', 'name username email role active')
      .populate('parents', 'name username email profile active')
      .lean();

    let enriched = students.map(toStudentListItem);
    if (activeFilter !== undefined) {
      enriched = enriched.filter((s) => Boolean(s?.user?.active) === activeFilter);
    }

    if (qLower) {
      enriched = enriched.filter((s) =>
        [
          s.studentId,
          s.registrationNumber,
          s.rollNumber,
          s.name,
          s.contact,
          s.class,
          s.section,
          s.status,
          s?.user?.username,
          s?.user?.email
        ].some((v) => String(v || '').toLowerCase().includes(qLower))
      );
    }

    const explicitStudentId = String(studentId || '').trim().toLowerCase();
    const explicitRegistration = String(registrationNumber || admissionNumber || '').trim().toLowerCase();
    const explicitFatherName = String(fatherName || '').trim().toLowerCase();
    const explicitMobile = String(mobile || '').trim().toLowerCase();

    if (explicitStudentId) {
      enriched = enriched.filter((s) => String(s.studentId || '').toLowerCase().includes(explicitStudentId));
    }
    if (explicitRegistration) {
      enriched = enriched.filter((s) => String(s.registrationNumber || '').toLowerCase().includes(explicitRegistration));
    }
    if (explicitFatherName) {
      enriched = enriched.filter((s) => {
        const parents = Array.isArray(s.parents) ? s.parents : [];
        return parents.some((parent) => String(parent?.name || '').toLowerCase().includes(explicitFatherName));
      });
    }
    if (explicitMobile) {
      enriched = enriched.filter((s) => {
        const studentContact = String(s.contact || '').toLowerCase();
        const parentContacts = (Array.isArray(s.parents) ? s.parents : []).map((parent) => String(parent?.profile?.phone || '').toLowerCase());
        return studentContact.includes(explicitMobile) || parentContacts.some((phone) => phone.includes(explicitMobile));
      });
    }

    const sortField = String(sortBy || 'updatedAt');
    const direction = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;
    enriched.sort((a, b) => {
      const av = a?.[sortField] ?? a?.user?.[sortField] ?? '';
      const bv = b?.[sortField] ?? b?.user?.[sortField] ?? '';
      if (av instanceof Date || bv instanceof Date) {
        const at = new Date(av || 0).getTime();
        const bt = new Date(bv || 0).getTime();
        return direction * (at - bt);
      }
      return direction * String(av).localeCompare(String(bv));
    });

    const total = enriched.length;
    const totalPages = Math.max(Math.ceil(total / max), 1);
    const safePage = Math.min(pageNumber, totalPages);
    const start = (safePage - 1) * max;
    const end = start + max;
    const rows = enriched.slice(start, end);

    res.json({
      students: rows,
      pagination: {
        page: safePage,
        limit: max,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function createStudent(req, res, next) {
  try {
    const body = req.body || {};
    const userInput = {
      name: body.name || `${body.firstName || ''} ${body.lastName || ''}`.trim(),
      username: body.username,
      email: body.email
    };

    const { user } = await ensureStudentUser(userInput);
    const { className, section } = await resolveClassData(body);

    const registrationNumber = String(body.registrationNumber || '').trim();
    const contact = String(body.contact || '').trim();
    if (!registrationNumber || !contact) {
      return res.status(400).json({ error: 'registrationNumber and contact are required' });
    }

    const student = await Student.create({
      user: user._id,
      studentId: await nextStudentId(),
      registrationNumber,
      rollNumber: String(body.rollNumber || '').trim() || undefined,
      class: className,
      section,
      dob: asDate(body.dob),
      contact,
      address: String(body.address || '').trim() || undefined,
      enrollDate: asDate(body.enrollDate) || new Date(),
      status: body.status || 'incampus'
    });

    res.status(201).json({ student });
  } catch (err) {
    next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const updates = { ...(req.body || {}) };
    const nextUserName = Object.prototype.hasOwnProperty.call(updates, 'userName')
      ? String(updates.userName || '').trim()
      : undefined;
    const nextUserEmail = Object.prototype.hasOwnProperty.call(updates, 'userEmail')
      ? String(updates.userEmail || '').trim().toLowerCase()
      : undefined;
    const hasUserActive = Object.prototype.hasOwnProperty.call(updates, 'userActive');
    const nextUserActive = hasUserActive ? Boolean(updates.userActive) : undefined;

    delete updates.userName;
    delete updates.userEmail;
    delete updates.userActive;

    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    if (updates.class) {
      const { className, section } = await resolveClassData({ class: updates.class, section: updates.section });
      updates.class = className;
      updates.section = section;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'dob')) updates.dob = asDate(updates.dob);
    if (Object.prototype.hasOwnProperty.call(updates, 'enrollDate')) updates.enrollDate = asDate(updates.enrollDate);

    if (Object.prototype.hasOwnProperty.call(updates, 'registrationNumber') && !String(updates.registrationNumber || '').trim()) {
      return res.status(400).json({ error: 'registrationNumber cannot be empty' });
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'contact') && !String(updates.contact || '').trim()) {
      return res.status(400).json({ error: 'contact cannot be empty' });
    }

    Object.assign(student, updates);
    await student.save();

    const userUpdates = {};
    if (nextUserName !== undefined) {
      if (!nextUserName) return res.status(400).json({ error: 'userName cannot be empty' });
      userUpdates.name = nextUserName;
    }

    if (nextUserEmail !== undefined) {
      if (!nextUserEmail) return res.status(400).json({ error: 'userEmail cannot be empty' });
      userUpdates.email = nextUserEmail;
    }

    const normalizedStatus = String(student.status || '').toLowerCase();
    if (hasUserActive) {
      userUpdates.active = nextUserActive;
    } else if (normalizedStatus === 'alumni') {
      userUpdates.active = false;
    } else if (normalizedStatus === 'incampus') {
      userUpdates.active = true;
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(student.user, userUpdates, { new: true, runValidators: true });
    }

    const freshStudent = await Student.findById(student._id)
      .populate('user', 'name username email role active')
      .populate('parents', 'name username email role active');

    res.json({ student: freshStudent });
  } catch (err) {
    next(err);
  }
}

async function deleteStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.studentId).select('_id user').lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const studentId = student._id;
    const studentUserId = student.user;

    await Promise.all([
      Attendance.deleteMany({ student: studentId }),
      ExamMark.deleteMany({ student: studentId }),
      Fee.deleteMany({ student: studentId }),
      Homework.deleteMany({ student: studentId }),
      HomeworkFile.deleteMany({ student: studentId }),
      ReportCard.deleteMany({ student: studentId }),
      StudentCertificate.deleteMany({ student: studentId }),
      Transport.deleteMany({ student: studentId }),
      Notification.updateMany({ targetStudents: studentId }, { $pull: { targetStudents: studentId } }),
      Notification.updateMany({ targetUsers: studentUserId }, { $pull: { targetUsers: studentUserId } }),
      NotificationRead.deleteMany({ user: studentUserId }),
      RefreshToken.deleteMany({ user: studentUserId }),
      FCMToken.deleteMany({ user: studentUserId })
    ]);

    await Student.deleteOne({ _id: studentId });

    await User.deleteOne({ _id: studentUserId, role: 'Student' });

    res.json({
      ok: true,
      deletedStudentId: String(studentId)
    });
  } catch (err) {
    next(err);
  }
}

async function admitStudent(req, res, next) {
  try {
    const body = req.body || {};

    const userInput = parseJSONField(body.user, body.user || {});
    const studentInput = parseJSONField(body.student, body.student || {});
    const parentInput = parseJSONField(body.parent, body.parent || {});
    const feeInput = parseJSONField(body.fee, body.fee || {});
    const transportInput = parseJSONField(body.transport, body.transport || {});
    const legacyLoginInput = parseJSONField(body.createStudentLogin, body.createStudentLogin || {});

    const mergedUserInput = {
      ...userInput,
      name: userInput?.name || `${studentInput?.firstName || ''} ${studentInput?.lastName || ''}`.trim(),
      username: userInput?.username || legacyLoginInput?.username,
      email: userInput?.email || legacyLoginInput?.email
    };

    const registrationNumber = String(studentInput.registrationNumber || '').trim();
    const contact = String(studentInput.contact || '').trim();
    if (!registrationNumber || !contact) {
      return res.status(400).json({ error: 'registrationNumber and student contact phone are required' });
    }

    const existingRegistration = await Student.findOne({ registrationNumber }).select('_id').lean();
    if (existingRegistration) {
      return res.status(409).json({ error: 'registrationNumber already exists' });
    }

    const { user: studentUser, temporaryPassword } = await ensureStudentUser(mergedUserInput);
    const parentProfile = await ensureParentProfile(parentInput);
    const { className, section, classTuitionFee } = await resolveClassData(studentInput);
    const assets = await uploadStudentAssets(req.files || {});

    let studentId = await nextStudentId();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const exists = await Student.findOne({ studentId }).select('_id').lean();
      if (!exists) break;
      studentId = await nextStudentId();
    }

    const student = await Student.create({
      user: studentUser._id,
      studentId,
      registrationNumber,
      rollNumber: String(studentInput.rollNumber || '').trim() || undefined,
      class: className,
      section,
      dob: asDate(studentInput.dob),
      parents: parentProfile?.user?._id ? [parentProfile.user._id] : [],
      contact,
      address: String(studentInput.address || '').trim() || undefined,
      enrollDate: asDate(studentInput.enrollDate) || new Date(),
      status: studentInput.status || 'incampus',
      profilePicture: assets.profilePicture || undefined,
      documents: assets.documents || [],
      tutionFeeConcession: feeInput.tutionFeeConcession !== undefined && feeInput.tutionFeeConcession !== '' ? Number(feeInput.tutionFeeConcession) : undefined,
      lastFeePaid: Boolean(feeInput.lastFeePaid),
      lastFeePaidAmount: feeInput.lastFeePaidAmount !== undefined && feeInput.lastFeePaidAmount !== '' ? Number(feeInput.lastFeePaidAmount) : 0,
      lastFeePaidOn: asDate(feeInput.lastFeePaidOn) || undefined,
      balance: feeInput.balance !== undefined && feeInput.balance !== '' ? Number(feeInput.balance) : 0,
      availTransport: Boolean(transportInput.availTransport),
      transportFeeConcession: feeInput.transportFeeConcession !== undefined && feeInput.transportFeeConcession !== '' ? Number(feeInput.transportFeeConcession) : undefined,
      bloodGroup: String(studentInput.bloodGroup || '').trim() || undefined,
      gender: String(studentInput.gender || '').trim() || undefined,
      healthConditions: String(studentInput.healthConditions || '').trim() || undefined,
      notes: String(studentInput.notes || '').trim() || undefined
    });

    const rawInitialAmount = feeInput.initialFeeAmount !== undefined && feeInput.initialFeeAmount !== ''
      ? Number(feeInput.initialFeeAmount)
      : Number(classTuitionFee || 0);
    const initialAmount = Number.isFinite(rawInitialAmount) ? Math.max(rawInitialAmount, 0) : 0;
    const dueDate = asDate(feeInput.initialFeeDueDate);
    const feeNotes = String(feeInput.initialFeeNotes || '').trim();

    await Fee.create({
      student: student._id,
      source: 'admission',
      baseAmount: initialAmount,
      concessionPercent: Number(student.tutionFeeConcession || 0),
      amount: initialAmount,
      dueDate: dueDate || undefined,
      status: initialAmount > 0 ? 'pending' : 'paid',
      notes: feeNotes || 'Admission initialization fee'
    });

    if (transportInput.availTransport) {
      await Transport.findOneAndUpdate(
        { student: student._id },
        {
          student: student._id,
          route: String(transportInput.route || '').trim(),
          pickupPoint: String(transportInput.pickupPoint || '').trim(),
          dropoffPoint: String(transportInput.dropoffPoint || '').trim(),
          transportFee: transportInput.transportFee !== undefined && transportInput.transportFee !== '' ? Number(transportInput.transportFee) : 0,
          active: true
        },
        { upsert: true, new: true }
      );
    }

    studentUser.profile = {
      ...(studentUser.profile || {}),
      studentRef: student._id,
      studentId: student.studentId,
      class: student.class,
      section: student.section
    };
    await studentUser.save();

    res.status(201).json({
      student,
      user: {
        _id: studentUser._id,
        name: studentUser.name,
        username: studentUser.username,
        email: studentUser.email,
        temporaryPasswordSent: Boolean(temporaryPassword)
      },
      parent: parentProfile
    });
  } catch (err) {
    next(err);
  }
}

async function addParent(req, res, next) {
  try {
    const { parentId } = req.body;
    if (!parentId) return res.status(400).json({ error: 'parentId is required' });

    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const parent = await Parent.findById(parentId).select('user').lean();
    if (!parent?.user) return res.status(404).json({ error: 'Parent not found' });

    if (!student.parents.some((p) => String(p) === String(parent.user))) {
      student.parents.push(parent.user);
      await student.save();
    }

    res.json({ student });
  } catch (err) {
    next(err);
  }
}

async function removeParent(req, res, next) {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    student.parents = student.parents.filter((p) => p.toString() !== req.params.parentId);
    await student.save();

    res.json({ student });
  } catch (err) {
    next(err);
  }
}

async function getStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('user', 'name username email role active')
      .populate('parents', 'name username email role active');

    if (!student) return res.status(404).json({ error: 'Not found' });

    const transport = await Transport.findOne({ student: student._id }).lean();
    const parentProfiles = await Parent.find({ user: { $in: student.parents || [] } }).lean();

    res.json({ student, transport, parentProfiles });
  } catch (err) {
    next(err);
  }
}

async function bulkImportStudents(req, res, next) {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'students array is required' });
    }

    const results = { created: [], failed: [] };

    for (const item of students) {
      try {
        const name = `${item.firstName || ''} ${item.lastName || ''}`.trim();
        const email = String(item.email || '').trim().toLowerCase();
        const username = String(item.username || '').trim().toLowerCase();
        const registrationNumber = String(item.registrationNumber || '').trim();
        const contact = String(item.contact || '').trim();
        if (!name || !email || !item.class || !registrationNumber || !contact) {
          results.failed.push({ item, error: 'Missing required fields: firstName/lastName, email, class, registrationNumber, contact' });
          continue;
        }

        const { user } = await ensureStudentUser({ name, username, email });
        const { className, section } = await resolveClassData({ class: item.class, section: item.section });

        const student = await Student.create({
          user: user._id,
          studentId: await nextStudentId(),
          registrationNumber,
          rollNumber: String(item.rollNumber || '').trim() || undefined,
          class: className,
          section,
          dob: asDate(item.dob),
          contact,
          enrollDate: asDate(item.enrollDate) || new Date()
        });

        results.created.push({ studentId: student.studentId, _id: student._id });
      } catch (itemErr) {
        results.failed.push({ item, error: itemErr.message });
      }
    }

    res.status(201).json(results);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStudentsSummary,
  searchParents,
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  admitStudent,
  addParent,
  removeParent,
  getStudent,
  bulkImportStudents
};
