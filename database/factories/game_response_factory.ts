import factory from '@adonisjs/lucid/factories'
import GameResponse from '#models/game_response'
import { DateTime } from 'luxon'

export const GameResponseFactory = factory
  .define(GameResponse, async ({ faker }) => {
    const isCorrect = faker.datatype.boolean()
    return {
      gameSessionId: 0,
      questionId: 0,
      gameParticipantId: 0,
      answer: faker.lorem.sentence(),
      isCorrect,
      pointsEarned: isCorrect ? 10 : 0,
      timeUsedSeconds: faker.number.int({ min: 1, max: 30 }),
      answeredAt: DateTime.now(),
    }
  })
  .state('correct', (response) => {
    response.isCorrect = true
    response.pointsEarned = 10
  })
  .state('incorrect', (response) => {
    response.isCorrect = false
    response.pointsEarned = 0
  })
  .build()
