import factory from '@adonisjs/lucid/factories'
import GameSession from '#models/game_session'
import { DateTime } from 'luxon'

export const GameSessionFactory = factory
  .define(GameSession, async ({ faker }) => {
    return {
      studySetId: '',
      hostUserId: 0,
      quizId: '',
      title: faker.lorem.sentence(),
      code: faker.string.alphanumeric(6).toUpperCase(),
      status: faker.helpers.arrayElement([
        'waiting',
        'active',
        'paused',
        'completed',
        'cancelled',
      ] as const),
      maxPlayers: 5,
      timePerQuestionSeconds: 30,
      pointsPerQuestion: 10,
      startedAt: null,
      completedAt: null,
      cancelledAt: null,
      playerCount: faker.number.int({ min: 1, max: 5 }),
      totalQuestions: faker.number.int({ min: 5, max: 20 }),
    }
  })
  .state('waiting', (session) => (session.status = 'waiting'))
  .state('active', (session) => {
    session.status = 'active'
    session.startedAt = DateTime.now()
  })
  .state('completed', (session) => {
    session.status = 'completed'
    session.completedAt = DateTime.now()
  })
  .build()
