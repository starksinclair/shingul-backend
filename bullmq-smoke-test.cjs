const { Queue } = require('bullmq')
const IORedis = require('ioredis')

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'redis',
  port: Number(process.env.REDIS_PORT || 6379),
  maxRetriesPerRequest: null,
})

async function main() {
  const queue = new Queue('smoke-test', { connection })
  const job = await queue.add('hello', { msg: 'it works' })
  console.log('Enqueued job id:', job.id)
  await queue.close()
  await connection.quit()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
