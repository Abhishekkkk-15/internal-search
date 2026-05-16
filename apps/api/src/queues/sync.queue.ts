import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const syncQueue = new Queue('sync-documents', {
  connection: redisConnection,
});
