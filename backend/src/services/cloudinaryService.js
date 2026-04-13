const { v2: cloudinary } = require('cloudinary');

let configured = false;

function getCloudinaryConfig() {
  return {
    cloudName: String(process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
    apiKey: String(process.env.CLOUDINARY_API_KEY || '').trim(),
    apiSecret: String(process.env.CLOUDINARY_API_SECRET || '').trim()
  };
}

function isCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  return Boolean(cloudName && apiKey && apiSecret);
}

function ensureCloudinaryConfigured() {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
  if (!cloudName || !apiKey || !apiSecret) {
    const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter((key) => !String(process.env[key] || '').trim());
    const err = new Error(
      `Cloudinary is not configured. Missing: ${missing.join(', ')}. Add these to backend/.env and restart the backend server.`
    );
    err.status = 500;
    throw err;
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
    configured = true;
  }

  return cloudinary;
}

function uploadBufferToCloudinary({ buffer, folder, resourceType = 'auto', originalFilename }) {
  const client = ensureCloudinaryConfigured();

  if (!buffer || !Buffer.isBuffer(buffer)) {
    const err = new Error('Invalid upload buffer.');
    err.status = 400;
    throw err;
  }

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: Boolean(originalFilename),
        filename_override: originalFilename || undefined,
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type
        });
      }
    );

    stream.end(buffer);
  });
}

function extractPublicIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);
    const marker = '/upload/';
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;

    let rest = parsed.pathname.slice(idx + marker.length);
    rest = rest.replace(/^v\d+\//, '');
    const withoutExt = rest.replace(/\.[^/.]+$/, '');
    return withoutExt || null;
  } catch {
    return null;
  }
}

async function deleteCloudinaryAssetByUrl(url) {
  const client = ensureCloudinaryConfigured();
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return false;

  const types = ['raw', 'image', 'video'];
  for (const resourceType of types) {
    try {
      const result = await client.uploader.destroy(publicId, {
        resource_type: resourceType,
        invalidate: true
      });

      if (result?.result === 'ok' || result?.result === 'not found') {
        return true;
      }
    } catch {
      // Continue trying the next resource type.
    }
  }

  return false;
}

module.exports = {
  isCloudinaryConfigured,
  ensureCloudinaryConfigured,
  uploadBufferToCloudinary,
  deleteCloudinaryAssetByUrl
};
