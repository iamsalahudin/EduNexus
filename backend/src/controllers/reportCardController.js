const { ReportCard, Student, Subject } = require('../models');
const { calculateGrade, calculateTotals } = require('../utils/grading');
const mongoose = require('mongoose');

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
    const { studentId, term, year, status } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};
    if (term) filter.term = term;
    if (year) filter.year = parseInt(year, 10);
    if (status) filter.status = status;

    // Role-based filtering
    if (userRole === 'Teacher') {
      filter.createdBy = new mongoose.Types.ObjectId(userId);
    } else if (userRole === 'Student') {
      const student = await Student.findOne({ _id: userId });
      if (!student) return res.status(404).json({ error: 'Student record not found' });
      filter.student = student._id;
      filter.status = 'published'; // Students see only published reports
    } else if (userRole === 'Parent') {
      const children = await Student.find({ parents: userId });
      const childIds = children.map((c) => c._id);
      filter.student = { $in: childIds };
      filter.status = 'published';
    } else if (['Admin', 'Principal'].includes(userRole)) {
      if (studentId) filter.student = new mongoose.Types.ObjectId(studentId);
    }

    const reportCards = await ReportCard.find(filter)
      .populate('student', 'firstName lastName studentId class')
      .populate('subjects.subject', 'name code')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ year: -1, term: -1 });

    res.json({ reportCards });
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

    // Access control: only teacher, principal, student, or parent can view
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'Teacher' && reportCard.createdBy._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (userRole === 'Student' && reportCard.student._id.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (userRole === 'Parent') {
      const isParent = await Student.findOne({ _id: reportCard.student._id, parents: userId });
      if (!isParent) return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ reportCard });
  } catch (err) {
    next(err);
  }
}

module.exports = { createUpdateReportCard, getReportCards, approveReportCard, rejectReportCard, getReportCard };
