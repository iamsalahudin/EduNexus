require('../src/config');

const express = require('express');
const http = require('http');
const path = require('path');
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
const { startMonthlyFeeScheduler } = require('./jobs/monthlyFeeScheduler');
const { startReportCardArchiveScheduler } = require('./jobs/reportCardArchiveScheduler');
// Initialize export processor for async exports
require('./queues/exportProcessor');

const app = express();

app.use(helmet());
// Configure CORS to allow credentials from the frontend origin
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};
app.use(cors(corsOptions));
// Limit request body size to mitigate large-payload DoS
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(morgan('dev'));
// Force user-uploaded files to download instead of rendering inline (prevents stored-XSS via SVG/HTML)
app.use(
  '/uploads',
  express.static(path.resolve(process.cwd(), 'uploads'), {
    setHeaders(res) {
      res.setHeader('Content-Disposition', 'attachment');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  })
);

// parse cookies
app.use(cookieParser());

// prevent NoSQL injection
app.use(mongoSanitize());

// trust proxy for secure cookies when behind proxies/load balancers
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}


// Global rate limiting to throttle abuse/scraping across all API routes.
// Per-route limiters (e.g. stricter login limits) still apply on top of this.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX || 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// ROUTES
app.use('/api', routes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function startServer() {
  await connectDB();
  const server = http.createServer(app);

  // Setup Socket.io for real-time messaging
  setupSocket(server);

  // Initialize Firebase for push notifications
  initializeFirebase();

  // Schedule monthly fee generation in production/runtime environments.
  startMonthlyFeeScheduler();

  // Schedule monthly archival for old published report cards.
  startReportCardArchiveScheduler();

  await new Promise((resolve) => {
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info('Socket.io ready for real-time messaging');
      resolve();
    });
  });

  return server;
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;
