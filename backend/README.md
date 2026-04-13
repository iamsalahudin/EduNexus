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

Use `backend/src/services/mailService.js` for common mail sending (`sendMail`, `sendWelcomeCredentialsEmail`) so new modules reuse the same transport and env configuration.
