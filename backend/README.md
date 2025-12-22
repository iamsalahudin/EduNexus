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
