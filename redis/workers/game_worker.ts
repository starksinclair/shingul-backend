import { Worker } from 'bullmq'
import { DateTime } from 'luxon'
import GameSession from '../../app/models/game_session.js'
import { serviceContainer } from '../../app/services/service_container.js'
import db from '@adonisjs/lucid/services/db'
import transmit from '@adonisjs/transmit/services/main'
import { redis } from '../queues/redis.js'

type AdvanceJobData = { gameSessionId: number; expectedIndex: number }

export const gameWorker = new Worker(
  'game-queue',
  async (job) => {
    if (job.name !== 'advance-question') return

    const { gameSessionId, expectedIndex } = job.data as AdvanceJobData

    if (!db || typeof db.transaction !== 'function') {
      throw new Error('Database service is not initialized')
    }
    transmit.on('broadcast', ({ channel }) => {
      console.log('[transmit-event] broadcast', channel)
    })

    await db.transaction(async (trx) => {
      const game = await GameSession.query({ client: trx })
        .where('id', gameSessionId)
        .preload('participants', (query) => {
          query.where('status', 'active')
          query.select('id', 'nickname', 'avatarColor', 'totalScore', 'userId')
        })
        .forUpdate()
        .first()

      if (!game) return
      if (game.status !== 'live') return

      // idempotency guard: only advance if still on expected index
      const currentIndex = game.currentQuestionIndex ?? 0
      if (currentIndex !== expectedIndex) {
        console.log(
          `[worker] Game ${gameSessionId} not on expected index ${expectedIndex}, skipping`
        )
        return
      }

      const nextIndex = currentIndex + 1
      if (
        game.totalQuestions !== null &&
        game.totalQuestions !== undefined &&
        nextIndex >= game.totalQuestions
      ) {
        game.status = 'ended'
        game.completedAt = DateTime.now()
        await game.save()
        console.log(`[worker] Game ${gameSessionId} ended`)
        await serviceContainer.gameService.broadcastGameSession(game)
        return
      }

      game.currentQuestionIndex = nextIndex
      game.questionStartedAt = DateTime.now()
      await game.save()

      console.log('[worker] about to broadcast', { gameSessionId, nextIndex })

      await serviceContainer.gameService.broadcastGameSession(game)

      console.log('[worker] broadcast finished', { gameSessionId, nextIndex })

      console.log(`[worker] Advanced game=${gameSessionId} to index=${nextIndex}`)

      await serviceContainer.gameService.scheduleAdvanceQuestion({
        gameSessionId,
        expectedIndex: nextIndex,
        delaySeconds: game.timePerQuestionSeconds,
      })
    })
  },
  { connection: redis }
)

gameWorker.on('failed', (job, err) => {
  console.error('[worker] failed', job?.id, err)
})

// Verify transmit is connected
console.log('[worker] Transmit initialized:', transmit.getManager())
// console.log('[worker] Transmit connections:', transmit.getManager().verifyAccess('broadcast-test'))
// console.log('[worker] Transmit channels:', transmit.getManager().channels)
console.log('[worker] Transmit subscribers:', transmit.getManager().getAllSubscribers())
// transmit.registerRoutes
transmit.broadcast('broadcast-test', { message: 'Hello, world!' })
console.log('[worker] game worker running')

const shutdown = async (signal: string) => {
  console.log(`[worker] received ${signal}, closing...`)
  try {
    // stop taking new jobs, finish current one
    await gameWorker.close()
    console.log('[worker] closed cleanly')
    process.exit(0)
  } catch (err) {
    console.error('[worker] close failed', err)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
