const { Teacher, User, SchoolClass } = require('../models');
const { sendWelcomeCredentialsEmail } = require('../services/teacherOnboardingMailer');
const { createWelcomeNotificationSafe } = require('../services/notificationService');
const {
  uploadBufferToCloudinary,
  deleteCloudinaryAssetByUrl
} = require('../services/cloudinaryService');

function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return undefined;
}

function parseArrayInput(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value !== 'string') return [];

  const raw = value.trim();
  if (!raw) return [];

  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return raw.split(',').map((v) => v.trim()).filter(Boolean);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDocumentArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value !== 'string') return [];

  const raw = value.trim();
  if (!raw) return [];

  if (raw.startsWith('[') && raw.endsWith(']')) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }

  return [raw];
}

async function uploadTeacherDocuments(files) {
  const uploadList = Array.isArray(files) ? files : [];
  if (uploadList.length === 0) return [];

  const uploaded = await Promise.all(
    uploadList.map((file) =>
      uploadBufferToCloudinary({
        buffer: file.buffer,
        folder: 'edunexus/teachers/documents',
        resourceType: 'auto',
        originalFilename: file.originalname
      })
    )
  );

  return uploaded.map((item) => item.secureUrl).filter(Boolean);
}

async function cleanupTeacherDocuments(urls) {
  const list = Array.isArray(urls) ? urls : [];
  await Promise.all(
    list.map(async (url) => {
      try {
        await deleteCloudinaryAssetByUrl(url);
      } catch {
        // Ignore cleanup failures so business flow can continue.
      }
    })
  );
}

function generatePassword(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%';
  let password = '';
  for (let i = 0; i < length; i += 1) {
    password += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return password;
}

async function nextEmployeeId() {
  const latest = await Teacher.findOne({ employeeId: /^T-\d+$/ })
    .sort({ employeeId: -1 })
    .select('employeeId')
    .lean();

  const latestNumber = latest?.employeeId ? Number(String(latest.employeeId).replace(/^T-/, '')) : 0;
  const next = Number.isFinite(latestNumber) ? latestNumber + 1 : 1;
  return `T-${String(next).padStart(4, '0')}`;
}

function toTeacherListItem(doc) {
  return {
    _id: doc._id,
    employeeId: doc.employeeId,
    designation: doc.designation,
    department: doc.department || '',
    status: doc.status,
    joiningDate: doc.joiningDate,
    experienceYears: doc.experienceYears || 0,
    updatedAt: doc.updatedAt,
    createdAt: doc.createdAt,
    user: {
      _id: doc.user?._id,
      name: doc.user?.name || '',
      username: doc.user?.username || '',
      email: doc.user?.email || '',
      active: doc.user?.active !== false,
      role: doc.user?.role || 'Teacher'
    }
  };
}

async function getTeachersSummary(req, res, next) {
  try {
    const [total, working, resigned, active, inactive] = await Promise.all([
      Teacher.countDocuments({}),
      Teacher.countDocuments({ status: 'Working' }),
      Teacher.countDocuments({ status: 'Resigned' }),
      Teacher.aggregate([
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
      ]),
      Teacher.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDoc'
          }
        },
        { $unwind: '$userDoc' },
        { $match: { 'userDoc.active': false } },
        { $count: 'count' }
      ])
    ]);

    res.json({
      summary: {
        total,
        working,
        active: active[0]?.count || 0,
        inactive: inactive[0]?.count || 0,
        past: resigned
      }
    });
  } catch (err) {
    next(err);
  }
}

