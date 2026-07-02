/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `appDir` is no longer set under `experimental`. Next.js will detect
  // the `/app` directory automatically when supported by the installed
  // Next version. Remove the invalid experimental key to silence the
  // "Unrecognized key(s) in object: 'appDir'" warning.
}

module.exports = nextConfig;
