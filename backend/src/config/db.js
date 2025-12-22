const mongoose = require('mongoose');
const { mongoUri } = require('./index');

async function connectDB() {
  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined');
  }
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

module.exports = { connectDB };
