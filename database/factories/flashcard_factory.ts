import factory from '@adonisjs/lucid/factories'
import Flashcard from '#models/flashcard'
import { DateTime } from 'luxon'

export const FlashcardFactory = factory
  .define(Flashcard, async ({ faker }) => {
    return {
      flashcardDeckId: '',
      question: faker.lorem.sentence() + '?',
      answer: faker.lorem.sentence(),
      hint: faker.datatype.boolean() ? faker.lorem.sentence() : null,
      position: faker.number.int({ min: 1, max: 100 }),
      tags: faker.datatype.boolean() ? faker.lorem.words(3).split(',').join(',') : null,
      createdBy: faker.helpers.arrayElement(['user', 'ai'] as const),
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      lastReviewedAt: null,
      nextReviewAt: faker.datatype.boolean() ? DateTime.now().plus({ days: 1 }) : null,
      timesStudied: 0,
      timesSkipped: 0,
    }
  })
  .state('reviewed', async (card, { faker }) => {
    card.lastReviewedAt = DateTime.now()
    card.timesStudied = faker.number.int({ min: 1, max: 10 })
  })
  .build()
