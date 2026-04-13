const PDFDocument = require('pdfkit');
const { arrayToCSV, getNestedValue, setCSVHeaders } = require('../utils/csvExport');
const { Marksheet, Exam, Student, Subject, ReportCard, Timetable, ExamMark, Teacher, Notification } = require('../models');
const { computeWeightedResult, validateWeights } = require('../utils/results');
const { calculateGrade } = require('../utils/grading');

function isAdmin(user) {
  return user?.role === 'Admin';
}

function isPrincipal(user) {
  return user?.role === 'Principal';
}

function isTeacher(user) {
  return user?.role === 'Teacher';
}

function isAdminOrPrincipal(user) {
  return isAdmin(user) || isPrincipal(user);
}

/**
 * GET /api/marksheets?examId=...&className=...
 * List marksheets for a given exam, optionally filtered by className
 */
async function listMarksheets(req, res, next) {
  try {
    const { examId, className } = req.query;
    const filter = {};
    if (examId) filter.exam = String(examId).trim();

    if (isTeacher(req.user)) {
      const teacher = await Teacher.findOne({ user: req.user.id })
        .select('classesAssigned')
        .lean();

      const assignedClasses = Array.isArray(teacher?.classesAssigned)
        ? teacher.classesAssigned.map((c) => String(c).trim()).filter(Boolean)
        : [];

      if (!assignedClasses.length) {
        return res.json({ marksheets: [] });
      }

      if (className) {
        const requestedClass = String(className).trim();
        if (!assignedClasses.includes(requestedClass)) {
          return res.status(403).json({ error: 'Access denied for this class' });
        }
        filter.className = requestedClass;
      } else {
        filter.className = { $in: assignedClasses };
      }
    } else if (isAdminOrPrincipal(req.user)) {
      if (className) filter.className = String(className).trim();
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const marksheets = await Marksheet.find(filter)
      .populate('exam', '_id name className type month year status publishedAt')
      .sort({ className: 1, section: 1 })
      .lean();

    res.json({ marksheets });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/marksheets/:id
 * Get marksheet detail with student rows and marks
 */
async function getMarksheetDetail(req, res, next) {
  try {
    const marksheet = await Marksheet.findById(req.params.id)
      .populate('exam', '_id name className type subjects resultWeights grMaxMarks publishedAt')
      .populate('subjects', '_id name')
      .populate('studentRows.student', '_id user')
      .populate('studentRows.subjectMarks.subject', '_id name')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });

    // Check permissions
    if (isTeacher(req.user)) {
      // Teacher can view their assigned subjects only
      const allowed = await teacherCanAccessMarksheet(req.user.id, marksheet);
      if (!allowed) return res.status(403).json({ error: 'Access denied' });

      const assignedSubjectIds = await teacherAssignedSubjectIds(
        req.user.id,
        marksheet.className,
        marksheet.section
      );

      if (assignedSubjectIds.size === 0) {
        return res.status(403).json({ error: 'No assigned subjects for this marksheet' });
      }

      marksheet.subjects = (marksheet.subjects || []).filter((subject) =>
        assignedSubjectIds.has(String(subject?._id || subject))
      );

      marksheet.studentRows = (marksheet.studentRows || []).map((row) => ({
        ...row,
        subjectMarks: (row.subjectMarks || []).filter((subjectMark) =>
          assignedSubjectIds.has(String(subjectMark?.subject?._id || subjectMark?.subject))
        )
      }));
    } else if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ marksheet });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/marksheets/:id/student-marks
 * Update marks for a student (teacher updates assigned subjects only)
 * Body: { studentId, subjectId, marks, theoryMarks, practicalMarks }
 */
async function updateStudentMarks(req, res, next) {
  try {
    const marksheet = await Marksheet.findById(req.params.id)
      .select('exam className section studentRows locked status')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });
    if (marksheet.locked) return res.status(409).json({ error: 'Marksheet is locked' });
    if (marksheet.status === 'published') return res.status(409).json({ error: 'Marksheet is published' });

    const exam = await Exam.findById(marksheet.exam).select('_id').lean();
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    // Permission check
    if (isTeacher(req.user)) {
      const allowed = await teacherCanUpdateMarksForSubject(
        req.user.id,
        req.body.subjectId,
        marksheet.className,
        marksheet.section
      );
      if (!allowed) return res.status(403).json({ error: 'You cannot update marks for this subject' });
    } else if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { studentId, subjectId, marks, theoryMarks, practicalMarks } = req.body;

    // Find and update student row
    const updates = {
      updatedBy: req.user.id
    };

    // Use $set to update nested array element
    const result = await Marksheet.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'studentRows.$[sr].subjectMarks.$[sm].marks': marks,
          'studentRows.$[sr].subjectMarks.$[sm].theoryMarks': theoryMarks,
          'studentRows.$[sr].subjectMarks.$[sm].practicalMarks': practicalMarks,
          'studentRows.$[sr].updatedAt': new Date(),
          updatedBy: req.user.id
        }
      },
      {
        arrayFilters: [
          { 'sr.student': studentId },
          { 'sm.subject': subjectId }
        ],
        new: true
      }
    )
      .populate('exam', '_id name')
      .lean();

    if (!result) return res.status(404).json({ error: 'Mark update failed' });

    // Also save/sync to ExamMark collection
    try {
      await ExamMark.findOneAndUpdate(
        { exam: marksheet.exam, student: studentId, subject: subjectId },
        {
          marks,
          theoryMarks,
          practicalMarks,
          updatedBy: req.user.id
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('Error syncing ExamMark:', err.message);
    }

    res.json({ ok: true, marksheet: result });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/marksheets/:id/gr-marks
 * Update General Report (GR) marks for a student
 * Only Admin/Principal/Class Teacher can edit
 * Body: { studentId, grPerformanceMarks }
 */
async function updateGRMarks(req, res, next) {
  try {
    const marksheet = await Marksheet.findById(req.params.id)
      .select('exam className section studentRows locked status')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });
    if (marksheet.locked && marksheet.status === 'published') {
      return res.status(409).json({ error: 'Cannot edit GR marks after publish' });
    }

    // Permission check: admin/principal always allowed, teacher only if class teacher
    if (isTeacher(req.user)) {
      const isClassTeacher = await teacherIsClassTeacher(req.user.id, marksheet.className);
      if (!isClassTeacher) {
        return res.status(403).json({ error: 'Only class teachers can edit GR marks' });
      }
    } else if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { studentId, grPerformanceMarks } = req.body;

    const result = await Marksheet.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'studentRows.$[sr].grPerformanceMarks': grPerformanceMarks,
          'studentRows.$[sr].updatedAt': new Date(),
          updatedBy: req.user.id
        }
      },
      {
        arrayFilters: [{ 'sr.student': studentId }],
        new: true
      }
    )
      .populate('exam', '_id name')
      .lean();

    if (!result) return res.status(404).json({ error: 'GR mark update failed' });
    res.json({ ok: true, marksheet: result });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/marksheets/:id/teacher-comments
 * Update teacher comments for a student
 * Body: { studentId, teacherComments }
 */
