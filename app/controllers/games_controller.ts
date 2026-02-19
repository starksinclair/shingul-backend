import type { HttpContext } from '@adonisjs/core/http'
import GameSession from '../models/game_session.js'
import {
  createGameSessionValidator,
  joinGameSessionValidator,
  gameResponseValidator,
  kickoutGameSessionValidator,
} from '../validators/game.js'
import { serviceContainer } from '../services/service_container.js'
import { DateTime } from 'luxon'
import GameResponse from '../models/game_response.js'
import QuizQuestion from '../models/quiz_question.js'
import Quiz from '../models/quiz.js'
import GameParticipant from '../models/game_participant.js'
import db from '@adonisjs/lucid/services/db'

export default class GamesController {
  /**
   * Display a list of resource
   */
  async index({ response, auth }: HttpContext) {
    const gameSessions = await GameSession.query().where('host_user_id', auth.user!.id)
    return response.ok(gameSessions)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(createGameSessionValidator)
    const code = serviceContainer.gameService.generateGameCode()
    const quiz = await Quiz.findOrFail(payload.quizId)
    const gameSession = await GameSession.create({
      hostUserId: auth.user!.id,
      studySetId: payload.studySetId,
      quizId: payload.quizId,
      title: payload.title,
      maxPlayers: payload.maxPlayers ?? 5,
      timePerQuestionSeconds: payload.timePerQuestion ?? 30,
      pointsPerQuestion: payload.pointsPerQuestion ?? 10,
      playerViewMode: payload.playerViewMode ?? 'full',
      totalQuestions: quiz.questionCount ?? 0,
      code,
    })
    return response.ok(gameSession)
  }

  /**
   * Show individual record
   */
  async show({ params, response, auth }: HttpContext) {
    console.log('Game session id', params.id)
    const gameSession = await GameSession.query()
      .where('id', params.id)
      .preload('participants', (query) => {
        query.where('status', 'active')
      })
      .preload('quiz', (query) => {
        query.preload('questions', (questionsQuery) => {
          questionsQuery.select('id', 'question', 'choices')
          questionsQuery.orderBy('position', 'asc')
        })
      })
      .firstOrFail()

    if (gameSession.hostUserId !== auth.user!.id) {
      console.log('Unauthorized to load game session', gameSession.hostUserId, auth.user!.id)
      return response.unauthorized({
        message: 'Failed to load game session',
      })
    }

    // Structure response to match interface
    const gameResponse = {
      id: String(gameSession.id),
      code: gameSession.code,
      currentQuestionIndex: gameSession.currentQuestionIndex,
      currentQuestionNumber:
        gameSession.currentQuestionIndex !== null && gameSession.currentQuestionIndex !== undefined
          ? gameSession.currentQuestionIndex + 1
          : null,
      currentQuestion: gameSession.quiz.questions[gameSession.currentQuestionIndex]?.question,
      startedAt: gameSession.startedAt?.toISO(),
      totalQuestions: gameSession.totalQuestions,
      studySetId: gameSession.studySetId,
      title: gameSession.title,
      hostUserId: gameSession.hostUserId,
      isHost: gameSession.hostUserId === auth.user!.id,
      quizId: gameSession.quizId,
      status: gameSession.status,
      secondsPerQuestion: gameSession.timePerQuestionSeconds,
      pointsPerQuestion: gameSession.pointsPerQuestion,
      questionStartedAt: gameSession.questionStartedAt?.toISO(),
      players: gameSession.participants.map((participant) => ({
        id: String(participant.id),
        nickname: participant.nickname,
        ...(participant.avatarColor && { avatar: participant.avatarColor }),
        score: participant.totalScore || 0,
        isHost: participant.userId === gameSession.hostUserId,
      })),
      playersCount: gameSession.playerCount || gameSession.participants.length,
      ...(gameSession.totalQuestions && { totalQuestions: gameSession.totalQuestions }),
      createdAt: gameSession.createdAt.toISO(),
      ...(gameSession.startedAt && { startedAt: gameSession.startedAt.toISO() }),
      ...(gameSession.completedAt && { endedAt: gameSession.completedAt.toISO() }),
    }

    return response.ok(gameResponse)
  }

