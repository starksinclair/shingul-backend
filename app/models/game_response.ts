import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import GameSession from './game_session.js'
import QuizQuestion from './quiz_question.js'
import GameParticipant from './game_participant.js'

export default class GameResponse extends BaseModel {
  static table = 'game_responses'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'game_session_id' })
  declare gameSessionId: number

  @column({ columnName: 'question_id' })
  declare questionId: number

  @column({ columnName: 'game_participant_id' })
  declare gameParticipantId: number

  @column()
  declare answer: string

  @column({ columnName: 'is_correct' })
  declare isCorrect: boolean

  @column({ columnName: 'points_earned' })
  declare pointsEarned: number

  @column({ columnName: 'time_used_seconds' })
  declare timeUsedSeconds: number

  @column.dateTime({ columnName: 'answered_at' })
  declare answeredAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => GameSession, {
    foreignKey: 'gameSessionId',
  })
  declare gameSession: BelongsTo<typeof GameSession>

  @belongsTo(() => QuizQuestion, {
    foreignKey: 'questionId',
  })
  declare question: BelongsTo<typeof QuizQuestion>

  @belongsTo(() => GameParticipant, {
    foreignKey: 'gameParticipantId',
  })
  declare gameParticipant: BelongsTo<typeof GameParticipant>
}
