import factory from '@adonisjs/lucid/factories'
import Quiz from '#models/quiz'
import { GameSessionFactory } from './game_session_factory.js'
import { QuizAttemptFactory } from './quiz_attempt_factory.js'
import { QuizQuestionFactory } from './quiz_question_factory.js'

export const QuizFactory = factory
  .define(Quiz, async ({ faker }) => {
    return {
      studySetId: '',
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      difficulty: faker.number.int({ min: 1, max: 5 }),
      createdBy: faker.helpers.arrayElement(['user', 'ai'] as const),
      mode: faker.helpers.arrayElement(['practice', 'live'] as const),
      timeLimitSeconds: faker.datatype.boolean() ? faker.number.int({ min: 60, max: 3600 }) : null,
      questionCount: faker.number.int({ min: 5, max: 50 }),
      totalPoints: faker.number.int({ min: 50, max: 500 }),
      totalTimeUsed: faker.datatype.boolean() ? faker.number.int({ min: 60, max: 3600 }) : null,
    }
  })
  .relation('questions', () => QuizQuestionFactory)
  .relation('attempts', () => QuizAttemptFactory)
  .relation('gameSessions', () => GameSessionFactory)
  .state('practice', (quiz) => (quiz.mode = 'practice'))
  .state('live', (quiz) => (quiz.mode = 'live'))
  .build()
