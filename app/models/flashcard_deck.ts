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
import StudyDocument from './study_document.js'
import Flashcard from './flashcard.js'
import { ulid } from 'ulid'

export default class FlashcardDeck extends BaseModel {
  static table = 'flashcard_decks'

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

  @column({ columnName: 'card_count' })
  declare cardCount: number | null

  @column()
  declare visibility: 'public' | 'private' | 'unlisted'

  @column({ columnName: 'created_by' })
  declare createdBy: 'user' | 'ai'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => StudySet, {
    foreignKey: 'studySetId',
  })
  declare studySet: BelongsTo<typeof StudySet>

  @hasMany(() => Flashcard, {
    foreignKey: 'flashcardDeckId',
  })
  declare flashcards: HasMany<typeof Flashcard>

  @manyToMany(() => StudyDocument, {
    pivotTable: 'flashcard_deck_documents',
    localKey: 'id',
    relatedKey: 'id',
    pivotForeignKey: 'flashcard_deck_id',
    pivotRelatedForeignKey: 'study_document_id',
  })
  declare studyDocuments: ManyToMany<typeof StudyDocument>

  @beforeCreate()
  static async beforeCreate(model: FlashcardDeck) {
    model.id = ulid()
  }
}
