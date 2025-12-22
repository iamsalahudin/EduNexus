const { Student, User } = require('../models');
const mongoose = require('mongoose');

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

module.exports = { addParent, removeParent, getStudent, bulkImportStudents };
