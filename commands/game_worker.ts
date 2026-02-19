import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class GameWorker extends BaseCommand {
  static commandName = 'run:game-worker'
  static description = 'Run the game worker'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    await import('../redis/workers/game_worker.js')
    this.logger.info('Game worker running')
    await new Promise(() => {})
  }
}
