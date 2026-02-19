import GameSession from '../../models/game_session.js'
import { TokenService } from '../token_service.js'
import { TransmitService } from './transmit_service.js'
import GameParticipant from '../../models/game_participant.js'
import { gameQueue } from '../../../redis/queues/game_queue.js'

export class GameService {
  constructor(private readonly transmitService: TransmitService) {}
  /**
   * Generate a 6-character game code
   * @returns The game code
   */
  public generateGameCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * Generate a token hash
   * @returns The token hash
   */
  public generateTokenHash(): string {
    return TokenService.hashToken(TokenService.generateToken())
  }

  public async broadcastGameSession(gameSession: GameSession): Promise<void> {
    await this.transmitService.broadcast(`game_session:${gameSession.id}`, {
      id: gameSession.id,
      code: gameSession.code,
      currentQuestionIndex: gameSession.currentQuestionIndex,
      status: gameSession.status,
      players: gameSession?.participants?.map((participant) => ({
        id: participant.id,
        nickname: participant.nickname,
        avatarColor: participant.avatarColor,
        score: participant.totalScore,
        isHost: participant.userId === gameSession.hostUserId,
      })),
      timePerQuestionSeconds: gameSession.timePerQuestionSeconds,
      pointsPerQuestion: gameSession.pointsPerQuestion,
      questionStartedAt: gameSession.questionStartedAt?.toISO(),
    })
    console.log('[transmit] broadcast done')
  }

  public async broadcastGameParticipant(
    gameSessionId: number,
    gameParticipant: GameParticipant
  ): Promise<void> {
    await this.transmitService.broadcast(`game_participant:${gameSessionId}:joined`, {
      id: gameParticipant.id,
      nickname: gameParticipant.nickname,
      avatarColor: gameParticipant.avatarColor,
      status: gameParticipant.status,
      score: gameParticipant.totalScore,
    })
    console.log('[transmit] broadcast done')
  }

  public async scheduleAdvanceQuestion(opts: {
    gameSessionId: number
    expectedIndex: number
    delaySeconds: number
  }) {
    const { gameSessionId, expectedIndex, delaySeconds } = opts

    // deterministic jobId prevents duplicates for the same question
    const jobId = `advance_next_question:${gameSessionId}:${expectedIndex}`

    await gameQueue.add(
      'advance-question',
      { gameSessionId, expectedIndex },
      {
        delay: delaySeconds * 1000,
        jobId,
        removeOnComplete: true,
        removeOnFail: 100,
      }
    )
  }
}
