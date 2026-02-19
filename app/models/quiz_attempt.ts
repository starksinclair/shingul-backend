import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Quiz from './quiz.js'
import User from './user.js'

export default class QuizAttempt extends BaseModel {
  static table = 'quiz_attempts'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'quiz_id' })
  declare quizId: string

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare score: number | null

  @column()
  declare total: number | null

  @column.dateTime({ columnName: 'started_at' })
  declare startedAt: DateTime | null

  @column.dateTime({ columnName: 'completed_at' })
  declare completedAt: DateTime | null

  @column()
  declare mode: 'practice' | 'live'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Quiz, {
    foreignKey: 'quizId',
  })
  declare quiz: BelongsTo<typeof Quiz>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User> | null
}