async function updateTeacherComments(req, res, next) {
  try {
    const marksheet = await Marksheet.findById(req.params.id)
      .select('exam className locked status')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });

    // Permission: teacher can comment on their assigned classes only
    if (isTeacher(req.user)) {
      const allowed = await teacherTeachesClass(req.user.id, marksheet.className);
      if (!allowed) return res.status(403).json({ error: 'Access denied' });
    } else if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { studentId, teacherComments } = req.body;

    const result = await Marksheet.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          'studentRows.$[sr].teacherComments': teacherComments,
          updatedBy: req.user.id
        }
      },
      {
        arrayFilters: [{ 'sr.student': studentId }],
        new: true
      }
    )
      .populate('exam', '_id name')
      .lean();

    if (!result) return res.status(404).json({ error: 'Comment update failed' });
    res.json({ ok: true, marksheet: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marksheets/:id/lock
 * Lock marksheet: prevent further edits by teachers
 * Only Admin/Principal can lock
 */
async function lockMarksheet(req, res, next) {
  try {
    if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Only Admin/Principal can lock marksheets' });
    }

    const marksheet = await Marksheet.findById(req.params.id)
      .select('_id locked status')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });
    if (marksheet.locked) return res.json({ ok: true, marksheet });

    const result = await Marksheet.findByIdAndUpdate(
      req.params.id,
      {
        locked: true,
        lockedBy: req.user.id,
        lockedAt: new Date(),
        status: 'locked',
        updatedBy: req.user.id
      },
      { new: true }
    )
      .populate('exam', '_id name')
      .lean();

    res.json({ ok: true, marksheet: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marksheets/:id/unlock
 * Unlock marksheet: allow teacher edits again
 * Only Admin/Principal can unlock (before publish)
 */
async function unlockMarksheet(req, res, next) {
  try {
    if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Only Admin/Principal can unlock marksheets' });
    }

    const marksheet = await Marksheet.findById(req.params.id)
      .select('_id locked status publishedAt')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });
    if (marksheet.publishedAt) {
      return res.status(409).json({ error: 'Cannot unlock published marksheet' });
    }
    if (!marksheet.locked) return res.json({ ok: true, marksheet });

    const result = await Marksheet.findByIdAndUpdate(
      req.params.id,
      {
        locked: false,
        lockedBy: null,
        lockedAt: null,
        status: 'in-progress',
        updatedBy: req.user.id
      },
      { new: true }
    )
      .populate('exam', '_id name')
      .lean();

    res.json({ ok: true, marksheet: result });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/marksheets/:id/publish
 * Publish marksheet: lock it, compute results, and generate report cards
 * Only Admin/Principal can publish
 * Prerequisites: marksheet must be locked
 */
async function publishMarksheet(req, res, next) {
  try {
    if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Only Admin/Principal can publish marksheets' });
    }

    const marksheet = await Marksheet.findById(req.params.id)
      .populate('exam', '_id name className subjects year month resultWeights grMaxMarks')
      .populate('subjects', '_id')
      .select('-__v')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });
    if (!marksheet.locked) {
      return res.status(409).json({ error: 'Marksheet must be locked before publishing' });
    }
    if (marksheet.published) return res.json({ ok: true, marksheet });

    // Validate weights sum to 100
    const weights = marksheet.exam?.resultWeights || {};
    const weightSum = (weights.exam || 0) + (weights.attendance || 0) + (weights.homework || 0) + (weights.gr || 0);
    if (Math.abs(weightSum - 100) > 0.01) {
      return res.status(400).json({ error: `Result weights must sum to 100 (current: ${weightSum})` });
    }

    const reportCardRecords = await generateReportCardsFromMarksheet(marksheet, req.user.id);
    const notification = await createResultPublishedNotification(marksheet, req.user.id, reportCardRecords.length);

    // Update marksheet status
    const result = await Marksheet.findByIdAndUpdate(
      req.params.id,
      {
        published: true,
        publishedBy: req.user.id,
        publishedAt: new Date(),
        status: 'published',
        updatedBy: req.user.id
      },
      { new: true }
    )
      .populate('exam', '_id name')
      .lean();

    res.json({ ok: true, marksheet: result, reportCardsGenerated: reportCardRecords.length, notification });
  } catch (err) {
    next(err);
  }
}