async function listTeachers(req, res, next) {
  try {
    const { q, status, active, recentHours, limit, page, sortBy, sortOrder } = req.query;

    const filter = {};
    if (status) filter.status = String(status);

    if (recentHours !== undefined && recentHours !== '') {
      const hours = Number(recentHours);
      if (Number.isFinite(hours) && hours > 0) {
        filter.updatedAt = { $gte: new Date(Date.now() - hours * 60 * 60 * 1000) };
      }
    }

    const pageNumber = Math.max(parseInt(page || '1', 10) || 1, 1);
    const max = Math.min(parseInt(limit || '20', 10) || 20, 100);
    const skip = (pageNumber - 1) * max;

      const sortable = new Set(['createdAt', 'updatedAt', 'employeeId', 'status', 'name', 'username', 'email']);
    const teacherSortKey = sortable.has(String(sortBy)) ? String(sortBy) : 'createdAt';
    const direction = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

    const activeFilter = parseBoolean(active);
    const search = String(q || '').trim();

    const pipeline = [{ $match: filter }];

    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDoc'
        }
      },
      { $unwind: '$userDoc' }
    );

    if (activeFilter !== undefined) {
      pipeline.push({ $match: { 'userDoc.active': activeFilter } });
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      pipeline.push({
        $match: {
          $or: [
            { employeeId: regex },
            { designation: regex },
            { department: regex },
            { qualification: regex },
            { contactNumber: regex },
            { 'userDoc.name': regex },
              { 'userDoc.username': regex },
            { 'userDoc.email': regex }
          ]
        }
      });
    }

    const sortFieldMap = {
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      employeeId: 'employeeId',
      status: 'status',
      name: 'userDoc.name',
        username: 'userDoc.username',
      email: 'userDoc.email'
    };

    const sortField = sortFieldMap[teacherSortKey] || 'createdAt';
    const sortStage = { [sortField]: direction, _id: -1 };

    const [countRows, docs] = await Promise.all([
      Teacher.aggregate([...pipeline, { $count: 'total' }]),
      Teacher.aggregate([
        ...pipeline,
        { $sort: sortStage },
        { $skip: skip },
        { $limit: max },
        {
          $project: {
            _id: 1,
            employeeId: 1,
            designation: 1,
            department: 1,
            status: 1,
            joiningDate: 1,
            experienceYears: 1,
            updatedAt: 1,
            createdAt: 1,
            user: {
              _id: '$userDoc._id',
              name: '$userDoc.name',
                username: '$userDoc.username',
              email: '$userDoc.email',
              active: '$userDoc.active',
              role: '$userDoc.role'
            }
          }
        }
      ])
    ]);

    const total = countRows?.[0]?.total || 0;
    const totalPages = Math.max(Math.ceil(total / max), 1);
    const rows = docs.map((doc) => toTeacherListItem(doc));

    res.json({
      teachers: rows,
      pagination: {
        page: pageNumber,
        limit: max,
        total,
        totalPages,
        hasPrev: pageNumber > 1,
        hasNext: pageNumber < totalPages
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getTeacherById(req, res, next) {
  try {
    const teacher = await Teacher.findById(req.params.id).populate({
      path: 'user',
      select: 'name username email active role createdAt updatedAt'
    });

    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    res.json({ teacher });
  } catch (err) {
    next(err);
  }
}

async function createTeacher(req, res, next) {
  let user = null;
  let teacher = null;
  let uploadedDocumentUrls = [];

  try {
    const {
      name,
      username,
      email,
      designation,
      department,
      qualification,
      joiningDate,
      experienceYears,
      salary,
      contactNumber,
      address,
      emergencyContactName,
      emergencyContactPhone,
      notes
    } = req.body;

    const normalizedUsername = String(username || '').trim().toLowerCase();
    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUsername = await User.findOne({ username: normalizedUsername }).select('_id');
    if (existingUsername) return res.status(409).json({ error: 'Username already exists' });

    const generatedPassword = generatePassword(8);

    user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password: generatedPassword,
      role: 'Teacher',
      active: true,
      profile: {}
    });

    uploadedDocumentUrls = await uploadTeacherDocuments(req.files || []);

    const employeeId = await nextEmployeeId();

    teacher = await Teacher.create({
      user: user._id,
      employeeId,
      designation,
      department: department || '',
      subjects: parseArrayInput(req.body.subjects),
      classesAssigned: parseArrayInput(req.body.classesAssigned),
      qualification,
      certifications: parseArrayInput(req.body.certifications),
      joiningDate: new Date(joiningDate),
      experienceYears: Number(experienceYears || 0),
      salary: salary !== undefined && salary !== '' ? Number(salary) : undefined,
      contactNumber,
      address,
      emergencyContact: {
        name: emergencyContactName || '',
        phone: emergencyContactPhone || ''
      },
      status: 'Working',
      documents: uploadedDocumentUrls,
      notes: notes || ''
    });

    try {
      await sendWelcomeCredentialsEmail({
        to: normalizedEmail,
        recipientName: name,
        roleLabel: 'Teacher',
        username: normalizedUsername,
        temporaryPassword: generatedPassword
      });
    } catch (mailErr) {
      await Teacher.findByIdAndDelete(teacher._id);
      await User.findByIdAndDelete(user._id);
      await cleanupTeacherDocuments(uploadedDocumentUrls);
      return res.status(mailErr.status || 502).json({
        error: mailErr.message || 'Failed to send welcome email. Teacher was not created.'
      });
    }

      await createWelcomeNotificationSafe({
        userId: user._id,
        recipientName: name,
        role: user.role,
        createdBy: req.user?.id
      });

    const populated = await Teacher.findById(teacher._id).populate({
      path: 'user',
      select: 'name username email active role'
    });

    res.status(201).json({ teacher: populated });
  } catch (err) {
    // Cleanup partially created records if any unexpected error occurred.
    if (teacher?._id) await Teacher.findByIdAndDelete(teacher._id);
    if (user?._id) await User.findByIdAndDelete(user._id);
    await cleanupTeacherDocuments(uploadedDocumentUrls);

    if (err?.code === 11000 && String(err.message || '').includes('employeeId')) {
      return res.status(409).json({ error: 'Employee ID generation conflict, please retry.' });
    }

    next(err);
  }
}

async function updateTeacher(req, res, next) {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const updates = req.body || {};

    const userUpdates = {};
    if (typeof updates.name === 'string') userUpdates.name = updates.name;
    if (typeof updates.username === 'string') userUpdates.username = String(updates.username).toLowerCase().trim();
    if (typeof updates.email === 'string') userUpdates.email = String(updates.email).toLowerCase().trim();
    if (updates.active !== undefined) {
      const parsedActive = parseBoolean(updates.active);
      if (typeof parsedActive === 'boolean') userUpdates.active = parsedActive;
    }

    if (userUpdates.username) {
      const sameUsername = await User.findOne({
        username: userUpdates.username,
        _id: { $ne: teacher.user }
      }).select('_id');
      if (sameUsername) return res.status(409).json({ error: 'Username already exists' });
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(teacher.user, userUpdates, { new: true });
    }

    if (typeof updates.designation === 'string') teacher.designation = updates.designation;
    if (updates.department !== undefined) teacher.department = updates.department || '';
    if (updates.subjects !== undefined) teacher.subjects = parseArrayInput(updates.subjects);
    if (updates.classesAssigned !== undefined) teacher.classesAssigned = parseArrayInput(updates.classesAssigned);
    if (typeof updates.qualification === 'string') teacher.qualification = updates.qualification;
    if (updates.certifications !== undefined) teacher.certifications = parseArrayInput(updates.certifications);
    if (updates.joiningDate) teacher.joiningDate = new Date(updates.joiningDate);
    if (updates.experienceYears !== undefined && updates.experienceYears !== '') {
      teacher.experienceYears = Number(updates.experienceYears || 0);
    }
    if (updates.salary !== undefined) {
      teacher.salary = updates.salary === '' ? undefined : Number(updates.salary || 0);
    }
    if (typeof updates.contactNumber === 'string') teacher.contactNumber = updates.contactNumber;
    if (typeof updates.address === 'string') teacher.address = updates.address;

    if (updates.emergencyContactName !== undefined || updates.emergencyContactPhone !== undefined) {
      teacher.emergencyContact = {
        name: updates.emergencyContactName !== undefined ? updates.emergencyContactName : teacher.emergencyContact?.name || '',
        phone: updates.emergencyContactPhone !== undefined ? updates.emergencyContactPhone : teacher.emergencyContact?.phone || ''
      };
    }

    if (updates.status && ['Working', 'Resigned'].includes(String(updates.status))) {
      teacher.status = String(updates.status);
    }

    if (updates.notes !== undefined) teacher.notes = updates.notes || '';

    const removeDocuments = normalizeDocumentArray(updates.removeDocuments);
    if (removeDocuments.length > 0) {
      const removeSet = new Set(removeDocuments);
      const existing = Array.isArray(teacher.documents) ? teacher.documents : [];
      teacher.documents = existing.filter((url) => !removeSet.has(url));
      await cleanupTeacherDocuments(removeDocuments);
    }

    const newDocumentUrls = await uploadTeacherDocuments(req.files || []);
    if (newDocumentUrls.length > 0) {
      teacher.documents = [...(teacher.documents || []), ...newDocumentUrls];
    }

    await teacher.save();

    const populated = await Teacher.findById(teacher._id).populate({
      path: 'user',
      select: 'name email active role'
    });

    res.json({ teacher: populated });
  } catch (err) {
    next(err);
  }
}

async function deleteTeacher(req, res, next) {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const userId = teacher.user;

    // Delete all teacher documents from Cloudinary
    const docs = Array.isArray(teacher.documents) ? teacher.documents : [];
    if (docs.length > 0) {
      await cleanupTeacherDocuments(docs);
    }

    // Delete the teacher record
    await Teacher.findByIdAndDelete(teacher._id);

    // Delete the associated user
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function getMyClasses(req, res, next) {
  try {
    const teacher = await Teacher.findOne({ user: req.user.id })
      .select('classesAssigned')
      .lean();

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const assignedClasses = Array.isArray(teacher.classesAssigned)
      ? teacher.classesAssigned.map((c) => String(c).trim()).filter(Boolean)
      : [];

    const classes = await SchoolClass.find({ name: { $in: assignedClasses } })
      .sort({ name: 1 })
      .lean();

    res.json({ classes });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTeachersSummary,
  listTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getMyClasses
};
