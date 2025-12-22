require('../src/config');

const express = require('express');
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
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error('Failed to start server', err);
    process.exit(1);
  });
