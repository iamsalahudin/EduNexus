const { ReportCard, Student, Subject } = require('../models');
const { calculateGrade, calculateTotals } = require('../utils/grading');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

async function resolveStudentForUser(userId) {
  return Student.findOne({ user: userId }).select('_id').lean();
}

function decorateReportCard(reportCardDoc) {
  const reportCard = typeof reportCardDoc.toObject === 'function'
    ? reportCardDoc.toObject()
    : reportCardDoc;

  const percentage = Number(reportCard?.percentage || 0);
  const subjectRemarks = Array.isArray(reportCard?.subjects)
    ? reportCard.subjects.find((s) => s?.remarks)
    : null;

  return {
    ...reportCard,
    subject: reportCard.subject || 'Overall Result',
    exam: reportCard.exam || {
      name: reportCard.term,
      className: reportCard?.student?.class
    },
    grade: reportCard.grade || calculateGrade(percentage, 100),
    comments: reportCard.comments || subjectRemarks?.remarks || '',
    publishedAt: reportCard.publishedAt || reportCard.approvedAt || reportCard.updatedAt
  };
}

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (~crc) >>> 0;
}

function dosDateTime(date = new Date()) {
  const year = Math.max(date.getFullYear(), 1980);
  const dosTime = ((date.getHours() & 0x1f) << 11)
    | ((date.getMinutes() & 0x3f) << 5)
    | ((Math.floor(date.getSeconds() / 2)) & 0x1f);
  const dosDate = (((year - 1980) & 0x7f) << 9)
    | (((date.getMonth() + 1) & 0x0f) << 5)
    | (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

function buildZipBuffer(entries) {
  const chunks = [];
  const centralDirectory = [];
  let offset = 0;
  const now = new Date();
  const { dosTime, dosDate } = dosDateTime(now);

  entries.forEach((entry) => {
    const fileName = Buffer.from(entry.name);
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    const crc = crc32(data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(fileName.length, 26);
    localHeader.writeUInt16LE(0, 28);

    chunks.push(localHeader, fileName, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(fileName.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralDirectory.push(centralHeader, fileName);
    offset += localHeader.length + fileName.length + data.length;
  });

  const centralSize = centralDirectory.reduce((sum, buf) => sum + buf.length, 0);
  const centralOffset = chunks.reduce((sum, buf) => sum + buf.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, ...centralDirectory, end]);
}

// Teacher: Create or update report card with marks for a student
async function createUpdateReportCard(req, res, next) {
  try {
    const { studentId, term, year, subjects } = req.body;
    if (!studentId || !term || !year || !subjects) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Calculate totals and auto-grade
    const { totalMarks, percentage } = calculateTotals(subjects);
    const processedSubjects = subjects.map((s) => ({
      subject: s.subject,
      marks: s.marks,
      grade: calculateGrade(s.marks, 100),
      remarks: s.remarks || ''
    }));

    // Upsert report card (draft status)
    const reportCard = await ReportCard.findOneAndUpdate(
      { student: studentId, term, year },
      {
        student: studentId,
        term,
        year,
        subjects: processedSubjects,
        totalMarks,
        percentage,
        status: 'draft',
        createdBy: req.user.id
      },
      { upsert: true, new: true }
    ).populate('subjects.subject', 'name code');

    res.status(201).json({ reportCard });
  } catch (err) {
    next(err);
  }
}

// Get report cards (filtered by role)
async function getReportCards(req, res, next) {
  try {
    const { studentId, term, year, status, includeArchived } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    const canManageArchived = ['Admin', 'Principal'].includes(userRole);
    const showArchived = includeArchived === 'true' && canManageArchived;

    let filter = {};
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year, 10);
    if (status) filter.status = status;
    if (!showArchived) filter.archived = { $ne: true };

    // Role-based filtering
    if (userRole === 'Teacher') {
      filter.createdBy = new mongoose.Types.ObjectId(userId);
    } else if (userRole === 'Student') {
      const student = await resolveStudentForUser(userId);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      filter.student = student._id;
      filter.status = 'published'; // Students see only published reports
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: userId });
      const childIds = children.map((c) => c._id);
      if (studentId && !childIds.some((id) => String(id) === String(studentId))) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      filter.student = { $in: childIds };
      if (studentId) filter.student = new mongoose.Types.ObjectId(studentId);
      filter.status = 'published';
    } else if (['Admin', 'Principal'].includes(userRole)) {
      if (studentId) filter.student = new mongoose.Types.ObjectId(studentId);
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const reportCards = await ReportCard.find(filter)
      .populate('student', 'firstName lastName studentId class')
      .populate('subjects.subject', 'name code')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ year: -1, term: -1 });

    res.json({ reportCards: reportCards.map(decorateReportCard) });
  } catch (err) {
    next(err);
  }
}

