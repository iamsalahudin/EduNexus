const { Attendance, Homework, ExamMark, ExamConfig, Exam } = require('../models');

/**
 * Resolve the academic year boundaries for a given class
 * Used to determine attendance window for different exam types
 */
async function resolveAcademicYearBoundaries(className) {
  try {
    const config = await ExamConfig.findOne({ className }).select('academicYear').lean();
    if (!config || !config.academicYear) {
      return { startMonth: 1, endMonth: 12, yearLabel: new Date().getFullYear().toString() };
    }
    return config.academicYear;
  } catch (err) {
    console.error('Error resolving academic year:', err.message);
    return { startMonth: 1, endMonth: 12 };
  }
}

/**
 * Get the attendance percentage for a student during the exam window
 * Window varies by exam type:
 * - monthly: same calendar month
 * - mid: academic year start to exam date
 * - final: full academic year
 */
async function getAttendancePercentage(studentId, exam) {
  try {
    if (!exam || !studentId) return 50; // Default if missing data

    const examDate = exam.subjects?.[0]?.date ? new Date(exam.subjects[0].date) : null;
    if (!examDate) return 50;

    const classYear = Number(exam.year) || new Date().getFullYear();
    const yearBoundaries = await resolveAcademicYearBoundaries(exam.className);

    let startDate, endDate;

    switch (exam.type) {
      case 'monthly':
        // Same calendar month
        startDate = new Date(classYear, examDate.getMonth(), 1);
        endDate = new Date(classYear, examDate.getMonth() + 1, 0);
        break;

      case 'mid':
        // Academic year start to exam date
        {
          const startMonth = yearBoundaries.startMonth || 1;
          const startYear = startMonth <= examDate.getMonth() + 1 ? classYear : classYear - 1;
          startDate = new Date(startYear, startMonth - 1, 1);
          endDate = new Date(examDate);
        }
        break;

      case 'final':
      default:
        // Full academic year
        {
          const startMonth = yearBoundaries.startMonth || 1;
          const endMonth = yearBoundaries.endMonth || 12;
          const startYear = startMonth <= examDate.getMonth() + 1 ? classYear : classYear - 1;
          const endYear = endMonth < examDate.getMonth() + 1 ? classYear : classYear + 1;
          startDate = new Date(startYear, startMonth - 1, 1);
          endDate = new Date(endYear, endMonth, 0);
        }
        break;
    }

    // Query attendance records in the window
    const attended = await Attendance.countDocuments({
      student: studentId,
      date: { $gte: startDate, $lte: endDate },
      isPresent: true
    });

    const total = await Attendance.countDocuments({
      student: studentId,
      date: { $gte: startDate, $lte: endDate }
    });

    if (total === 0) return 0;
    return (attended / total) * 100;
  } catch (err) {
    console.error('Error computing attendance percentage:', err.message);
    return 0;
  }
}

/**
 * Get the homework performance percentage for a student
 * Source: graded homework in the same term as the exam
 */
async function getHomeworkPercentage(studentId, exam) {
  try {
    if (!exam || !studentId) return 50; // Default if missing data

    const examDate = exam.subjects?.[0]?.date ? new Date(exam.subjects[0].date) : null;
    if (!examDate) return 50;

    const classYear = Number(exam.year) || new Date().getFullYear();
    const yearBoundaries = await resolveAcademicYearBoundaries(exam.className);

    // Determine term window (simplified: same academic year)
    const termStart = new Date(classYear, (yearBoundaries.startMonth || 1) - 1, 1);
    const termEnd = new Date(classYear, (yearBoundaries.endMonth || 12), 0);

    // Get graded homework submissions
    const homeworkSubmissions = await Homework.find({
      student: studentId,
      createdAt: { $gte: termStart, $lte: termEnd },
      marksObtained: { $exists: true, $ne: null }
    })
      .select('marksObtained totalMarks')
      .lean();

    if (homeworkSubmissions.length === 0) return 0;

    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    for (const hw of homeworkSubmissions) {
      totalMarksObtained += hw.marksObtained || 0;
      totalMaxMarks += hw.totalMarks || 100;
    }

    if (totalMaxMarks === 0) return 0;
    return (totalMarksObtained / totalMaxMarks) * 100;
  } catch (err) {
    console.error('Error computing homework percentage:', err.message);
    return 0;
  }
}

