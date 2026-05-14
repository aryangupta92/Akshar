import { Queue } from 'bullmq';

const REDIS_URL = process.env.REDIS_URL || '';

let archiveQueue: Queue | null = null;

if (REDIS_URL) {
  const url = new URL(REDIS_URL);
  const connection = {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    lazyConnect: true,
    enableOfflineQueue: false,
  };

  try {
    archiveQueue = new Queue('aksharArchive', {
      connection: connection as any,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail:     50,
        attempts:         3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    });
    console.log('[Queue] Archive queue ready');
  } catch {
    console.warn('[Queue] Redis not available — version archiving disabled');
  }
} else {
  console.log('[Queue] REDIS_URL not set — version archiving disabled');
}

export { archiveQueue };
