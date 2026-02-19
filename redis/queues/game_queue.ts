import { Queue } from 'bullmq'
import { redis } from './redis.js'

export const gameQueue = new Queue('game-queue', { connection: redis })
