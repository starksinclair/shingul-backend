import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import FlashcardDeck from './flashcard_deck.js'
import StudyDocument from './study_document.js'

export default class FlashcardDeckDocument extends BaseModel {
  static table = 'flashcard_deck_documents'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'flashcard_deck_id' })
  declare flashcardDeckId: string

  @column({ columnName: 'study_document_id' })
  declare studyDocumentId: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => FlashcardDeck, {
    foreignKey: 'flashcardDeckId',
  })
  declare flashcardDeck: BelongsTo<typeof FlashcardDeck>

  @belongsTo(() => StudyDocument, {
    foreignKey: 'studyDocumentId',
  })
  declare studyDocument: BelongsTo<typeof StudyDocument>
}
