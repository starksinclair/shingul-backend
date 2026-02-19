import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Quiz from './quiz.js'
import StudyDocument from './study_document.js'

export default class QuizDocument extends BaseModel {
  static table = 'quiz_documents'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'quiz_id' })
  declare quizId: string

  @column({ columnName: 'study_document_id' })
  declare studyDocumentId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Quiz, {
    foreignKey: 'quizId',
  })
  declare quiz: BelongsTo<typeof Quiz>

  @belongsTo(() => StudyDocument, {
    foreignKey: 'studyDocumentId',
  })
  declare studyDocument: BelongsTo<typeof StudyDocument>
}
