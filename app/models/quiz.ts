import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  belongsTo,
  hasMany,
  manyToMany,
  beforeCreate,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import StudySet from './study_set.js'
import QuizQuestion from './quiz_question.js'
import QuizAttempt from './quiz_attempt.js'
import GameSession from './game_session.js'
import StudyDocument from './study_document.js'
import { ulid } from 'ulid'

export default class Quiz extends BaseModel {
  static table = 'quizzes'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'study_set_id' })
  declare studySetId: string

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare difficulty: 'easy' | 'medium' | 'hard'

  @column({ columnName: 'created_by' })
  declare createdBy: 'user' | 'ai'

  @column()
  declare mode: 'practice' | 'live'

  @column({ columnName: 'time_limit_seconds' })
  declare timeLimitSeconds: number | null

  @column({ columnName: 'question_count' })
  declare questionCount: number | null

  @column({ columnName: 'total_points' })
  declare totalPoints: number | null

  @column({ columnName: 'total_time_used' })
  declare totalTimeUsed: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => StudySet, {
    foreignKey: 'studySetId',
  })
  declare studySet: BelongsTo<typeof StudySet>

  @hasMany(() => QuizQuestion, {
    foreignKey: 'quizId',
  })
  declare questions: HasMany<typeof QuizQuestion>

  @hasMany(() => QuizAttempt, {
    foreignKey: 'quizId',
  })
  declare attempts: HasMany<typeof QuizAttempt>

  @hasMany(() => GameSession, {
    foreignKey: 'quizId',
  })
  declare gameSessions: HasMany<typeof GameSession>

  @manyToMany(() => StudyDocument, {
    pivotTable: 'quiz_documents',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'quiz_id',
    pivotRelatedForeignKey: 'study_document_id',
  })
  declare studyDocuments: ManyToMany<typeof StudyDocument>

  @beforeCreate()
  static async beforeCreate(model: Quiz) {
    model.id = ulid()
  }
}
