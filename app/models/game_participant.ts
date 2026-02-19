import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import GameSession from './game_session.js'
import User from './user.js'
import GameResponse from './game_response.js'

export default class GameParticipant extends BaseModel {
  static table = 'game_participants'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'game_session_id' })
  declare gameSessionId: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column({ columnName: 'guest_key' })
  declare guestKey: string | null

  @column()
  declare nickname: string

  @column({ columnName: 'avatar_color' })
  declare avatarColor: string | null

  @column({ columnName: 'joined_at' })
  declare joinedAt: DateTime

  @column({ columnName: 'token_hash' })
  declare tokenHash: string | null

  @column({ columnName: 'status' })
  declare status: 'active' | 'left' | 'kicked'

  @column.dateTime({ columnName: 'left_at' })
  declare leftAt: DateTime | null

  @column({ columnName: 'total_score' })
  declare totalScore: number | null

  @column({ columnName: 'correct_answers' })
  declare correctAnswers: number | null

  @column({ columnName: 'incorrect_answers' })
  declare incorrectAnswers: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => GameSession, {
    foreignKey: 'gameSessionId',
  })
  declare gameSession: BelongsTo<typeof GameSession>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User> | null

  @hasMany(() => GameResponse, {
    foreignKey: 'gameParticipantId',
  })
  declare responses: HasMany<typeof GameResponse>
}
