const { Student, User } = require('../models');

function getTeacherScope(user) {
  const profile = user.profile || {};
  const cls = profile.class || profile.classId || profile.assignedClass;
  const section = profile.section || profile.assignedSection;
  return {
    class: cls ? String(cls) : null,
    section: section ? String(section) : null
  };
}

// List students (used by attendance roster and admin views)
async function listStudents(req, res, next) {
  try {
    const { classId, section, q, limit } = req.query;
    const filter = {};

    if (classId) filter.class = String(classId);
    if (section) filter.section = String(section);

    if (req.user.role === 'Teacher') {
      const scope = getTeacherScope(req.user);
      if (scope.class) {
        filter.class = scope.class;
        if (scope.section) filter.section = scope.section;
      }
    }

    if (q) {
      const s = String(q).trim();
      if (s) {
        filter.$or = [
          { firstName: { $regex: s, $options: 'i' } },
          { lastName: { $regex: s, $options: 'i' } },
          { studentId: { $regex: s, $options: 'i' } }
        ];
      }
    }

    const max = Math.min(parseInt(limit || '200', 10) || 200, 500);
    const students = await Student.find(filter)
      .select('studentId firstName lastName class section status')
      .sort({ class: 1, section: 1, firstName: 1 })
      .limit(max);

    res.json({ students });
  } catch (err) {
    next(err);
  }
}

async function createStudent(req, res, next) {
  try {
    const payload = req.body;
    const exists = await Student.findOne({ studentId: payload.studentId });
    if (exists) return res.status(409).json({ error: 'Student ID already exists' });

    const student = await Student.create({
      studentId: payload.studentId,
      firstName: payload.firstName,
      lastName: payload.lastName || '',
      class: String(payload.class),
      section: payload.section || '',
      dob: payload.dob ? new Date(payload.dob) : undefined,
      parents: Array.isArray(payload.parents) ? payload.parents : [],
      contact: payload.contact || '',
      address: payload.address || '',
      enrollDate: payload.enrollDate ? new Date(payload.enrollDate) : undefined,
      status: payload.status || 'active'
    });

    res.status(201).json({ student });
  } catch (err) {
    next(err);
  }
}

async function updateStudent(req, res, next) {
  try {
    const updates = { ...(req.body || {}) };
    if (updates.class) updates.class = String(updates.class);
    if (updates.dob) updates.dob = new Date(updates.dob);
    if (updates.enrollDate) updates.enrollDate = new Date(updates.enrollDate);

    const student = await Student.findByIdAndUpdate(req.params.studentId, updates, { new: true });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ student });
  } catch (err) {
    next(err);
  }
}

