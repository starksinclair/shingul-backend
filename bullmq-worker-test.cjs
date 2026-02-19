const { Worker } = require('bullmq')
const IORedis = require('ioredis')

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
})

const worker = new Worker(
  'smoke-test', // must match the queue name you used
  async (job) => {
    console.log('✅ Processing job:', job.id, job.name, job.data)
    return { ok: true }
  },
  { connection }
)

worker.on('completed', (job, result) => {
  console.log('🎉 Completed job:', job.id, result)
})

worker.on('failed', (job, err) => {
  console.error('❌ Failed job:', job?.id, err)
})

console.log('👂 Worker running... (Ctrl+C to stop)')