  async players({ params, response }: HttpContext) {
    const gameSession = await GameSession.query()
      .where('id', params.id)
      .preload('participants', (query) => {
        query.where('status', 'active')
      })
      .firstOrFail()
    const players = gameSession.participants
    return response.ok({
      id: String(gameSession.id),
      code: gameSession.code,
      status: gameSession.status,
      hostUserId: gameSession.hostUserId,
      players: players.map((participant) => ({
        id: String(participant.id),
        nickname: participant.nickname,
        ...(participant.avatarColor && { avatar: participant.avatarColor }),
        score: participant.totalScore || 0,
        isHost: participant.userId === gameSession.hostUserId,
        status: participant.status,
      })),
    })
  }

  async join({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(joinGameSessionValidator)
    const gameSession = await GameSession.query()
      .where('code', payload.code)
      .preload('participants')
      .firstOrFail()
    const userId = auth.user!.id
    const isParticipantByNickname = await gameSession.isParticipantByNickname(
      payload.nickname ?? '',
      userId
    )
    console.log('Is participant by nickname', isParticipantByNickname)
    const isParticipant = await gameSession.isParticipant(userId)
    console.log('Is participant', isParticipant)
    if (isParticipant || isParticipantByNickname) {
      if (gameSession.status === 'live') {
        return response.ok({
          redirect: true,
          redirectUrl: `/study-sets/${gameSession.studySetId}/games/play/public?gameId=${gameSession.id}`,
        })
      } else if (gameSession.status === 'lobby') {
        return response.ok({
          redirect: true,
          redirectUrl: `/lobby?gameId=${gameSession.id}&studySetId=${gameSession.studySetId}`,
        })
      }
    }
    const nicknameTaken = gameSession.participants.some(
      (participant) =>
        participant.nickname === payload.nickname &&
        participant.userId !== userId &&
        participant.status === 'active'
    )

    if (nicknameTaken) {
      return response.conflict({
        message: 'Nickname already taken',
      })
    }
    const gameParticipant = await GameParticipant.create({
      gameSessionId: gameSession.id,
      userId: userId,
      totalScore: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      nickname: payload.nickname,
      joinedAt: DateTime.now(),
    })
    await gameSession
      .merge({
        playerCount: gameSession.playerCount ? gameSession.playerCount + 1 : 1,
      })
      .save()
    await serviceContainer.gameService.broadcastGameParticipant(gameSession.id, gameParticipant)
    return response.ok({
      studySetId: gameSession.studySetId,
      gameId: gameSession.id,
    })
  }

  async kickout({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(kickoutGameSessionValidator)
    const userId = auth.user!.id
    try {
      const gameSession = await GameSession.query()
        .where('id', payload.gameSessionId)
        .andWhere('host_user_id', userId)
        .firstOrFail()
      const gameParticipant = await gameSession.getParticipantById(payload.participantId)
      await gameParticipant
        .merge({
          status: 'kicked',
        })
        .save()
      await serviceContainer.gameService.broadcastGameParticipant(gameSession.id, gameParticipant)
      return response.ok({
        message: 'Participant kicked out',
        game: {
          id: String(gameSession.id),
          code: gameSession.code,
          status: gameSession.status,
          hostUserId: gameSession.hostUserId,
        },
      })
    } catch (error) {
      return response.badRequest({
        message: 'Failed to kick out participant, ' + error.message,
      })
    }
  }
  async start({ response, auth, params }: HttpContext) {
    const result = await db.transaction(async (trx) => {
      const gameSession = await GameSession.query({ client: trx })
        .where('id', params.id)
        .preload('participants', (query) => {
          query.where('status', 'active')
          query.select('id', 'nickname', 'avatarColor', 'totalScore')
        })
        .forUpdate() // Lock row to prevent concurrent updates
        .firstOrFail()

      if (gameSession.hostUserId !== auth.user!.id) {
        throw new Error('Unauthorized')
      }

      gameSession.status = 'live'
      gameSession.startedAt = DateTime.now()
      gameSession.questionStartedAt = DateTime.now()
      gameSession.currentQuestionIndex = gameSession.currentQuestionIndex ?? 0

      await gameSession.save()

      return gameSession
    })

    // After transaction commits, broadcast
    await serviceContainer.gameService.broadcastGameSession(result)
    await serviceContainer.gameService.scheduleAdvanceQuestion({
      gameSessionId: result.id,
      expectedIndex: result.currentQuestionIndex,
      delaySeconds: result.timePerQuestionSeconds,
    })

    return response.ok({
      message: 'Game session started',
      game: {
        id: String(result.id),
        code: result.code,
        status: result.status,
        hostUserId: result.hostUserId,
      },
    })
  }

  async gameResponse({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(gameResponseValidator)

    // Use transaction to prevent race conditions
    const result = await db.transaction(async (trx) => {
      const gameSession = await GameSession.query({ client: trx })
        .where('id', payload.gameSessionId)
        .preload('participants', (query) => {
          query.where('status', 'active')
          query.select('id', 'nickname', 'avatarColor', 'totalScore')
        })
        .firstOrFail()

      const gameParticipant = await GameParticipant.query({ client: trx })
        .where('game_session_id', payload.gameSessionId)
        .where('user_id', auth.user!.id)
        .forUpdate() // Lock row to prevent race conditions
        .firstOrFail()

      if (!gameParticipant) {
        throw new Error('Participant not found')
      }

      const quizQuestion = await QuizQuestion.findOrFail(payload.questionId)
      const isCorrect = payload.choice === quizQuestion.answer
      const timeUsedSeconds = payload.timeUsedSeconds || 0
      const timePerQuestionSeconds = gameSession.timePerQuestionSeconds
      const basePoints = gameSession.pointsPerQuestion ?? 100

      let pointsEarned = 0
      if (isCorrect && payload.choice) {
        const timeBonus = Math.floor(basePoints * 0.5)
        const timeRemaining = Math.max(0, timePerQuestionSeconds - timeUsedSeconds)
        const timeRatio = Math.min(1, timeRemaining / timePerQuestionSeconds)
        pointsEarned = basePoints + Math.floor(timeRatio * timeBonus)
      }

      // Create response
      await GameResponse.create(
        {
          gameSessionId: gameSession.id,
          gameParticipantId: gameParticipant.id,
          questionId: quizQuestion.id,
          answer: payload.choice,
          isCorrect,
          pointsEarned,
          timeUsedSeconds,
          answeredAt: DateTime.now(),
        },
        { client: trx }
      )

      // Update participant with locked row (prevents race conditions)
      const currentTotalScore = gameParticipant.totalScore || 0
      const currentCorrectAnswers = gameParticipant.correctAnswers || 0
      const currentIncorrectAnswers = gameParticipant.incorrectAnswers || 0
      const finalTotalScore = currentTotalScore + pointsEarned
      console.log('Final total score', finalTotalScore)

      gameParticipant.totalScore = finalTotalScore
      gameParticipant.correctAnswers = isCorrect ? currentCorrectAnswers + 1 : currentCorrectAnswers
      gameParticipant.incorrectAnswers =
        !isCorrect && payload.choice ? currentIncorrectAnswers + 1 : currentIncorrectAnswers
      await gameParticipant.save()

      return { gameSession, gameParticipant }
    })

    // await serviceContainer.gameService.broadcastGameSession(result.gameSession)
    return response.ok(result.gameSession)
  }
  async getGameAndQuestion({ params, response, auth }: HttpContext) {
    const gameSession = await GameSession.findOrFail(params.id)
    const quiz = await Quiz.query()
      .where('id', gameSession.quizId)
      .preload('questions', (query) => {
        query.select('id', 'question', 'choices')
        query.orderBy('position', 'asc')
      })
      .firstOrFail()
    return response.ok({
      game: {
        id: String(gameSession.id),
        code: gameSession.code,
        status: gameSession.status,
        hostUserId: gameSession.hostUserId,
        currentQuestionIndex: gameSession.currentQuestionIndex,
        participantId: auth.user!.id,
      },
      questions: quiz.questions.map((question) => {
        return {
          id: String(question.id),
          question: question.question,
          choices: Array.isArray(question.choices) ? question.choices : [],
        }
      }),
    })
  }
}
