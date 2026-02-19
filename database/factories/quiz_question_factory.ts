import factory from '@adonisjs/lucid/factories'
import QuizQuestion from '#models/quiz_question'
import { GameResponseFactory } from './game_response_factory.js'

export const QuizQuestionFactory = factory
  .define(QuizQuestion, async ({ faker }) => {
    const type = faker.helpers.arrayElement([
      'multiple_choice',
      'fill_in_the_blank',
      'matching',
      'short_answer',
    ] as const)

    let choices = null
    if (type === 'multiple_choice') {
      choices = [
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence(),
      ]
    }

    return {
      quizId: '',
      type,
      question: faker.lorem.sentence() + '?',
      choices,
      answer: faker.lorem.sentence(),
      difficulty: faker.number.int({ min: 1, max: 5 }),
      position: faker.number.int({ min: 1, max: 50 }),
      explanation: faker.datatype.boolean() ? faker.lorem.paragraph() : null,
      feedback: faker.datatype.boolean() ? faker.lorem.sentence() : null,
    }
  })
  .relation('gameResponses', () => GameResponseFactory)
  .state('multiple_choice', async (question, { faker }) => {
    question.type = 'multiple_choice'
    question.choices = [
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
      faker.lorem.sentence(),
    ]
  })
  .build()
