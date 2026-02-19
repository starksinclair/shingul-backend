import type { HttpContext } from '@adonisjs/core/http'
import QuizAttempt from '../models/quiz_attempt.js'
import { DateTime } from 'luxon'
import { quizAttemptValidator, updateQuizAttemptValidator } from '#validators/quiz_attempt'

export default class QuizAttemptsController {
  /**
   * Display a list of resource
   */
  async index({ response, auth }: HttpContext) {
    const quizAttempts = await QuizAttempt.query().where('user_id', auth.user!.id)
    return response.ok({ quizAttempts })
  }

  /**
   * Show individual record
   */
  async show({ params, response, auth }: HttpContext) {
    const quizAttempt = await QuizAttempt.findOrFail(params.id)
    if (quizAttempt.userId !== auth.user!.id) {
      return response.unauthorized({
        message: 'Failed to load quiz attempt',
      })
    }
    return response.ok({ quizAttempt })
  }

  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(quizAttemptValidator)
    const quizAttempt = await QuizAttempt.create({
      quizId: payload.quizId,
      userId: auth.user!.id,
      mode: 'practice',
      startedAt: DateTime.fromISO(payload.startedAt || DateTime.now().toISO()),
      completedAt: payload.completedAt ? DateTime.fromISO(payload.completedAt) : null,
      score: payload.score,
      total: payload.total,
    })
    return response.ok({ quizAttempt })
  }

  async update({ params, request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(updateQuizAttemptValidator)
    await QuizAttempt.query()
      .where('id', params.id)
      .where('user_id', auth.user!.id)
      .update({
        score: payload.score,
        total: payload.total,
        completedAt: payload.completedAt ? DateTime.fromISO(payload.completedAt) : null,
      })
    return response.ok({ message: 'Quiz attempt updated successfully' })
  }
}
