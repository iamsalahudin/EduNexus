const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  try {
    console.log('Starting mongodb-memory-server binary download...');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('Downloaded mongodb-memory-server binary; uri:', uri);
    await mongod.stop();
    console.log('Stopped temporary mongod.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to download mongodb binary:', err);
    process.exit(2);
  }
})();
