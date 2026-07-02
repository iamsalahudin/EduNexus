const fs = require('fs');
const PDFDocument = require('pdfkit');

function formatDisplayDate(value) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
}

function drawField(doc, label, value, x, y, width) {
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor('#0f172a')
    .text(label, x, y, { width: 150, continued: false });

  doc
    .font('Helvetica')
    .fontSize(11)
    .fillColor('#111827')
    .text(String(value || '-'), x + 155, y, { width: width - 155 });

  doc
    .moveTo(x, y + 19)
    .lineTo(x + width, y + 19)
    .lineWidth(0.7)
    .strokeColor('#d1d5db')
    .stroke();
}

async function renderCertificatePdf({
  filePath,
  type,
  certificateNumber,
  issueDate,
  studentSnapshot,
  details,
  issuedByName
}) {
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 36, left: 46, right: 46, bottom: 36 } });
    const stream = fs.createWriteStream(filePath);

    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
    doc.pipe(stream);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentLeft = 56;
    const contentWidth = pageWidth - 112;

    doc.rect(0, 0, pageWidth, pageHeight).fill('#f8fafc');

    doc
      .roundedRect(22, 22, pageWidth - 44, pageHeight - 44, 12)
      .lineWidth(1.2)
      .strokeColor('#94a3b8')
      .stroke();

    doc
      .roundedRect(34, 34, pageWidth - 68, pageHeight - 68, 10)
      .lineWidth(0.8)
      .strokeColor('#cbd5e1')
      .stroke();

    doc
      .rect(34, 34, pageWidth - 68, 78)
      .fill(type === 'transfer' ? '#0f766e' : '#1d4ed8');

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor('#e2e8f0')
      .text('EDUNEXUS INSTITUTIONAL CERTIFICATION', contentLeft, 50, {
        align: 'center',
        width: contentWidth
      });

    const certificateTitle = type === 'transfer' ? 'TRANSFER CERTIFICATE' : 'SCHOOL LEAVING CERTIFICATE';

    doc
      .font('Times-Bold')
      .fontSize(28)
      .fillColor('#ffffff')
      .text(certificateTitle, contentLeft, 74, {
        align: 'center',
        width: contentWidth
      });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`Certificate No: ${certificateNumber}`, contentLeft, 130, {
        width: contentWidth / 2,
        align: 'left'
      });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#0f172a')
      .text(`Issue Date: ${formatDisplayDate(issueDate)}`, contentLeft + contentWidth / 2, 130, {
        width: contentWidth / 2,
        align: 'right'
      });

    doc
      .font('Times-Italic')
      .fontSize(13)
      .fillColor('#334155')
      .text(
        type === 'transfer'
          ? 'This is to certify that the following learner has been formally transferred from this institution.'
          : 'This is to certify that the following learner has formally completed/left studies at this institution.',
        contentLeft,
        170,
        { align: 'center', width: contentWidth }
      );

    let rowY = 228;
    drawField(doc, 'Student Name', studentSnapshot.userName, contentLeft, rowY, contentWidth);
    rowY += 34;
    drawField(doc, 'Student ID', studentSnapshot.studentId, contentLeft, rowY, contentWidth);
    rowY += 34;
    drawField(doc, 'Registration No', studentSnapshot.registrationNumber, contentLeft, rowY, contentWidth);
    rowY += 34;
    drawField(
      doc,
      type === 'transfer' ? 'Current Class-Section' : 'Last Class-Section',
      [studentSnapshot.class, studentSnapshot.section].filter(Boolean).join(' - ') || '-',
      contentLeft,
      rowY,
      contentWidth
    );
    rowY += 34;

    if (type === 'slc') {
      drawField(doc, 'Leaving Date', formatDisplayDate(details.leavingDate), contentLeft, rowY, contentWidth);
      rowY += 34;
      drawField(doc, 'Conduct', details.conduct || '-', contentLeft, rowY, contentWidth);
      rowY += 34;
    }

    drawField(doc, 'Reason', details.reason || '-', contentLeft, rowY, contentWidth);
    rowY += 34;
    drawField(doc, 'Remarks', details.remarks || '-', contentLeft, rowY, contentWidth);

    const signatureY = 650;
    doc
      .moveTo(contentLeft, signatureY)
      .lineTo(contentLeft + 170, signatureY)
      .lineWidth(0.8)
      .strokeColor('#64748b')
      .stroke();

    doc
      .moveTo(contentLeft + contentWidth - 170, signatureY)
      .lineTo(contentLeft + contentWidth, signatureY)
      .lineWidth(0.8)
      .strokeColor('#64748b')
      .stroke();

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text(`Prepared By: ${issuedByName || 'Admin Office'}`, contentLeft, signatureY + 6, {
        width: 170,
        align: 'left'
      });

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#334155')
      .text('Principal Signature', contentLeft + contentWidth - 170, signatureY + 6, {
        width: 170,
        align: 'right'
      });

    doc
      .font('Helvetica-Oblique')
      .fontSize(9)
      .fillColor('#64748b')
      .text('System Generated Document - EduNexus', contentLeft, pageHeight - 56, {
        width: contentWidth,
        align: 'center'
      });

    doc.end();
  });
}

module.exports = {
  renderCertificatePdf
};
