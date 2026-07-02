/**
 * Export Job Processor
 * Processes background export jobs for PDF, ZIP, and other formats
 */

const { exportQueue } = require('./exportQueue');
const { Homework, ReportCard, Student, Subject, Teacher, User } = require('../models');
const PDFDocument = require('pdfkit');
const { PassThrough } = require('stream');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads/exports');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate PDF buffer for a single report card
 */
async function generateReportCardPdf(rc) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Simple PDF layout
    doc.fontSize(18).font('Helvetica-Bold').text('Report Card', { align: 'center' });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica');
    doc.text(`Student: ${rc.studentName || '—'}`, { underline: true });
    doc.text(`Class: ${rc.class || '—'}`);
    doc.text(`Section: ${rc.section || '—'}`);
    doc.text(`Period: ${rc.term || '—'} ${rc.year || '—'}`);
    doc.moveDown();

    // Subjects table
    if (Array.isArray(rc.subjects) && rc.subjects.length > 0) {
      doc.fontSize(10).font('Helvetica-Bold').text('Subjects', { underline: true });
      doc.moveDown(0.3);

      rc.subjects.forEach((subject) => {
        const line = `${subject.name || '—'}: ${subject.marks || 0}/100 (Grade: ${subject.grade || '—'})`;
        doc.fontSize(9).font('Helvetica').text(line);
      });
    }

    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').text(`Total Marks: ${rc.totalMarks || 0}`);
    doc.text(`Percentage: ${rc.percentage || 0}%`);
    if (rc.remarks) {
      doc.moveDown();
      doc.fontSize(10).font('Helvetica-Bold').text('Remarks:');
      doc.fontSize(9).font('Helvetica').text(rc.remarks);
    }

    doc.end();
  });
}

/**
 * Process report card export job
 */
