import type { HttpContext } from '@adonisjs/core/http'
import StudySet from '../models/study_set.js'
import db from '@adonisjs/lucid/services/db'
import { quizValidator } from '#validators/quiz'
import Quiz from '../models/quiz.js'
import DocumentChunk from '../models/document_chunk.js'
import { serviceContainer } from '../services/service_container.js'
import QuizQuestion from '../models/quiz_question.js'
import QuizDocument from '../models/quiz_document.js'

export default class QuizzesController {
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(quizValidator)
    const user = auth.user!
    const trx = await db.transaction()
    const studySet = await StudySet.findOrFail(payload.studySetId)
    if (user.id !== studySet.ownerId) {
      return response.unauthorized({
        message: 'Failed to create quiz',
      })
    }
    let pdfText: string | undefined
    if (payload.documentIds && payload.documentIds.length > 0) {
      const documentChunks = await DocumentChunk.query().whereIn(
        'study_document_id',
        payload.documentIds
      )
      pdfText = documentChunks.map((chunk) => chunk.text).join('\n')
    }
    const { title, description, questions } = await serviceContainer.quizService.generateQuiz(
      payload.description,
      payload.count,
      payload.difficulty,
      {
        customPrompt: payload.text,
        pdfText,
      }
    )
    if (!title || !description || questions.length === 0) {
      return response.badRequest({
        message: 'Failed to generate quiz',
      })
    }
    try {
      const quiz = await Quiz.create(
        {
          studySetId: payload.studySetId,
          title: title,
          description: description,
          difficulty: payload.difficulty,
          createdBy: 'ai',
          mode: 'practice',
          questionCount: questions.length,
        },
        { client: trx }
      )
      if (payload.documentIds && payload.documentIds.length > 0) {
        const pivotRecords = payload.documentIds.map((documentId) => ({
          quizId: quiz.id,
          studyDocumentId: documentId,
        }))
        await QuizDocument.createMany(pivotRecords, { client: trx })
      }
      for (const [index, question] of questions.entries()) {
        await QuizQuestion.create(
          {
            quizId: quiz.id,
            type: 'multiple_choice',
            question: question.question,
            choices: question.choices,
            answer: question.answer,
            position: index + 1,
          },
          { client: trx }
        )
      }
      await trx.commit()
      return response.created({
        message: 'Quiz created successfully',
        data: quiz,
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        message: 'Failed to create quiz',
      })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response, auth }: HttpContext) {
    const quiz = await Quiz.query()
      .where('id', params.id)
      .preload('studySet', (query) => {
        query.select('id', 'owner_id')
      })
      .preload('questions', (query) => {
        query.orderBy('position', 'asc')
      })
      .firstOrFail()

    if (quiz.studySet.ownerId !== auth.user!.id) {
      return response.unauthorized({
        message: 'Failed to load quiz',
      })
    }

    // Structure response to match interface
    const quizResponse = {
      id: quiz.id,
      studySetId: quiz.studySetId,
      title: quiz.title,
      questionsCount: quiz.questionCount || quiz.questions.length,
      createdAt: quiz.createdAt.toISO(),
      questions: quiz.questions.map((question) => {
        // Find the index of the correct answer in the choices array
        const choices = Array.isArray(question.choices) ? question.choices : []
        const correctAnswerIndex = choices.findIndex(
          (choice) => choice.toLowerCase().trim() === question.answer.toLowerCase().trim()
        )

        return {
          id: String(question.id),
          question: question.question,
          options: choices,
          correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
          ...(question.explanation && { explanation: question.explanation }),
        }
      }),
    }

    return response.ok(quizResponse)
  }
}