// Principal: Approve report card
async function approveReportCard(req, res, next) {
  try {
    const reportCard = await ReportCard.findById(req.params.id);
    if (!reportCard) return res.status(404).json({ error: 'Not found' });
    if (reportCard.status === 'published') {
      return res.status(400).json({ error: 'Already published' });
    }

    reportCard.approvedBy = req.user.id;
    reportCard.approvedAt = new Date();
    reportCard.status = 'published';
    await reportCard.save();

    await reportCard.populate('student', 'firstName lastName');
    res.json({ reportCard });
  } catch (err) {
    next(err);
  }
}

// Reject report card (send back to teacher for corrections)
async function rejectReportCard(req, res, next) {
  try {
    const { remarks } = req.body;
    const reportCard = await ReportCard.findById(req.params.id);
    if (!reportCard) return res.status(404).json({ error: 'Not found' });

    reportCard.status = 'draft';
    reportCard.approvedBy = undefined;
    reportCard.approvedAt = undefined;
    if (remarks) {
      // Store rejection reason in remarks if needed (you can extend model for this)
      reportCard.subjects.forEach((s) => {
        if (!s.remarks) s.remarks = `Rejected: ${remarks}`;
      });
    }
    await reportCard.save();

    res.json({ reportCard });
  } catch (err) {
    next(err);
  }
}

// Get single report card details
async function getReportCard(req, res, next) {
  try {
    const reportCard = await ReportCard.findById(req.params.id)
      .populate('student', 'firstName lastName studentId class section')
      .populate('subjects.subject', 'name code teacher')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!reportCard) return res.status(404).json({ error: 'Not found' });

    if (reportCard.archived && !['Admin', 'Principal'].includes(req.user.role)) {
      return res.status(404).json({ error: 'Not found' });
    }

    // Access control: only teacher, principal, student, or parent can view
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'Teacher' && reportCard.createdBy._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (userRole === 'Student') {
      const student = await resolveStudentForUser(userId);
      if (!student || reportCard.student._id.toString() !== student._id.toString()) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
    if (userRole === 'Parent') {
      const isParent = await Student.findOne({ _id: reportCard.student._id, parents: userId });
      if (!isParent) return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ reportCard: decorateReportCard(reportCard) });
  } catch (err) {
    next(err);
  }
}