async function processReportCardExport(job) {
  try {
    const { format, studentIds, term, year, userId } = job.data;
    job.progress(10);

    // Build filter
    const filter = { status: 'published' };
    if (term) filter.term = term;
    if (year) filter.year = year;
    if (studentIds && studentIds.length > 0) {
      filter.student = { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    // Fetch report cards
    const reportCards = await ReportCard.find(filter)
      .populate('student', 'firstName lastName studentId class section')
      .populate('subjects.subject', 'name code')
      .lean();

    job.progress(20);

    if (!reportCards || reportCards.length === 0) {
      return {
        format,
        filename: `report-cards-empty-${Date.now()}.pdf`,
        filePath: null,
        message: 'No report cards found for export'
      };
    }

    let filePath;
    let filename;

    if (format === 'pdf') {
      // Combine all PDFs into one
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      let pageCount = 0;

      for (let i = 0; i < reportCards.length; i++) {
        if (i > 0) doc.addPage();

        const rc = reportCards[i];
        const student = rc.student || {};

        doc.fontSize(16).font('Helvetica-Bold').text('Report Card', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica');
        doc.text(`Student: ${student.firstName || '—'} ${student.lastName || '—'}`);
        doc.text(`Student ID: ${student.studentId || '—'}`);
        doc.text(`Class: ${student.class || '—'}`);
        doc.text(`Section: ${student.section || '—'}`);
        doc.text(`Term: ${rc.term || '—'}, Year: ${rc.year || '—'}`);
        doc.moveDown(0.5);

        // Subjects
        if (Array.isArray(rc.subjects) && rc.subjects.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').text('Marks & Grades:');
          rc.subjects.forEach((s) => {
            const subject = s.subject || {};
            doc.fontSize(9).font('Helvetica').text(
              `${subject.name || '—'}: ${s.marks || 0}/100 → Grade ${s.grade || '—'}`
            );
          });
        }

        doc.moveDown(0.3);
        doc.fontSize(10).font('Helvetica-Bold').text(`Total: ${rc.totalMarks || 0} | Percentage: ${rc.percentage || 0}%`);

        if (rc.remarks) {
          doc.moveDown(0.2);
          doc.fontSize(9).font('Helvetica-Bold').text('Remarks:', { underline: true });
          doc.fontSize(8).font('Helvetica').text(rc.remarks);
        }

        pageCount++;
        job.progress(20 + ((i / reportCards.length) * 60));
      }

      filename = `report-cards-${Date.now()}.pdf`;
      filePath = path.join(uploadsDir, filename);
      await new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      });
    } else if (format === 'zip') {
      // Create ZIP with individual student PDFs using streaming and limited concurrency
      const archiver = require('archiver');
      filename = `report-cards-${Date.now()}.zip`;
      filePath = path.join(uploadsDir, filename);

      const output = fs.createWriteStream(filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      // Helper: create a readable stream for a single report card PDF
      function generateReportCardPdfStream(rc) {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const pass = new PassThrough();

        // Pipe PDF document into the PassThrough so archiver can consume it
        doc.pipe(pass);

        // Fill PDF content
        doc.fontSize(18).font('Helvetica-Bold').text('Report Card', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).font('Helvetica');
        doc.text(`Student: ${rc.studentName || '—'}`, { underline: true });
        doc.text(`Class: ${rc.class || '—'}`);
        doc.text(`Section: ${rc.section || '—'}`);
        doc.text(`Period: ${rc.term || '—'} ${rc.year || '—'}`);
        doc.moveDown();

        if (Array.isArray(rc.subjects) && rc.subjects.length > 0) {
          doc.fontSize(10).font('Helvetica-Bold').text('Subjects', { underline: true });
          doc.moveDown(0.3);
          rc.subjects.forEach((subject) => {
            const line = `${subject.name || '—'}: ${subject.marks || 0}/100 (Grade: ${subject.grade || '—'})`;
            doc.fontSize(9).font('Helvetica').text(line);
          });
        }

        doc.moveDown();
        doc.fontSize(10).font('Helvetica-Bold').text(`Total Marks: ${rc.totalMarks || 0}`);
        doc.text(`Percentage: ${rc.percentage || 0}%`);
        if (rc.remarks) {
          doc.moveDown();
          doc.fontSize(10).font('Helvetica-Bold').text('Remarks:');
          doc.fontSize(9).font('Helvetica').text(rc.remarks);
        }

        // Finalize PDF (this will end the PassThrough stream)
        doc.end();

        const finished = new Promise((resolve, reject) => {
          pass.on('end', resolve);
          pass.on('error', reject);
          doc.on('error', reject);
        });

        return { stream: pass, finished };
      }

      await new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        archive.pipe(output);

        const concurrency = Math.min(4, Math.max(1, reportCards.length));
        let index = 0;
        let active = 0;

        function scheduleNext() {
          // If all items scheduled and none active, finalize
          if (index >= reportCards.length && active === 0) {
            archive.finalize();
            return;
          }

          while (active < concurrency && index < reportCards.length) {
            const processed = index;
            const rc = reportCards[processed];
            const student = rc.student || {};

            const pdfInput = {
              studentName: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
              class: student.class,
              section: student.section,
              term: rc.term,
              year: rc.year,
              subjects: (Array.isArray(rc.subjects) ? rc.subjects : []).map((s) => ({
                name: s.subject?.name || '—',
                marks: s.marks,
                grade: s.grade
              })),
              totalMarks: rc.totalMarks,
              percentage: rc.percentage,
              remarks: rc.remarks
            };

            const { stream: pdfStream, finished } = generateReportCardPdfStream(pdfInput);
            const entryName = `${student.studentId || `student-${processed}`}.pdf`;
            archive.append(pdfStream, { name: entryName });

            active++;
            index++;

            finished.then(() => {
              active--;
              job.progress(20 + (((processed + 1) / reportCards.length) * 60));
              scheduleNext();
            }).catch(reject);
          }
        }

        // Start scheduling
        scheduleNext();
      });
    }

    job.progress(90);

    return {
      format,
      filename,
      filePath,
      message: `Successfully exported ${reportCards.length} report cards`,
      count: reportCards.length
    };
  } catch (error) {
    logger.error('Report card export job failed:', error);
    throw error;
  }
}

/**
 * Process homework submission export job
 */
async function processHomeworkExport(job) {
  // TODO: Implement homework export processing
  throw new Error('Homework export not yet implemented');
}

// Register job processor
exportQueue.process('report-cards', async (job) => {
  return processReportCardExport(job);
});

exportQueue.process('homework', async (job) => {
  return processHomeworkExport(job);
});

module.exports = {
  processReportCardExport,
  processHomeworkExport
};
