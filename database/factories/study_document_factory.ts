import factory from '@adonisjs/lucid/factories'
import StudyDocument from '#models/study_document'
import { FlashcardDeckFactory } from './flashcard_deck_factory.js'
import { DocumentChunkFactory } from './document_chunk_factory.js'

export const StudyDocumentFactory = factory
  .define(StudyDocument, async ({ faker }) => {
    return {
      studySetId: '',
      uploaderId: 0,
      type: faker.helpers.arrayElement(['text', 'image', 'pdf', 'mixed', 'audio'] as const),
      fileName: faker.system.fileName({ extensionCount: 1 }).slice(0, 500),
      storageProvider: 's3',
      storageKey: faker.string.alphanumeric(32),
      sizeBytes: faker.number.int({ min: 1000, max: 10000000 }),
      mimeType: faker.system.mimeType().slice(0, 100),
      pageCount: faker.number.int({ min: 1, max: 100 }),
      wordCount: faker.number.int({ min: 100, max: 10000 }),
      language: faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
      processingError: null,
      processingStatus: faker.helpers.arrayElement([
        'uploaded',
        'extracting',
        'extracted',
        'failed',
      ] as const),
    }
  })
  .relation('documentChunks', () => DocumentChunkFactory)
  .relation('flashcardDecks', () => FlashcardDeckFactory)
  .state('extracted', (document) => (document.processingStatus = 'extracted'))
  .state('failed', (document) => (document.processingStatus = 'failed'))
  .build()
