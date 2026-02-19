import factory from '@adonisjs/lucid/factories'
import GameParticipant from '#models/game_participant'
import { GameSessionFactory } from './game_session_factory.js'
import { DateTime } from 'luxon'

export const GameParticipantFactory = factory
  .define(GameParticipant, async ({ faker }) => {
    return {
      gameSessionId: 0,
      userId: faker.datatype.boolean() ? 0 : null,
      guestKey: faker.datatype.boolean() ? faker.string.alphanumeric(32) : null,
      nickname: faker.person.firstName(),
      avatarColor: faker.color.rgb(),
      joinedAt: DateTime.now(),
      leftAt: null,
      totalScore: faker.number.int({ min: 0, max: 500 }),
      correctAnswers: faker.number.int({ min: 0, max: 20 }),
      incorrectAnswers: faker.number.int({ min: 0, max: 10 }),
    }
  })
  .relation('gameSession', () => GameSessionFactory)
  .state('left', (participant) => {
    participant.leftAt = DateTime.now()
  })
  .build()