async function exportMarksheetCsv(req, res, next) {
  try {
    const marksheet = await Marksheet.findById(req.params.id)
      .populate('exam', '_id name className type year month')
      .populate('studentRows.student', '_id studentId class section user')
      .populate('studentRows.student.user', '_id name')
      .populate('studentRows.subjectMarks.subject', '_id name')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });

    const rows = buildMarksheetExportRows(marksheet);
    const headers = buildMarksheetExportHeaders(marksheet);
    const csv = arrayToCSV(rows, headers);
    const filename = `marksheet_${String(marksheet.exam?.className || marksheet.className).replace(/\s+/g, '_')}_${String(marksheet.section || 'all').replace(/\s+/g, '_')}_${String(marksheet.exam?.year || new Date().getFullYear())}.csv`;
    setCSVHeaders(res, filename);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

async function exportMarksheetPdf(req, res, next) {
  try {
    const marksheet = await Marksheet.findById(req.params.id)
      .populate('exam', '_id name className type year month')
      .populate('studentRows.student', '_id studentId class section user')
      .populate('studentRows.student.user', '_id name')
      .populate('studentRows.subjectMarks.subject', '_id name')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const filename = `marksheet_${String(marksheet.exam?.className || marksheet.className).replace(/\s+/g, '_')}_${String(marksheet.section || 'all').replace(/\s+/g, '_')}_${String(marksheet.exam?.year || new Date().getFullYear())}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    doc.fontSize(18).text('Marksheet Export', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).text(`Exam: ${marksheet.exam?.name || '-'}`);
    doc.text(`Class: ${marksheet.exam?.className || marksheet.className || '-'}`);
    doc.text(`Section: ${marksheet.section || '-'}`);
    doc.text(`Status: ${marksheet.status || '-'}`);
    doc.moveDown();

    const rows = buildMarksheetExportRows(marksheet);
    const headers = buildMarksheetExportHeaders(marksheet);
    doc.fontSize(10);
    doc.text(headers.map((h) => h.label).join(' | '));
    doc.moveDown(0.5);

    for (const row of rows) {
      const line = headers.map((header) => String(getNestedValue(row, header.key) ?? '')).join(' | ');
      doc.text(line);
    }

    doc.end();
  } catch (err) {
    next(err);
  }
}

async function importMarksheetCsv(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const marksheet = await Marksheet.findById(req.params.id)
      .populate('exam', '_id name className type year month')
      .populate('subjects', '_id name')
      .populate('studentRows.student', '_id studentId class section')
      .populate('studentRows.subjectMarks.subject', '_id name')
      .lean();

    if (!marksheet) return res.status(404).json({ error: 'Marksheet not found' });
    if (marksheet.locked) return res.status(409).json({ error: 'Marksheet is locked' });
    if (marksheet.status === 'published') return res.status(409).json({ error: 'Marksheet is published' });

    let allowedSubjectIds = new Set((marksheet.subjects || []).map((s) => String(s?._id || s)));

    if (isTeacher(req.user)) {
      const allowed = await teacherCanAccessMarksheet(req.user.id, marksheet);
      if (!allowed) return res.status(403).json({ error: 'Access denied' });

      allowedSubjectIds = await teacherAssignedSubjectIds(req.user.id, marksheet.className, marksheet.section);
      if (allowedSubjectIds.size === 0) {
        return res.status(403).json({ error: 'No assigned subjects for this marksheet' });
      }
    } else if (!isAdminOrPrincipal(req.user)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const csvText = String(req.file.buffer.toString('utf8') || '').replace(/^\uFEFF/, '');
    const rows = parseCsvRows(csvText);
    if (rows.length < 2) {
      return res.status(400).json({ error: 'CSV must include a header row and at least one data row' });
    }

    const headers = rows[0].map((h) => String(h || '').trim());
    const headerMap = new Map(headers.map((h, i) => [normalizeCsvKey(h), i]));
    const studentIdColumn = headerMap.get(normalizeCsvKey('Student ID'));

    if (studentIdColumn === undefined) {
      return res.status(400).json({ error: 'CSV header must include "Student ID" column' });
    }

    const subjectHeaders = resolveSubjectImportColumns(headers, marksheet.subjects || [], allowedSubjectIds);
    if (subjectHeaders.length === 0) {
      return res.status(400).json({ error: 'No subject marks columns found for this marksheet' });
    }

    const studentRowMap = new Map();
    for (const row of marksheet.studentRows || []) {
      const key = String(row?.student?.studentId || '').trim();
      if (!key) continue;
      studentRowMap.set(key, row);
    }

    let updatedMarks = 0;
    let skippedStudents = 0;
    let skippedCells = 0;

    const resolveSubjectMax = (subjectId) => {
      const mapLike = marksheet.subjectMaxMarks || {};
      if (typeof mapLike.get === 'function') return Number(mapLike.get(subjectId) || 100);
      return Number(mapLike[subjectId] || 100);
    };

    for (let i = 1; i < rows.length; i += 1) {
      const csvRow = rows[i];
      const studentId = String(csvRow[studentIdColumn] || '').trim();
      if (!studentId) continue;

      const marksheetStudent = studentRowMap.get(studentId);
      if (!marksheetStudent) {
        skippedStudents += 1;
        continue;
      }

      for (const col of subjectHeaders) {
        const rawValue = csvRow[col.index];
        if (rawValue === undefined || String(rawValue).trim() === '') continue;

        const numericMark = Number(rawValue);
        if (!Number.isFinite(numericMark) || numericMark < 0) {
          skippedCells += 1;
          continue;
        }

        const subjectMax = resolveSubjectMax(col.subjectId);
        if (numericMark > subjectMax) {
          skippedCells += 1;
          continue;
        }

        await Marksheet.findByIdAndUpdate(
          marksheet._id,
          {
            $set: {
              'studentRows.$[sr].subjectMarks.$[sm].marks': numericMark,
              'studentRows.$[sr].updatedAt': new Date(),
              updatedBy: req.user.id
            }
          },
          {
            arrayFilters: [
              { 'sr.student': marksheetStudent.student._id },
              { 'sm.subject': col.subjectId }
            ]
          }
        );

        await ExamMark.findOneAndUpdate(
          {
            exam: marksheet.exam?._id || marksheet.exam,
            student: marksheetStudent.student._id,
            subject: col.subjectId
          },
          {
            marks: numericMark,
            updatedBy: req.user.id
          },
          { upsert: true }
        );

        updatedMarks += 1;
      }
    }

    return res.json({
      ok: true,
      importedRows: rows.length - 1,
      updatedMarks,
      skippedStudents,
      skippedCells,
      matchedSubjectColumns: subjectHeaders.length
    });
  } catch (err) {
    next(err);
  }
}

// ========== Helper Functions ==========

async function teacherCanAccessMarksheet(teacherId, marksheet) {
  // Teacher can access marksheet for their assigned class/subjects
  return teacherTeachesClass(teacherId, marksheet.className);
}

async function teacherCanUpdateMarksForSubject(teacherId, subjectId, className, section) {
  // Check if teacher is assigned to this subject in the class
  const year = new Date().getFullYear();
  const filter = {
    class: className,
    section,
    year,
    isActive: true,
    'slots.subject': subjectId,
    'slots.teacher': teacherId
  };

  const timetable = await Timetable.exists(filter);
  return !!timetable;
}

async function teacherAssignedSubjectIds(teacherId, className, section) {
  const year = new Date().getFullYear();
  const timetables = await Timetable.find({
    class: className,
    section,
    year,
    isActive: true,
    'slots.teacher': teacherId
  })
    .select('slots.subject slots.teacher')
    .lean();

  const assigned = new Set();
  for (const timetable of timetables) {
    for (const slot of timetable?.slots || []) {
      if (!slot?.subject || String(slot?.teacher) !== String(teacherId)) continue;
      assigned.add(String(slot.subject));
    }
  }

  return assigned;
}

async function teacherIsClassTeacher(teacherId, className) {
  // Check if teacher is the class incharge/class teacher
  // This could be stored in AttendanceAssignment or similar
  // For now, simplified: check if they teach this class
  const teacher = await Teacher.findOne({ user: teacherId })
    .select('classesAssigned')
    .lean();

  return teacher && Array.isArray(teacher.classesAssigned) && teacher.classesAssigned.includes(className);
}

async function teacherTeachesClass(teacherId, className) {
  // Check if teacher is assigned to any subject in this class
  const year = new Date().getFullYear();
  const timetable = await Timetable.findOne({
    class: className,
    year,
    isActive: true,
    'slots.teacher': teacherId
  }).lean();

  return !!timetable;
}

async function generateReportCardsFromMarksheet(marksheet, userId) {
  const records = [];

  const resolveSubjectMaxMarks = (mapLike, subjectId) => {
    if (!mapLike) return 100;
    if (typeof mapLike.get === 'function') {
      return Number(mapLike.get(subjectId) || 100);
    }
    return Number(mapLike[subjectId] || 100);
  };

  try {
    // Validate weights before generating reports
    const validation = validateWeights(marksheet.exam?.resultWeights);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const term = String(marksheet?.exam?.name || `Exam ${marksheet?.exam?.year || new Date().getFullYear()}`).trim();
    const year = Number(marksheet?.exam?.year || new Date().getFullYear());
    const subjectMaxMarks = marksheet?.subjectMaxMarks || {};

    for (const studentRow of marksheet.studentRows || []) {
      const student = studentRow.student;

      // Compute weighted result
      const totalPercentage = await computeWeightedResult({
        studentId: student,
        examId: marksheet.exam._id,
        grPerformanceMarks: studentRow.grPerformanceMarks,
        grMaxMarks: marksheet.exam.grMaxMarks || 100,
        resultWeights: marksheet.exam.resultWeights
      });

      const processedSubjects = (studentRow.subjectMarks || []).map((subjMark) => {
        const subjectId = String(subjMark.subject);
        const maxMarks = resolveSubjectMaxMarks(subjectMaxMarks, subjectId);
        const marks = Number(subjMark.marks || 0);

        return {
          subject: subjMark.subject,
          marks,
          grade: calculateGrade(marks, maxMarks),
          remarks: ''
        };
      });

      if (processedSubjects.length > 0 && studentRow.teacherComments) {
        processedSubjects[0].remarks = String(studentRow.teacherComments);
      }

      const overallGrade = calculateGrade(totalPercentage, 100);

      const reportCard = await ReportCard.findOneAndUpdate(
        {
          student,
          term,
          year
        },
        {
          subjects: processedSubjects,
          totalMarks: Math.round(totalPercentage),
          percentage: totalPercentage,
          grade: overallGrade,
          comments: studentRow.teacherComments || '',
          status: 'published',
          approvedBy: userId,
          approvedAt: new Date(),
          createdBy: userId,
          updatedBy: userId
        },
        { upsert: true, new: true }
      );

      records.push(reportCard);
    }
  } catch (err) {
    console.error('Error generating report cards:', err.message);
  }

  return records;
}

async function createResultPublishedNotification(marksheet, userId, reportCardsGenerated) {
  const examName = String(marksheet?.exam?.name || 'Exam').trim();
  const className = String(marksheet?.exam?.className || marksheet?.className || '').trim();
  const section = String(marksheet?.section || '').trim();
  const title = `${examName} results published`;
  const body = [
    `Results for ${examName}`,
    className ? `Class ${className}` : '',
    section ? `Section ${section}` : '',
    `${reportCardsGenerated} report card${reportCardsGenerated === 1 ? '' : 's'} generated.`
  ].filter(Boolean).join(' ');

  return Notification.create({
    kind: 'broadcast',
    scope: 'role',
    category: 'success',
    title,
    body,
    createdBy: userId,
    targetRoles: ['Student', 'Parent'],
    targetClass: className || undefined,
    targetSection: section || undefined
  });
}

function buildMarksheetExportHeaders(marksheet) {
  const headers = [
    { key: 'studentId', label: 'Student ID' },
    { key: 'studentName', label: 'Student Name' },
    { key: 'className', label: 'Class' },
    { key: 'section', label: 'Section' }
  ];

  for (const subject of marksheet.subjects || []) {
    const subjectId = String(subject?._id || subject || 'subject');
    const subjectName = String(subject?.name || subject?.subject?.name || subjectId || 'Subject').trim();
    headers.push({ key: `subjectMarks.${subjectId}.marks`, label: `${subjectName} Marks` });
    headers.push({ key: `subjectMarks.${subjectId}.grade`, label: `${subjectName} Grade` });
  }

  headers.push({ key: 'grPerformanceMarks', label: 'GR Marks' });
  headers.push({ key: 'teacherComments', label: 'Teacher Comments' });
  return headers;
}

function buildMarksheetExportRows(marksheet) {
  const subjectIds = (marksheet.subjects || []).map((subject) => String(subject?._id || subject));

  return (marksheet.studentRows || []).map((row) => {
    const subjectMarkMap = {};
    for (const subjectId of subjectIds) {
      const subjectMark = (row.subjectMarks || []).find((item) => String(item?.subject?._id || item?.subject) === subjectId);
      subjectMarkMap[subjectId] = {
        marks: subjectMark?.marks ?? '',
        grade: subjectMark ? calculateGrade(Number(subjectMark.marks || 0), 100) : ''
      };
    }

    return {
      studentId: row.student?.studentId || '',
      studentName: row.student?.user?.name || row.student?.firstName || '',
      className: row.student?.class || marksheet.className || '',
      section: row.student?.section || marksheet.section || '',
      subjectMarks: subjectMarkMap,
      grPerformanceMarks: row.grPerformanceMarks ?? '',
      teacherComments: row.teacherComments || ''
    };
  });
}

function normalizeCsvKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, '');
}

function resolveSubjectImportColumns(headers, subjects, allowedSubjectIds) {
  const normalizedSubjectMap = new Map();

  for (const subject of subjects || []) {
    const subjectId = String(subject?._id || subject);
    if (!allowedSubjectIds.has(subjectId)) continue;

    const subjectName = String(subject?.name || '').trim();
    if (!subjectName) continue;

    normalizedSubjectMap.set(normalizeCsvKey(`${subjectName} marks`), subjectId);
    normalizedSubjectMap.set(normalizeCsvKey(subjectName), subjectId);
    normalizedSubjectMap.set(normalizeCsvKey(`subject ${subjectId}`), subjectId);
  }

  const cols = [];
  for (let i = 0; i < headers.length; i += 1) {
    const normalizedHeader = normalizeCsvKey(headers[i]);
    const subjectId = normalizedSubjectMap.get(normalizedHeader);
    if (!subjectId) continue;
    cols.push({ index: i, subjectId });
  }
  return cols;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  const flushCell = () => {
    row.push(cell);
    cell = '';
  };

  const flushRow = () => {
    flushCell();
    if (row.some((col) => String(col || '').trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ',') {
      flushCell();
      continue;
    }

    if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && next === '\n') i += 1;
      flushRow();
      continue;
    }

    cell += ch;
  }

  if (cell.length > 0 || row.length > 0) {
    flushRow();
  }

  return rows;
}

module.exports = {
  listMarksheets,
  getMarksheetDetail,
  updateStudentMarks,
  updateGRMarks,
  updateTeacherComments,
  lockMarksheet,
  unlockMarksheet,
  publishMarksheet,
  importMarksheetCsv,
  exportMarksheetCsv,
  exportMarksheetPdf
};
