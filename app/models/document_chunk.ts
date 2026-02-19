import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import StudyDocument from './study_document.js'
import StudySet from './study_set.js'

export default class DocumentChunk extends BaseModel {
  static table = 'document_chunks'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'study_document_id' })
  declare studyDocumentId: number

  @column({ columnName: 'study_set_id' })
  declare studySetId: string

  @column({ columnName: 'chunk_index' })
  declare chunkIndex: number

  @column({ columnName: 'page_start' })
  declare pageStart: number | null

  @column({ columnName: 'page_end' })
  declare pageEnd: number | null

  @column()
  declare text: string

  @column({
    columnName: 'metadata',
    prepare: (value: Record<string, any> | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | Record<string, any> | null) => {
      if (value === null || value === undefined) {
        return null
      }
      // PostgreSQL JSONB columns return objects directly, not strings
      if (typeof value === 'object') {
        return value
      }
      // If it's a string, parse it
      if (typeof value === 'string') {
        return JSON.parse(value)
      }
      return value
    },
  })
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => StudyDocument, {
    foreignKey: 'studyDocumentId',
  })
  declare studyDocument: BelongsTo<typeof StudyDocument>

  @belongsTo(() => StudySet, {
    foreignKey: 'studySetId',
  })
  declare studySet: BelongsTo<typeof StudySet>
}
