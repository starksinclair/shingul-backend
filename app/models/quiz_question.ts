import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Quiz from './quiz.js'
import GameResponse from './game_response.js'

export default class QuizQuestion extends BaseModel {
  static table = 'quiz_questions'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'quiz_id' })
  declare quizId: string

  @column()
  declare type: 'multiple_choice' | 'fill_in_the_blank' | 'matching' | 'short_answer'

  @column()
  declare question: string

  @column({
    prepare: (value: string[] | Record<string, any> | null) =>
      value ? JSON.stringify(value) : null,
    consume: (value: string | string[] | Record<string, any> | null) => {
      if (value === null || value === undefined) {
        return null
      }
      if (typeof value === 'object') {
        return value
      }
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare choices: string[] | Record<string, any> | null

  @column()
  declare answer: string

  @column()
  declare position: number

  @column()
  declare explanation: string | null

  @column()
  declare feedback: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Quiz, {
    foreignKey: 'quizId',
  })
  declare quiz: BelongsTo<typeof Quiz>

  @hasMany(() => GameResponse, {
    foreignKey: 'questionId',
  })
  declare gameResponses: HasMany<typeof GameResponse>
}
