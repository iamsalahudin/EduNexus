# Real-time Messaging Setup Guide

## What's Been Implemented

### 1. Models Created:
- `MessageDelivery` - tracks delivery status (sent/delivered/read)
- `FCMToken` - stores Firebase Cloud Messaging tokens
- `HomeworkNotification` - tracks homework-related notifications
- Updated `Message` model with new fields: `recipient`, `text`, `isDeleted`

### 2. Controllers Created:
- `messagingController` - handles sending, receiving, and managing messages
- `fcmController` - manages FCM token registration and revocation

### 3. Routes Created:
- `/messaging` - send/receive messages, get conversations, delivery status
- `/fcm` - register/revoke FCM tokens

### 4. Utilities Created:
- `socket.js` - Socket.io setup with real-time message handling
- `fcm.js` - Firebase Cloud Messaging integration

## Manual Steps Required

### Step 1: Update package.json (Dependencies Added)
Already done - socket.io and firebase-admin added

### Step 2: Update src/index.js
Replace the entire file with:

\`\`\`javascript
require('../src/config');

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/db');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const { setupSocket } = require('./utils/socket');
const { initializeFirebase } = require('./utils/fcm');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// parse cookies
app.use(cookieParser());

// prevent NoSQL injection
app.use(mongoSanitize());

// basic rate limiter for all requests
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use(apiLimiter);

// trust proxy for secure cookies when behind proxies/load balancers
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    const server = http.createServer(app);
    
    // Setup Socket.io for real-time messaging
    const io = setupSocket(server);
    
    // Initialize Firebase for push notifications
    initializeFirebase();
    
    server.listen(PORT, () => {
      logger.info(\`Server running on port \${PORT}\`);
      logger.info('Socket.io ready for real-time messaging');
    });
  })
  .catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
\`\`\`

### Step 3: Update src/routes/index.js
Add these lines before the final module.exports:

\`\`\`javascript
// Real-time messaging
router.use('/messages', require('./messaging'));

// FCM push notifications
router.use('/notifications', require('./fcm'));
\`\`\`

### Step 4: Set up Firebase (Optional but Recommended)
1. Go to Firebase Console (console.firebase.google.com)
2. Create a new project or use existing one
3. Download service account JSON key
4. Place it in your backend root directory
5. Add to .env: \`FIREBASE_CREDENTIALS_PATH=/path/to/serviceAccountKey.json\`

### Step 5: Install Dependencies
\`\`\`bash
cd backend
npm install
\`\`\`

### Step 6: Test the Server
\`\`\`bash
npm run dev
\`\`\`

## API Endpoints

### Messaging Endpoints:
- \`POST /api/messages\` - Send a message
- \`GET /api/messages/conversations\` - Get all conversations
- \`GET /api/messages/conversation/:conversationWith\` - Get specific conversation
- \`PATCH /api/messages/:messageId/read\` - Mark message as read
- \`GET /api/messages/:messageId/status\` - Get delivery status
- \`GET /api/messages/count/unread\` - Get unread count
- \`DELETE /api/messages/:messageId\` - Delete message

### FCM Notification Endpoints:
- \`POST /api/notifications/token\` - Register FCM token
- \`POST /api/notifications/token/revoke\` - Revoke FCM token
- \`GET /api/notifications/tokens\` - Get active tokens

## WebSocket Events

### Client → Server:
- \`message:send\` - Send a message
- \`message:read\` - Mark message as read
- \`homework:submitted\` - Notify homework submission
- \`homework:graded\` - Notify homework grading

### Server → Client:
- \`user:online\` - User comes online
- \`user:offline\` - User goes offline
- \`message:new\` - New message received
- \`message:read\` - Message read by recipient
- \`message:ack\` - Message sent acknowledgement
- \`message:error\` - Message sending error
- \`homework:submission\` - Homework submitted
- \`homework:graded\` - Homework graded

## Features Implemented

✅ Real-time messaging with Socket.io
✅ Message delivery tracking (sent/delivered/read)
✅ Firebase Cloud Messaging (FCM) integration
✅ Push notification support
✅ Homework submission notifications
✅ Homework grading notifications
✅ Online/offline status tracking
✅ Conversation history
✅ Message soft-delete

## Next Steps

1. Complete manual setup steps above
2. Test messaging endpoints with Postman
3. Connect Socket.io client in React frontend
4. Register FCM tokens on mobile/web clients
