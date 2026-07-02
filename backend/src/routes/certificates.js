const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const certificateController = require('../controllers/certificateController');
const {
  createCertificateSchema,
  listStudentCertificatesSchema,
  listRecentCertificatesSchema,
  certificateByIdSchema
} = require('../validators/certificates');

router.use(requireAuth);

router.post(
  '/generate',
  requireRole('Admin', 'Principal', 'HR', 'Reception'),
  validate(createCertificateSchema),
  certificateController.generateCertificate
);

router.get(
  '/student/:studentId',
  requireRole('Admin', 'Principal', 'HR', 'Reception', 'Teacher'),
  validate(listStudentCertificatesSchema),
  certificateController.listStudentCertificates
);

router.get(
  '/recent',
  requireRole('Admin', 'Principal', 'HR', 'Reception', 'Teacher'),
  validate(listRecentCertificatesSchema),
  certificateController.listRecentCertificates
);

router.get(
  '/:certificateId',
  requireRole('Admin', 'Principal', 'HR', 'Reception', 'Teacher'),
  validate(certificateByIdSchema),
  certificateController.getCertificate
);

router.get(
  '/:certificateId/pdf',
  requireRole('Admin', 'Principal', 'HR', 'Reception', 'Teacher'),
  validate(certificateByIdSchema),
  certificateController.downloadCertificatePdf
);

module.exports = router;
