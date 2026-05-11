# EduNexus — Backend

This folder contains the Node.js (Express) backend for EduNexus.

Structure:
- `src/` — application source code
- `.env.example` — example environment variables

Run locally:

```powershell
cd backend
npm install
npm run dev
```

Create initial roles and admin user (seed):

```powershell
cd backend
npm install
npm run seed
```

The seed script will use `MONGO_URI` from environment or fall back to the provided cluster URI in the script.

Email setup (shared mailer for all modules):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=mailer@example.com
SMTP_PASS=your_password
EMAIL_FROM=EduNexus <no-reply@example.com>
FRONTEND_URL=http://localhost:3000
BACKEND_PUBLIC_URL=http://localhost:4000
```

If you use a Gmail app password, paste the 16-character password without spaces. The backend strips spaces automatically, but the underlying secret must still be a valid app password with 2FA enabled.

For Gmail, the backend now uses Nodemailer's `gmail` transport automatically when `SMTP_HOST=smtp.gmail.com`. If you still see authentication failures, the issue is the Google account/app-password configuration, not the route itself.

Use `backend/src/services/mailService.js` for common mail sending (`sendMail`, `sendWelcomeCredentialsEmail`) so new modules reuse the same transport and env configuration.
