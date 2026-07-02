const multer = require('multer');

const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

function createUploadMiddleware({
  maxFileSizeMB = 10,
  maxFiles = 10,
  allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES
} = {}) {
  const allowed = new Set((allowedMimeTypes || []).map((m) => String(m).toLowerCase()));

  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: Math.max(Number(maxFileSizeMB) || 10, 1) * 1024 * 1024,
      files: Math.max(Number(maxFiles) || 10, 1)
    },
    fileFilter(req, file, cb) {
      if (!file?.mimetype) {
        return cb(new Error('Uploaded file is missing MIME type.'));
      }

      if (allowed.size > 0 && !allowed.has(String(file.mimetype).toLowerCase())) {
        return cb(new Error(`Unsupported file type: ${file.mimetype}`));
      }

      return cb(null, true);
    }
  });
}

module.exports = {
  createUploadMiddleware,
  DEFAULT_ALLOWED_MIME_TYPES
};
