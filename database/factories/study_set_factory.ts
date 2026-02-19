import factory from '@adonisjs/lucid/factories'
import StudySet from '#models/study_set'
import { StudyDocumentFactory } from './study_document_factory.js'
import { FlashcardFactory } from './flashcard_factory.js'
import { QuizFactory } from './quiz_factory.js'
import { GameSessionFactory } from './game_session_factory.js'
import { FlashcardDeckFactory } from './flashcard_deck_factory.js'
import { DocumentChunkFactory } from './document_chunk_factory.js'

export const StudySetFactory = factory
  .define(StudySet, async ({ faker }) => {
    return {
      ownerId: 0, // This is still integer (user id)
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(['draft', 'ready', 'archived'] as const),
      visibility: faker.helpers.arrayElement(['public', 'private', 'unlisted'] as const),
    }
  })
  .state('draft', (studySet) => (studySet.status = 'draft'))
  .state('ready', (studySet) => (studySet.status = 'ready'))
  .state('archived', (studySet) => (studySet.status = 'archived'))
  .state('public', (studySet) => (studySet.visibility = 'public'))
  .state('private', (studySet) => (studySet.visibility = 'private'))
  .state('unlisted', (studySet) => (studySet.visibility = 'unlisted'))
  .relation('studyDocuments', () => StudyDocumentFactory)
  .relation('documentChunks', () => DocumentChunkFactory)
  .relation('flashcardDecks', () => FlashcardDeckFactory)
  .relation('flashcards', () => FlashcardFactory)
  .relation('quizzes', () => QuizFactory)
  .relation('gameSessions', () => GameSessionFactory)
  .build()