async function archiveOldReportCards(req, res, next) {
  try {
    const userRole = req.user.role;
    if (!['Admin', 'Principal'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const yearsRaw = req.body?.years ?? req.query?.years;
    const yearsToKeep = Math.max(parseInt(yearsRaw || '3', 10) || 3, 1);
    const cutoffYear = new Date().getFullYear() - yearsToKeep;

    const result = await ReportCard.updateMany(
      {
        status: 'published',
        year: { $lte: cutoffYear },
        archived: { $ne: true }
      },
      {
        $set: {
          archived: true,
          archivedAt: new Date(),
          archivedBy: req.user.id
        }
      }
    );

    return res.json({
      ok: true,
      yearsToKeep,
      cutoffYear,
      archivedCount: result.modifiedCount || 0
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createUpdateReportCard,
  getReportCards,
  approveReportCard,
  rejectReportCard,
  getReportCard,
  archiveOldReportCards
};

// Export multiple report cards as a single multi-page PDF (Admin/Principal/Teacher)
async function exportReportCardsPdf(req, res, next) {
  try {
    const { studentId, term, year } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year, 10);
    if (studentId) filter.student = studentId;
    const studentIdsRaw = req.query.studentIds || req.query.studentIds;
    if (studentIdsRaw) {
      const ids = String(studentIdsRaw).split(',').map((s) => s.trim()).filter(Boolean).map((s) => new mongoose.Types.ObjectId(s));
      if (ids.length) filter.student = { $in: ids };
    }

    // Role-based access
    if (userRole === 'Teacher') {
      filter.createdBy = new mongoose.Types.ObjectId(userId);
    } else if (userRole === 'Student') {
      const student = await resolveStudentForUser(userId);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      if (studentId && String(student._id) !== String(studentId)) return res.status(403).json({ error: 'Forbidden' });
      filter.student = student._id;
      filter.status = 'published';
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: userId }).select('_id').lean();
      const childIds = children.map((c) => String(c._id));
      if (studentId && !childIds.includes(String(studentId))) return res.status(403).json({ error: 'Forbidden' });
      filter.student = studentId ? new mongoose.Types.ObjectId(studentId) : { $in: childIds };
      filter.status = 'published';
    } else if (!['Admin', 'Principal'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const reportCards = await ReportCard.find(filter)
      .populate('student', 'firstName lastName studentId class section')
      .populate('subjects.subject', 'name code')
      .sort({ year: -1, term: -1 })
      .lean();

    if (!reportCards || reportCards.length === 0) {
      return res.status(404).json({ error: 'No report cards found for the given filters' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report-cards.pdf"');

    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(res);

    const margin = 50;
    const pageWidth = 595.28; // A4 pt
    const usableWidth = pageWidth - margin * 2;

    function ensureSpace(height) {
      const bottom = doc.page.height - margin;
      if (doc.y + height > bottom) doc.addPage({ size: 'A4', margin });
    }

    function renderHeader(rc) {
      const student = rc.student || {};
      doc.fontSize(14).font('Helvetica-Bold').text(process.env.SCHOOL_NAME || 'School Name', { align: 'center' });
      doc.moveDown(0.25);
      doc.fontSize(10).font('Helvetica').text(`Report Card - ${rc.term || ''} ${rc.year || ''}`, { align: 'center' });
      doc.moveDown(0.5);

      const leftColX = margin;
      const rightColX = margin + usableWidth / 2 + 10;
      const startY = doc.y;

      doc.fontSize(10).text(`Name: ${student.firstName || ''} ${student.lastName || ''}`, leftColX, startY);
      doc.text(`Student ID: ${student.studentId || ''}`, leftColX, doc.y + 2);
      doc.text(`Class: ${student.class || ''} ${student.section || ''}`, leftColX, doc.y + 2);

      const createdBy = rc.createdBy ? (rc.createdBy.name || '') : '';
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, rightColX, startY);
      if (createdBy) doc.text(`By: ${createdBy}`, rightColX, doc.y + 2);

      doc.moveDown(1);
    }

    function renderSubjectsTable(rc) {
      const cols = [usableWidth * 0.45, usableWidth * 0.15, usableWidth * 0.15, usableWidth * 0.25];
      const headings = ['Subject', 'Marks', 'Grade', 'Remarks'];

      // table header
      ensureSpace(20 + 16);
      const startX = margin;
      let x = startX;
      doc.fontSize(10).font('Helvetica-Bold');
      for (let i = 0; i < headings.length; i++) {
        doc.text(headings[i], x + 2, doc.y, { width: cols[i], continued: false });
        x += cols[i];
      }
      doc.moveDown(0.5);
      doc.font('Helvetica');

      // rows
      rc.subjects.forEach((s) => {
        ensureSpace(16);
        let rowX = startX;
        const subjName = s.subject && s.subject.name ? s.subject.name : (s.subject || 'Unknown');
        doc.fontSize(10).text(subjName, rowX + 2, doc.y, { width: cols[0] });
        rowX += cols[0];
        doc.text(String(s.marks ?? '-'), rowX + 2, doc.y, { width: cols[1] });
        rowX += cols[1];
        doc.text(String(s.grade ?? '-'), rowX + 2, doc.y, { width: cols[2] });
        rowX += cols[2];
        doc.text(s.remarks || '', rowX + 2, doc.y, { width: cols[3] });
        doc.moveDown(0.5);
      });

      doc.moveDown(0.5);
    }

    reportCards.forEach((rc, idx) => {
      doc.addPage({ size: 'A4', margin });
      doc.y = margin;
      renderHeader(rc);
      doc.fontSize(12).font('Helvetica-Bold').text('Subjects & Marks');
      doc.moveDown(0.25);
      renderSubjectsTable(rc);

      ensureSpace(30);
      doc.fontSize(10).font('Helvetica-Bold').text(`Total Marks: ${rc.totalMarks ?? '-'}    Percentage: ${rc.percentage ?? '-'}%    Grade: ${rc.grade ?? '-'}`);
      doc.moveDown(0.5);
      if (rc.comments) {
        ensureSpace(40);
        doc.fontSize(10).font('Helvetica').text(`Comments: ${rc.comments}`);
      }

      // footer
      ensureSpace(20);
      doc.fontSize(9).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'right' });
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

// append export function to exports
module.exports.exportReportCardsPdf = exportReportCardsPdf;

// Generate a PDF buffer for a single report card
function generatePdfBuffer(rc) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: false });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (e) => reject(e));

      const margin = 50;
      const pageWidth = 595.28; // A4
      const usableWidth = pageWidth - margin * 2;

      function ensureSpace(height) {
        const bottom = doc.page.height - margin;
        if (doc.y + height > bottom) doc.addPage({ size: 'A4', margin });
      }

      function renderHeader() {
        const student = rc.student || {};
        doc.addPage({ size: 'A4', margin });
        doc.fontSize(14).font('Helvetica-Bold').text(process.env.SCHOOL_NAME || 'School Name', { align: 'center' });
        doc.moveDown(0.25);
        doc.fontSize(10).font('Helvetica').text(`Report Card - ${rc.term || ''} ${rc.year || ''}`, { align: 'center' });
        doc.moveDown(0.5);

        const leftColX = margin;
        const rightColX = margin + usableWidth / 2 + 10;
        const startY = doc.y;

        doc.fontSize(10).text(`Name: ${student.firstName || ''} ${student.lastName || ''}`, leftColX, startY);
        doc.text(`Student ID: ${student.studentId || ''}`, leftColX, doc.y + 2);
        doc.text(`Class: ${student.class || ''} ${student.section || ''}`, leftColX, doc.y + 2);

        doc.text(`Generated: ${new Date().toLocaleDateString()}`, rightColX, startY);
        doc.moveDown(1);
      }

      function renderSubjectsTable() {
        const cols = [usableWidth * 0.45, usableWidth * 0.15, usableWidth * 0.15, usableWidth * 0.25];
        const headings = ['Subject', 'Marks', 'Grade', 'Remarks'];

        ensureSpace(20 + 16);
        const startX = margin;
        let x = startX;
        doc.fontSize(10).font('Helvetica-Bold');
        for (let i = 0; i < headings.length; i++) {
          doc.text(headings[i], x + 2, doc.y, { width: cols[i], continued: false });
          x += cols[i];
        }
        doc.moveDown(0.5);
        doc.font('Helvetica');

        rc.subjects.forEach((s) => {
          ensureSpace(16);
          let rowX = startX;
          const subjName = s.subject && s.subject.name ? s.subject.name : (s.subject || 'Unknown');
          doc.fontSize(10).text(subjName, rowX + 2, doc.y, { width: cols[0] });
          rowX += cols[0];
          doc.text(String(s.marks ?? '-'), rowX + 2, doc.y, { width: cols[1] });
          rowX += cols[1];
          doc.text(String(s.grade ?? '-'), rowX + 2, doc.y, { width: cols[2] });
          rowX += cols[2];
          doc.text(s.remarks || '', rowX + 2, doc.y, { width: cols[3] });
          doc.moveDown(0.5);
        });

        doc.moveDown(0.5);
      }

      renderHeader();
      doc.fontSize(12).font('Helvetica-Bold').text('Subjects & Marks');
      doc.moveDown(0.25);
      renderSubjectsTable();

      doc.fontSize(10).font('Helvetica-Bold').text(`Total Marks: ${rc.totalMarks ?? '-'}    Percentage: ${rc.percentage ?? '-'}%    Grade: ${rc.grade ?? '-'}`);
      doc.moveDown(0.5);
      if (rc.comments) doc.fontSize(10).font('Helvetica').text(`Comments: ${rc.comments}`);

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

// Export per-student PDFs as a ZIP
async function exportReportCardsZip(req, res, next) {
  try {
    const { studentId, term, year } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year, 10);
    if (studentId) filter.student = studentId;
    const studentIdsRaw = req.query.studentIds || req.query.studentIds;
    if (studentIdsRaw) {
      const ids = String(studentIdsRaw).split(',').map((s) => s.trim()).filter(Boolean).map((s) => new mongoose.Types.ObjectId(s));
      if (ids.length) filter.student = { $in: ids };
    }

    if (userRole === 'Teacher') {
      filter.createdBy = new mongoose.Types.ObjectId(userId);
    } else if (userRole === 'Student') {
      const student = await resolveStudentForUser(userId);
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      if (studentId && String(student._id) !== String(studentId)) return res.status(403).json({ error: 'Forbidden' });
      filter.student = student._id;
      filter.status = 'published';
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: userId }).select('_id').lean();
      const childIds = children.map((c) => String(c._id));
      if (studentId && !childIds.includes(String(studentId))) return res.status(403).json({ error: 'Forbidden' });
      filter.student = studentId ? new mongoose.Types.ObjectId(studentId) : { $in: childIds };
      filter.status = 'published';
    } else if (!['Admin', 'Principal'].includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const reportCards = await ReportCard.find(filter)
      .populate('student', 'firstName lastName studentId class section')
      .populate('subjects.subject', 'name code')
      .sort({ year: -1, term: -1 })
      .lean();

    if (!reportCards || reportCards.length === 0) {
      return res.status(404).json({ error: 'No report cards found for the given filters' });
    }

    const entries = [];

    for (const rc of reportCards) {
      const buf = await generatePdfBuffer(rc);
      const student = rc.student || {};
      const filename = `${student.studentId || (student._id || 'student')}.pdf`;
      entries.push({ name: filename, data: buf });
    }

    const zipBuffer = buildZipBuffer(entries);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="report-cards.zip"');
    res.send(zipBuffer);
  } catch (err) {
    next(err);
  }
}

module.exports.exportReportCardsZip = exportReportCardsZip;