/**
 * Compute exam marks percentage for a student
 * Source: ExamMark records for the exam
 */
async function getExamPercentage(studentId, examId) {
  try {
    if (!studentId || !examId) return 0;

    const exam = await Exam.findById(examId)
      .select('subjects')
      .lean();

    if (!exam || !Array.isArray(exam.subjects) || exam.subjects.length === 0) {
      return 0;
    }

    // Get marks for all subjects in this exam
    const marks = await ExamMark.find({
      exam: examId,
      student: studentId
    })
      .select('marks')
      .lean();

    let totalMarksObtained = 0;
    let totalMaxMarks = 0;

    // Sum across all subjects
    for (const mark of marks) {
      totalMarksObtained += mark.marks || 0;
    }

    for (const subj of exam.subjects) {
      totalMaxMarks += subj.maxMarks || 0;
    }

    if (totalMaxMarks === 0) return 0;
    return (totalMarksObtained / totalMaxMarks) * 100;
  } catch (err) {
    console.error('Error computing exam percentage:', err.message);
    return 0;
  }
}

/**
 * Compute General Report (GR) marks percentage
 * Source: GR performance marks from marksheet divided by exam GR max marks
 */
async function getGRPercentage(grPerformanceMarks, grMaxMarks) {
  try {
    const marks = Number(grPerformanceMarks) || 0;
    const maxMarks = Number(grMaxMarks) || 100;

    if (maxMarks <= 0) return 0;
    return (marks / maxMarks) * 100;
  } catch (err) {
    console.error('Error computing GR percentage:', err.message);
    return 0;
  }
}

/**
 * Compute final weighted result percentage
 * Combines exam, attendance, homework, and GR components based on exam weights
 */
async function computeWeightedResult({
  studentId,
  examId,
  grPerformanceMarks,
  grMaxMarks,
  resultWeights
}) {
  try {
    const exam = await Exam.findById(examId).lean();
    if (!exam) return 0;

    // Get component percentages
    const examPct = await getExamPercentage(studentId, examId);
    const attendancePct = await getAttendancePercentage(studentId, exam);
    const homeworkPct = await getHomeworkPercentage(studentId, exam);
    const grPct = await getGRPercentage(grPerformanceMarks, grMaxMarks);

    const weights = resultWeights || exam.resultWeights || {
      exam: 40,
      attendance: 20,
      homework: 20,
      gr: 20
    };

    // Compute weighted result
    const weighted =
      (examPct * (weights.exam || 0)) / 100 +
      (attendancePct * (weights.attendance || 0)) / 100 +
      (homeworkPct * (weights.homework || 0)) / 100 +
      (grPct * (weights.gr || 0)) / 100;

    return Math.round(weighted * 100) / 100; // Round to 2 decimals
  } catch (err) {
    console.error('Error computing weighted result:', err.message);
    return 0;
  }
}

/**
 * Validate that weights sum to 100
 */
function validateWeights(weights) {
  if (!weights) return { valid: true };

  const sum = (weights.exam || 0) + (weights.attendance || 0) + (weights.homework || 0) + (weights.gr || 0);

  if (Math.abs(sum - 100) > 0.01) {
    return { valid: false, error: `Weights must sum to 100 (current: ${sum})`, sum };
  }

  return { valid: true, sum };
}

module.exports = {
  getAttendancePercentage,
  getHomeworkPercentage,
  getExamPercentage,
  getGRPercentage,
  computeWeightedResult,
  validateWeights,
  resolveAcademicYearBoundaries
};
