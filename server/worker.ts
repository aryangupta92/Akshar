// BullMQ Worker — runs as a separate process
// Start with: ts-node worker.ts  (or add to package.json scripts)
// Processes archive jobs pushed when embedded versions exceed 50

import { Worker } from 'bullmq';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL   = process.env.REDIS_URL   || 'redis://localhost:6379';
const MONGODB_URI = process.env.MONGODB_URI!;

const url = new URL(REDIS_URL);
const connection = { host: url.hostname, port: parseInt(url.port || '6379', 10) };

async function startWorker() {
  // Connect to MongoDB
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 3 });
  console.log('[Worker] MongoDB connected');

  // Import model after DB connect to avoid connection-before-model issue
  const { default: ArchivedVersion } = await import('./src/models/ArchivedVersion');

  const worker = new Worker(
    'aksharArchive',
    async (job) => {
      const { contentId, versionId, delta, editedAt } = job.data as {
        contentId: string;
        versionId: string;
        delta:     Record<string, unknown>;
        editedAt:  string;
      };

      await ArchivedVersion.create({
        contentId:  new mongoose.Types.ObjectId(contentId),
        versionId,
        delta,
        editedAt:   new Date(editedAt),
        archivedAt: new Date(),
      });

      console.log(`[Worker] Archived version ${versionId} → contentId ${contentId}`);
    },
    { connection, concurrency: 5 }
  );

  worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} done`));
  worker.on('failed',    (job, err) => console.error(`[Worker] Job ${job?.id} failed:`, err.message));

  console.log('[Worker] Listening for archive jobs…');
}

startWorker().catch((err) => {
  console.error('[Worker] Fatal:', err);
  process.exit(1);
});
