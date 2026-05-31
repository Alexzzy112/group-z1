const mongoose = require('mongoose');

let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

function getUri() {
  return process.env.MONGODB_URI || process.env.MONGODB_LOCAL_URI;
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = getUri();
    if (!uri) {
      console.warn('No MongoDB URI provided.');
      return null;
    }
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    };
    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log('MongoDB connected');
      return m;
    }).catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      cached.promise = null;
      return null;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

function isConnected() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDB, isConnected, mongoose };
