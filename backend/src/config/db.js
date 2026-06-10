const mongoose = require('mongoose');
const dns = require('dns');

const configureDns = () => {
  const servers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (servers.length > 0) {
    dns.setServers(servers);
  }
};

const connectDB = async () => {
  try {
    configureDns();

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: 'opsmind',
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`✅ MongoDB Atlas connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
