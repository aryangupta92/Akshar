import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not defined');
}

// Connection state cache — prevents multiple connections in dev hot-reload
let isConnected = false;

export default async function connectDB(): Promise<void> {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(MONGODB_URI!, {
      // Connection pool settings
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed on app termination');
      process.exit(0);
    });

  } catch (err) {
    console.error('[MongoDB] Connection failed:', err);
    throw err;
  }
}
