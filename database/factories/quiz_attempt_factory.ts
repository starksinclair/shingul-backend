import factory from '@adonisjs/lucid/factories'
import QuizAttempt from '#models/quiz_attempt'
import { DateTime } from 'luxon'

export const QuizAttemptFactory = factory
  .define(QuizAttempt, async ({ faker }) => {
    return {
      quizId: '',
      userId: 0,
      score: faker.number.int({ min: 0, max: 100 }),
      total: faker.number.int({ min: 50, max: 100 }),
      startedAt: DateTime.now().minus({ minutes: faker.number.int({ min: 5, max: 60 }) }),
      completedAt: faker.datatype.boolean() ? DateTime.now() : null,
      mode: faker.helpers.arrayElement(['practice', 'live'] as const),
    }
  })
  .state('completed', (attempt) => {
    attempt.completedAt = DateTime.now()
  })
  .state('in_progress', (attempt) => {
    attempt.completedAt = null
  })
  .build()
