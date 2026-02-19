import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Quiz from './quiz.js'
import GameParticipant from './game_participant.js'
import GameResponse from './game_response.js'
import StudySet from './study_set.js'

export default class GameSession extends BaseModel {
  static table = 'game_sessions'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'study_set_id' })
  declare studySetId: string

  @column({ columnName: 'host_user_id' })
  declare hostUserId: number | null

  @column({ columnName: 'quiz_id' })
  declare quizId: string

  @column()
  declare title: string

  @column()
  declare code: string

  @column()
  declare status: 'lobby' | 'live' | 'ended' | 'cancelled'

  @column({ columnName: 'max_players' })
  declare maxPlayers: number

  @column({ columnName: 'time_per_question_seconds' })
  declare timePerQuestionSeconds: number

  @column({ columnName: 'points_per_question' })
  declare pointsPerQuestion: number

  @column.dateTime({ columnName: 'question_started_at' })
  declare questionStartedAt: DateTime | null

  @column({ columnName: 'current_question_index' })
  declare currentQuestionIndex: number

  @column({ columnName: 'player_view_mode' })
  declare playerViewMode: 'full' | 'options' | 'answers'

  @column.dateTime({ columnName: 'started_at' })
  declare startedAt: DateTime | null

  @column.dateTime({ columnName: 'ended_at' })
  declare completedAt: DateTime | null

  @column.dateTime({ columnName: 'cancelled_at' })
  declare cancelledAt: DateTime | null

  @column({ columnName: 'player_count' })
  declare playerCount: number | null

  @column({ columnName: 'total_questions' })
  declare totalQuestions: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => StudySet, {
    foreignKey: 'studySetId',
  })
  declare studySet: BelongsTo<typeof StudySet>

  @belongsTo(() => User, {
    foreignKey: 'hostUserId',
  })
  declare hostUser: BelongsTo<typeof User> | null

  @belongsTo(() => Quiz, {
    foreignKey: 'quizId',
  })
  declare quiz: BelongsTo<typeof Quiz>

  @hasMany(() => GameParticipant, {
    foreignKey: 'gameSessionId',
  })
  declare participants: HasMany<typeof GameParticipant>

  @hasMany(() => GameResponse, {
    foreignKey: 'gameSessionId',
  })
  declare responses: HasMany<typeof GameResponse>

  async getParticipant(userId: number) {
    return await GameParticipant.query()
      .where('game_session_id', this.id)
      .andWhere('status', 'active')
      .andWhere('user_id', userId)
      .first()
  }
  async getParticipantById(participantId: number) {
    return await GameParticipant.query()
      .where('game_session_id', this.id)
      .andWhere('status', 'active')
      .andWhere('id', participantId)
      .firstOrFail()
  }
  async isParticipant(userId: number) {
    const participant = await this.getParticipant(userId)
    return participant !== null && participant.status === 'active'
  }

  async isParticipantByNickname(nickname: string, userId: number): Promise<boolean> {
    if (!nickname) {
      return false
    }
    const participant = await GameParticipant.query()
      .where('game_session_id', this.id)
      .andWhere('nickname', nickname)
      .andWhere('user_id', userId)
      .first()
    return participant !== null && participant.status === 'active'
  }

  async getActivePlayerCount(): Promise<number> {
    return await GameParticipant.query()
      .where('game_session_id', this.id)
      .where('status', 'active')
      .count('* as total')
      .first()
      .then((result) => Number(result?.$extras.total || 0))
  }

  get activePlayerCount(): number {
    return this.participants?.filter((p) => p.status === 'active').length || 0
  }
}
