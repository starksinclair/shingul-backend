import factory from '@adonisjs/lucid/factories'
import FlashcardDeck from '#models/flashcard_deck'
import { FlashcardFactory } from './flashcard_factory.js'

export const FlashcardDeckFactory = factory
  .define(FlashcardDeck, async ({ faker }) => {
    return {
      studySetId: '',
      studyDocumentId: faker.datatype.boolean() ? 0 : null,
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      difficulty: faker.number.int({ min: 1, max: 5 }),
      cardCount: faker.number.int({ min: 10, max: 100 }),
      visibility: faker.helpers.arrayElement(['public', 'private', 'unlisted'] as const),
      createdBy: faker.helpers.arrayElement(['user', 'ai'] as const),
    }
  })
  .relation('flashcards', () => FlashcardFactory)
  .state('user_created', (deck) => (deck.createdBy = 'user'))
  .state('ai_created', (deck) => (deck.createdBy = 'ai'))
  .build()
