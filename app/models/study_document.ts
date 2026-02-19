import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import StudySet from './study_set.js'
import User from './user.js'
import FlashcardDeck from './flashcard_deck.js'
import DocumentChunk from './document_chunk.js'
import Quiz from './quiz.js'

export default class StudyDocument extends BaseModel {
  static table = 'study_documents'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'study_set_id' })
  declare studySetId: string

  @column({ columnName: 'uploader_id' })
  declare uploaderId: number | null

  @column()
  declare type: 'text' | 'image' | 'pdf' | 'mixed' | 'audio'

  @column({ columnName: 'file_name' })
  declare fileName: string

  @column({ columnName: 'storage_provider' })
  declare storageProvider: string

  @column({ columnName: 'storage_key' })
  declare storageKey: string

  @column({ columnName: 'size_bytes' })
  declare sizeBytes: number | null

  @column({ columnName: 'mime_type' })
  declare mimeType: string | null

  @column({ columnName: 'page_count' })
  declare pageCount: number | null

  @column({ columnName: 'word_count' })
  declare wordCount: number | null

  @column({ columnName: 'url' })
  declare url: string | null

  @column()
  declare language: string | null

  @column({ columnName: 'processing_error' })
  declare processingError: string | null

  @column({ columnName: 'processing_status' })
  declare processingStatus: 'uploaded' | 'extracting' | 'extracted' | 'failed'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => StudySet, {
    foreignKey: 'studySetId',
  })
  declare studySet: BelongsTo<typeof StudySet>

  @belongsTo(() => User, {
    foreignKey: 'uploaderId',
  })
  declare uploader: BelongsTo<typeof User>

  @hasMany(() => DocumentChunk, {
    foreignKey: 'studyDocumentId',
  })
  declare documentChunks: HasMany<typeof DocumentChunk>

  @manyToMany(() => FlashcardDeck, {
    pivotTable: 'flashcard_deck_documents',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'study_document_id',
    pivotRelatedForeignKey: 'flashcard_deck_id',
  })
  declare flashcardDecks: ManyToMany<typeof FlashcardDeck>

  @manyToMany(() => Quiz, {
    pivotTable: 'quiz_documents',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'study_document_id',
    pivotRelatedForeignKey: 'quiz_id',
  })
  declare quizzes: ManyToMany<typeof Quiz>
}
