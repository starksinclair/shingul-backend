// start/game_worker.ts
try {
  await import('../redis/workers/game_worker.js')
  console.log('[preload] game worker started')
} catch (err) {
  console.error('[preload] game worker failed to start, continuing anyway', err)
}