async function admitStudent(req, res, next) {
  try {
    const { student: studentInput, parent, createStudentLogin } = req.body;

    const existingStudent = await Student.findOne({ studentId: studentInput.studentId });
    if (existingStudent) return res.status(409).json({ error: 'Student ID already exists' });

    // Resolve parent user
    let parentUser = null;
    if (parent && parent.mode === 'existing') {
      parentUser = await User.findById(parent.parentId);
      if (!parentUser) return res.status(404).json({ error: 'Parent not found' });
      if (parentUser.role !== 'Parent') return res.status(400).json({ error: 'Selected user is not a Parent' });
    }

    if (parent && parent.mode === 'new') {
      const parentEmail = String(parent.email || '').toLowerCase().trim();
      if (!parentEmail) return res.status(400).json({ error: 'Parent email is required for new parent' });
      const parentName = String(parent.name || '').trim();
      if (!parentName) return res.status(400).json({ error: 'Parent name is required for new parent' });

      parentUser = await User.findOne({ email: parentEmail });
      if (!parentUser) {
        const tempPassword = parent.tempPassword || 'Parent@123';
        parentUser = await User.create({
          name: parentName,
          email: parentEmail,
          password: tempPassword,
          role: 'Parent',
          active: true,
          profile: {
            ...(parent.phone ? { phone: String(parent.phone) } : {})
          }
        });
      } else if (parentUser.role !== 'Parent') {
        return res.status(400).json({ error: 'Email exists but is not a Parent account' });
      }
    }

    const student = await Student.create({
      studentId: studentInput.studentId,
      firstName: studentInput.firstName,
      lastName: studentInput.lastName || '',
      class: String(studentInput.class),
      section: studentInput.section || '',
      dob: studentInput.dob ? new Date(studentInput.dob) : undefined,
      parents: parentUser ? [parentUser._id] : [],
      contact: studentInput.contact || '',
      address: studentInput.address || '',
      enrollDate: studentInput.enrollDate ? new Date(studentInput.enrollDate) : new Date(),
      status: studentInput.status || 'active'
    });

    // Optional student login creation/link
    let studentUser = null;
    if (createStudentLogin && createStudentLogin.enabled) {
      const email = String(createStudentLogin.email || '').toLowerCase().trim();
      if (!email) return res.status(400).json({ error: 'Student login email is required' });
      const name = String(createStudentLogin.name || `${student.firstName} ${student.lastName || ''}`.trim());
      const password = createStudentLogin.tempPassword || 'Student@123';

      studentUser = await User.findOne({ email });
      if (!studentUser) {
        studentUser = await User.create({
          name,
          email,
          password,
          role: 'Student',
          active: true,
          profile: { studentRef: student._id }
        });
      } else {
        if (studentUser.role !== 'Student') {
          return res.status(400).json({ error: 'Student login email exists but is not a Student account' });
        }
        studentUser.profile = { ...(studentUser.profile || {}), studentRef: student._id };
        await studentUser.save();
      }
    }

    res.status(201).json({
      student,
      parent: parentUser ? { _id: parentUser._id, name: parentUser.name, email: parentUser.email } : null,
      studentUser: studentUser ? { _id: studentUser._id, name: studentUser.name, email: studentUser.email } : null
    });
  } catch (err) {
    next(err);
  }
}

// Add parent to student (link existing parent user)
async function addParent(req, res, next) {
  try {
    const { parentId } = req.body;
    if (!parentId) return res.status(400).json({ error: 'parentId is required' });

    const student = await Student.findById(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const parent = await User.findById(parentId);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });
    if (parent.role !== 'Parent') return res.status(400).json({ error: 'User is not a parent' });

    // avoid duplicates
    if (student.parents.includes(parentId)) {
      return res.status(409).json({ error: 'Parent already linked' });
    }

    student.parents.push(parentId);
    await student.save();

    res.json({ student });
  } catch (err) {
    next(err);
  }
}

// Remove parent from student
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

// Get student details with parents populated
async function getStudent(req, res, next) {
  try {
    const student = await Student.findById(req.params.studentId).populate(
      'parents',
      'name email'
    );
    if (!student) return res.status(404).json({ error: 'Not found' });
    res.json({ student });
  } catch (err) {
    next(err);
  }
}

// Bulk import students (and optionally create parent accounts)
async function bulkImportStudents(req, res, next) {
  try {
    const { students } = req.body;
    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: 'students array is required' });
    }

    const results = { created: [], failed: [] };

    for (const item of students) {
      try {
        const { studentId, firstName, lastName, class: cls, section, dob, parentEmail, parentName } = item;
        if (!studentId || !firstName || !cls) {
          results.failed.push({ item, error: 'Missing required fields: studentId, firstName, class' });
          continue;
        }

        // Check if student already exists
        let student = await Student.findOne({ studentId });
        if (student) {
          results.failed.push({ item, error: 'Student ID already exists' });
          continue;
        }

        // Create student
        student = await Student.create({
          studentId,
          firstName,
          lastName: lastName || '',
          class: cls,
          section: section || '',
          dob: dob ? new Date(dob) : undefined,
          parents: []
        });

        // Create parent if provided
        if (parentEmail && parentName) {
          let parent = await User.findOne({ email: parentEmail });
          if (!parent) {
            parent = await User.create({
              name: parentName,
              email: parentEmail,
              password: 'TempPassword123!', // temp password; parent should change on first login
              role: 'Parent'
            });
          }
          student.parents.push(parent._id);
          await student.save();
        }

        results.created.push({
          studentId: student._id,
          firstName: student.firstName,
          parentCreated: !!parentEmail
        });
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
  listStudents,
  createStudent,
  updateStudent,
  admitStudent,
  addParent,
  removeParent,
  getStudent,
  bulkImportStudents
};

