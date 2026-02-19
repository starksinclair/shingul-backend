import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import StudyDocument from './study_document.js'
import FlashcardDeck from './flashcard_deck.js'
import Flashcard from './flashcard.js'
import Quiz from './quiz.js'
import GameSession from './game_session.js'
import DocumentChunk from './document_chunk.js'
import { ulid } from 'ulid'

export default class StudySet extends BaseModel {
  static table = 'study_sets'

  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'owner_id' })
  declare ownerId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare status: 'draft' | 'ready' | 'archived'

  @column()
  declare visibility: 'public' | 'private' | 'unlisted'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => User, {
    foreignKey: 'ownerId',
  })
  declare owner: BelongsTo<typeof User>

  @hasMany(() => StudyDocument, {
    foreignKey: 'studySetId',
  })
  declare studyDocuments: HasMany<typeof StudyDocument>

  @hasMany(() => DocumentChunk, {
    foreignKey: 'studySetId',
  })
  declare documentChunks: HasMany<typeof DocumentChunk>

  @hasMany(() => FlashcardDeck, {
    foreignKey: 'studySetId',
  })
  declare flashcardDecks: HasMany<typeof FlashcardDeck>

  @hasMany(() => Flashcard, {
    foreignKey: 'flashcardDeckId',
  })
  declare flashcards: HasMany<typeof Flashcard>

  @hasMany(() => Quiz, {
    foreignKey: 'studySetId',
  })
  declare quizzes: HasMany<typeof Quiz>

  @hasMany(() => GameSession, {
    foreignKey: 'studySetId',
  })
  declare gameSessions: HasMany<typeof GameSession>

  @beforeCreate()
  static async beforeCreate(model: StudySet) {
    model.id = ulid()
  }
}
