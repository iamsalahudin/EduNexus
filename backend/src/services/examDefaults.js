const { ExamConfig, SchoolClass } = require('../models');

function resolveAcademicYear(preset, startMonth) {
  const p = preset || 'jan-dec';
  if (p === 'apr-mar') return { preset: p, startMonth: 4, endMonth: 3 };
  if (p === 'sep-aug') return { preset: p, startMonth: 9, endMonth: 8 };
  if (p === 'custom') {
    const sm = Math.min(12, Math.max(1, Number(startMonth) || 1));
    const em = sm === 1 ? 12 : sm - 1;
    return { preset: p, startMonth: sm, endMonth: em };
  }
  return { preset: 'jan-dec', startMonth: 1, endMonth: 12 };
}

async function ensureDefaultExamConfigForClass(className, userId) {
  const name = String(className || '').trim();
  if (!name) return null;

  const existing = await ExamConfig.findOne({ className: name }).select('_id').lean();
  if (existing?._id) return existing;

  const academicYear = resolveAcademicYear('jan-dec');

  const config = await ExamConfig.create({
    className: name,
    academicYear,
    examTypes: {
      monthly: { enabled: true, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
      mid: { enabled: true },
      final: { enabled: true }
    },
    structure: {
      subjectWiseMarks: true,
      theoryPracticalSplit: false,
      defaultMaxMarks: 100,
      defaultPassingMarks: 33,
      overallPassPercentage: 33,
      gradingSystem: 'marks',
      weightage: { monthly: 20, mid: 30, final: 50 }
    },
    visibility: {
      studentVisibility: 'afterApproval',
      parentVisible: true,
      showSubjectMarks: true
    },
    createdBy: userId,
    updatedBy: userId
  });

  return { _id: config._id };
}

async function ensureDefaultExamConfigsForAllClasses(userId) {
  const classes = await SchoolClass.find({}).select('name').lean();
  for (const c of classes) {
    // best-effort loop
    // eslint-disable-next-line no-await-in-loop
    await ensureDefaultExamConfigForClass(c?.name, userId);
  }
}

module.exports = { ensureDefaultExamConfigForClass, ensureDefaultExamConfigsForAllClasses, resolveAcademicYear };
