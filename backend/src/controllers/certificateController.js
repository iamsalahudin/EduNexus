const fs = require('fs');
const path = require('path');
const { Student, StudentCertificate } = require('../models');
const { renderCertificatePdf } = require('../services/certificatePdfService');

function asValidDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function sanitizeFilePart(value, fallback = 'file') {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned || fallback;
}

async function nextCertificateNumber(type, issueDate) {
  const year = issueDate.getFullYear();
  const prefix = type === 'transfer' ? 'TC' : 'SLC';

  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

  const count = await StudentCertificate.countDocuments({
    type,
    issueDate: { $gte: start, $lt: end }
  });

  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
}

async function generateCertificate(req, res, next) {
  try {
    const body = req.body || {};
    const type = String(body.type || '').trim().toLowerCase();
    const studentId = String(body.studentId || '').trim();
    const markAsAlumni = body.markAsAlumni === true;

    const issueDate = asValidDate(body.issueDate) || new Date();
    const leavingDate = type === 'slc' ? asValidDate(body.leavingDate) || issueDate : null;

    const student = await Student.findById(studentId).populate('user', 'name');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    
    // Mark student as alumni and deactivate user if requested
    if (markAsAlumni) {
      student.status = 'alumni';
      await student.save();
      
      if (student.user && student.user._id) {
        const { User } = require('../models');
        await User.findByIdAndUpdate(student.user._id, { active: false });
      }
    }
    
    // Re-fetch as lean for further processing
    const studentLean = await Student.findById(studentId).populate('user', 'name').lean();

    
    const certificateNumber = await nextCertificateNumber(type, issueDate);
    const studentName = String(studentLean?.user?.name || '').trim() || 'Student';

    const details = {
      reason: String(body.reason || '').trim(),
      remarks: String(body.remarks || '').trim(),
      conduct: type === 'slc' ? String(body.conduct || 'Good').trim() : undefined,
      leavingDate: leavingDate || undefined
    };

    const studentSnapshot = {
      userName: studentName,
      studentId: String(studentLean.studentId || ''),
      registrationNumber: String(studentLean.registrationNumber || ''),
      class: String(studentLean.class || ''),
      section: String(studentLean.section || '')
    };

    const fileName = `${sanitizeFilePart(certificateNumber)}-${sanitizeFilePart(studentLean.studentId || studentLean._id)}.pdf`;
    const relativePath = path.join('certificates', String(issueDate.getFullYear()), type, fileName);
    const absolutePath = path.resolve(process.cwd(), 'uploads', relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

    await renderCertificatePdf({
      filePath: absolutePath,
      type,
      certificateNumber,
      issueDate,
      studentSnapshot,
      details,
      issuedByName: req.user?.name
    });

    const stat = fs.statSync(absolutePath);

    const certificate = await StudentCertificate.create({
      type,
      certificateNumber,
      student: studentLean._id,
      issuedBy: req.user.id,
      issueDate,
      studentSnapshot,
      data: details,
      pdf: {
        fileName,
        relativePath: relativePath.replace(/\\/g, '/'),
        mimeType: 'application/pdf',
        fileSizeBytes: stat.size
      }
    });

    res.status(201).json({
      certificate,
      downloadUrl: `/api/certificates/${certificate._id}/pdf`
    });
  } catch (err) {
    next(err);
  }
}

async function listStudentCertificates(req, res, next) {
  try {
    const studentId = String(req.params.studentId || '').trim();
    const type = String(req.query.type || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 100);

    const filter = { student: studentId };
    if (type) filter.type = type;

    const certificates = await StudentCertificate.find(filter)
      .populate('issuedBy', 'name username role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ certificates });
  } catch (err) {
    next(err);
  }
}

async function listRecentCertificates(req, res, next) {
  try {
    const type = String(req.query.type || '').trim();
    const limit = Math.min(parseInt(req.query.limit || '10', 10) || 10, 100);

    const filter = {};
    if (type) filter.type = type;

    const certificates = await StudentCertificate.find(filter)
      .populate('issuedBy', 'name username role')
      .populate({
        path: 'student',
        select: 'studentId registrationNumber class section user',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ certificates });
  } catch (err) {
    next(err);
  }
}

async function getCertificate(req, res, next) {
  try {
    const certificate = await StudentCertificate.findById(req.params.certificateId)
      .populate('issuedBy', 'name username role')
      .populate('student', 'studentId registrationNumber class section')
      .lean();

    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ certificate });
  } catch (err) {
    next(err);
  }
}

async function downloadCertificatePdf(req, res, next) {
  try {
    const certificate = await StudentCertificate.findById(req.params.certificateId).lean();
    if (!certificate) return res.status(404).json({ error: 'Certificate not found' });

    const absolutePath = path.resolve(process.cwd(), 'uploads', certificate.pdf.relativePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'Certificate PDF file is missing from storage' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.pdf.fileName}"`);

    const stream = fs.createReadStream(absolutePath);
    stream.on('error', next);
    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generateCertificate,
  listStudentCertificates,
  listRecentCertificates,
  getCertificate,
  downloadCertificatePdf
};
