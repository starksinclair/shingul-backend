import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import FlashcardDeck from './flashcard_deck.js'

export default class Flashcard extends BaseModel {
  static table = 'flashcards'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'flashcard_deck_id' })
  declare flashcardDeckId: string

  @column()
  declare question: string

  @column()
  declare answer: string

  @column()
  declare hint: string | null

  @column()
  declare position: number

  @column()
  declare tags: string | null

  @column({ columnName: 'created_by' })
  declare createdBy: 'user' | 'ai'

  @column()
  declare interval: number

  @column({ columnName: 'ease_factor' })
  declare easeFactor: number

  @column()
  declare repetitions: number

  @column.dateTime({ columnName: 'last_reviewed_at' })
  declare lastReviewedAt: DateTime | null

  @column.dateTime({ columnName: 'next_review_at' })
  declare nextReviewAt: DateTime | null

  @column({ columnName: 'times_studied' })
  declare timesStudied: number

  @column({ columnName: 'times_skipped' })
  declare timesSkipped: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => FlashcardDeck, {
    foreignKey: 'flashcardDeckId',
  })
  declare flashcardDeck: BelongsTo<typeof FlashcardDeck>
}
