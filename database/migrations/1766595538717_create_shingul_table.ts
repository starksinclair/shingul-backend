import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'study_sets'
  protected documentTableName = 'study_documents'
  protected documentChunksTableName = 'document_chunks'
  protected flashcardDecksTableName = 'flashcard_decks'
  protected flashcardDeckDocumentsTableName = 'flashcard_deck_documents'
  protected flashcardTableName = 'flashcards'
  protected quizTableName = 'quizzes'
  protected quizDocumentsTableName = 'quiz_documents'
  protected quizQuestionTableName = 'quiz_questions'
  protected userTableName = 'users'
  protected quizAttemptTableName = 'quiz_attempts'
  protected gameSessionsTableName = 'game_sessions'
  protected gameParticipantsTableName = 'game_participants'
  protected gameResponsesTableName = 'game_responses'
  protected MAX_PLAYERS = 5

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .integer('owner_id')
        .notNullable()
        .references('id')
        .inTable(this.userTableName)
        .onDelete('cascade')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.enum('status', ['draft', 'ready', 'archived']).defaultTo('draft')
      table.enum('visibility', ['public', 'private', 'unlisted']).defaultTo('private')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['owner_id'])
      table.index(['status'])
      table.index(['visibility'])
    })

    this.schema.createTable(this.documentTableName, (table) => {
      table.increments('id').primary()
      table
        .string('study_set_id')
        .notNullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('cascade')
      table
        .integer('uploader_id')
        .nullable()
        .references('id')
        .inTable(this.userTableName)
        .onDelete('cascade')
      table.enum('type', ['text', 'image', 'pdf', 'mixed', 'audio']).defaultTo('text')
      table.string('file_name', 500).notNullable()
      table.string('storage_provider', 50).defaultTo('s3')
      table.string('storage_key', 500).notNullable()
      table.integer('size_bytes').nullable()
      table.string('mime_type', 100).nullable().defaultTo('application/pdf')
      table.integer('page_count').nullable()
      table.integer('word_count').nullable()
      table.string('language', 10).nullable()
      table.string('url', 500).nullable()
      table.text('processing_error').nullable()
      table
        .enum('processing_status', ['uploaded', 'extracting', 'extracted', 'failed'])
        .defaultTo('uploaded')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['study_set_id'])
      table.index(['uploader_id'])
      table.index(['type'])
      table.index(['storage_provider'])
      table.index(['storage_key'])
    })

    this.schema.createTable(this.documentChunksTableName, (table) => {
      table.increments('id').primary()
      table
        .integer('study_document_id')
        .notNullable()
        .references('id')
        .inTable(this.documentTableName)
        .onDelete('cascade')
      table
        .string('study_set_id')
        .notNullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('cascade')
      table.integer('chunk_index').notNullable()
      table.integer('page_start').nullable()
      table.integer('page_end').nullable()
      table.text('text').notNullable()
      table.jsonb('metadata').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['study_document_id', 'chunk_index'])
      table.index(['study_document_id'])
      table.index(['study_set_id'])
    })

    this.schema.createTable(this.flashcardDecksTableName, (table) => {
      table.string('id').primary()
      table
        .string('study_set_id')
        .notNullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('cascade')
      table
        .integer('study_document_id')
        .nullable()
        .references('id')
        .inTable(this.documentTableName)
        .onDelete('cascade')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.enum('difficulty', ['easy', 'medium', 'hard']).defaultTo('medium')
      table.integer('card_count').nullable()
      table.enum('visibility', ['public', 'private', 'unlisted']).defaultTo('private')
      table.enum('created_by', ['user', 'ai']).defaultTo('ai')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['study_set_id'])
    })

    this.schema.createTable(this.flashcardDeckDocumentsTableName, (table) => {
      table.increments('id').primary()
      table
        .string('flashcard_deck_id')
        .notNullable()
        .references('id')
        .inTable(this.flashcardDecksTableName)
        .onDelete('cascade')
      table
        .integer('study_document_id')
        .notNullable()
        .references('id')
        .inTable(this.documentTableName)
        .onDelete('cascade')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['flashcard_deck_id', 'study_document_id'])
      table.index(['flashcard_deck_id'])
      table.index(['study_document_id'])
    })

    this.schema.createTable(this.flashcardTableName, (table) => {
      table.increments('id').primary()
      table
        .string('flashcard_deck_id')
        .notNullable()
        .references('id')
        .inTable(this.flashcardDecksTableName)
        .onDelete('cascade')
      table.text('question').notNullable()
      table.text('answer').notNullable()
      table.text('hint').nullable()
      table.integer('position').notNullable()
      table.string('tags', 255).nullable()
      table.enum('created_by', ['user', 'ai']).defaultTo('ai')
      table.integer('interval').defaultTo(1)
      table.decimal('ease_factor', 3, 1).defaultTo(2.5)
      table.integer('repetitions').defaultTo(0)
      table.timestamp('last_reviewed_at').nullable()
      table.timestamp('next_review_at').nullable()
      table.integer('times_studied').nullable().defaultTo(0)
      table.integer('times_skipped').nullable().defaultTo(0)
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['flashcard_deck_id'])
    })

    this.schema.createTable(this.quizTableName, (table) => {
      table.string('id').primary()
      table
        .string('study_set_id')
        .notNullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('cascade')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.enum('difficulty', ['easy', 'medium', 'hard']).defaultTo('medium')
      table.enum('created_by', ['user', 'ai']).defaultTo('ai')
      table.enum('mode', ['practice', 'live']).defaultTo('practice')
      table.integer('time_limit_seconds').nullable()
      table.integer('question_count').nullable()
      table.integer('total_points').nullable()
      table.integer('total_time_used').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['study_set_id'])
    })

    this.schema.createTable(this.quizDocumentsTableName, (table) => {
      table.increments('id').primary()
      table
        .string('quiz_id')
        .notNullable()
        .references('id')
        .inTable(this.quizTableName)
        .onDelete('cascade')
      table
        .integer('study_document_id')
        .notNullable()
        .references('id')
        .inTable(this.documentTableName)
        .onDelete('cascade')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['quiz_id', 'study_document_id'])
      table.index(['quiz_id'])
      table.index(['study_document_id'])
    })

    this.schema.createTable(this.quizQuestionTableName, (table) => {
      table.increments('id').primary()
      table
        .string('quiz_id')
        .notNullable()
        .references('id')
        .inTable(this.quizTableName)
        .onDelete('cascade')
      table
        .enum('type', ['multiple_choice', 'fill_in_the_blank', 'matching', 'short_answer'])
        .defaultTo('multiple_choice')
      table.text('question').notNullable()
      table.jsonb('choices').nullable()
      table.text('answer').notNullable()
      table.integer('position').notNullable()
      table.text('explanation').nullable()
      table.text('feedback').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['quiz_id'])
    })

    this.schema.createTable(this.quizAttemptTableName, (table) => {
      table.increments('id').primary()
      table
        .string('quiz_id')
        .notNullable()
        .references('id')
        .inTable(this.quizTableName)
        .onDelete('cascade')

      table
        .integer('user_id')
        .nullable()
        .references('id')
        .inTable(this.userTableName)
        .onDelete('cascade')

      table.integer('score').nullable()
      table.integer('total').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('completed_at').nullable()
      table.enum('mode', ['practice', 'live']).defaultTo('practice')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['quiz_id'])
      table.index(['user_id'])
    })

    this.schema.createTable(this.gameSessionsTableName, (table) => {
      table.increments('id').primary()
      table
        .string('study_set_id')
        .notNullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('cascade')
      table
        .integer('host_user_id')
        .notNullable()
        .references('id')
        .inTable(this.userTableName)
        .onDelete('cascade')

      table
        .string('quiz_id')
        .notNullable()
        .references('id')
        .inTable(this.quizTableName)
        .onDelete('cascade')

      table.string('title').notNullable()
      table.string('code').notNullable().unique()
      table.enum('status', ['lobby', 'live', 'ended', 'cancelled']).defaultTo('lobby')
      table.integer('max_players').nullable().defaultTo(this.MAX_PLAYERS)
      table.integer('time_per_question_seconds').nullable().defaultTo(30)
      table.integer('points_per_question').nullable().defaultTo(10)
      table.timestamp('started_at').nullable()
      table.timestamp('question_started_at').nullable()
      table.timestamp('ended_at').nullable()
      table.timestamp('cancelled_at').nullable()
      table.integer('current_question_index').notNullable().defaultTo(0)
      table.enum('player_view_mode', ['full', 'options', 'answers']).defaultTo('full')
      table.integer('player_count').nullable()
      table.integer('total_questions').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.index(['host_user_id'])
      table.index(['status'])
      table.index(['code'])
      table.index(['study_set_id'])
    })

    this.schema.createTable(this.gameParticipantsTableName, (table) => {
      table.increments('id').primary()
      table
        .integer('game_session_id')
        .notNullable()
        .references('id')
        .inTable(this.gameSessionsTableName)
        .onDelete('cascade')
      table
        .integer('user_id')
        .nullable()
        .references('id')
        .inTable(this.userTableName)
        .onDelete('cascade')
      table.string('guest_key', 32).nullable()

      table.string('nickname').notNullable()
      table.string('avatar_color').nullable()
      table.timestamp('joined_at').notNullable()
      table.timestamp('left_at').nullable()
      table.integer('total_score').nullable()
      table.integer('correct_answers').nullable()
      table.integer('incorrect_answers').nullable()
      table.string('token_hash', 255).nullable()
      table.enum('status', ['active', 'left', 'kicked']).defaultTo('active')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Partial unique indexes for guests (created in after() hook)
      table.index(['game_session_id', 'total_score'])
      table.index(['user_id'])
      table.index(['game_session_id', 'guest_key'])
    })

    this.schema.createTable(this.gameResponsesTableName, (table) => {
      table.increments('id').primary()
      table
        .integer('game_session_id')
        .notNullable()
        .references('id')
        .inTable(this.gameSessionsTableName)
        .onDelete('cascade')
      table
        .integer('question_id')
        .notNullable()
        .references('id')
        .inTable(this.quizQuestionTableName)
        .onDelete('cascade')
      table
        .integer('game_participant_id')
        .notNullable()
        .references('id')
        .inTable(this.gameParticipantsTableName)
        .onDelete('cascade')
      table.text('answer').notNullable()
      table.boolean('is_correct').notNullable()
      table.integer('points_earned').notNullable().defaultTo(0)
      table.integer('time_used_seconds').notNullable().defaultTo(0)
      table.timestamp('answered_at').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      table.unique(['game_session_id', 'game_participant_id', 'question_id'])
      table.index(['game_session_id', 'question_id'])
      table.index(['game_participant_id'])
      table.index(['question_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.gameResponsesTableName)
    this.schema.dropTable(this.gameParticipantsTableName)
    this.schema.dropTable(this.gameSessionsTableName)
    this.schema.dropTable(this.quizAttemptTableName)
    this.schema.dropTable(this.quizQuestionTableName)
    this.schema.dropTable(this.quizDocumentsTableName)
    this.schema.dropTable(this.quizTableName)
    this.schema.dropTable(this.flashcardTableName)
    this.schema.dropTable(this.flashcardDeckDocumentsTableName)
    this.schema.dropTable(this.flashcardDecksTableName)
    this.schema.dropTable(this.documentChunksTableName)
    this.schema.dropTable(this.documentTableName)
    this.schema.dropTable(this.tableName)
  }
}
