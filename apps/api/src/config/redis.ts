import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  throw new Error("Missing REDIS_URL environment variable");
}
export const redisConnection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null
});
