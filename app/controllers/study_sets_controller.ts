import type { HttpContext } from '@adonisjs/core/http'
import StudySet from '../models/study_set.js'
import { studySetValidator } from '#validators/studyset'
import db from '@adonisjs/lucid/services/db'
import { serviceContainer } from '#services/service_container'
import { ulid } from 'ulid'
import env from '#start/env'

export default class StudySetsController {
  /**
   * Display a list of resource
   */
  async index({ response, auth }: HttpContext) {
    const user = auth.user!
    const studySets = await StudySet.query()
      .where('owner_id', user.id)
      .withCount('studyDocuments', (q) => q.as('document_count'))
      .withCount('quizzes', (q) => q.as('quiz_count'))
      .withCount('flashcardDecks', (q) => q.as('flashcard_count'))
      .orderBy('created_at', 'desc')

    const formattedStudySets = studySets.map((studySet: StudySet) => {
      const extras = studySet.$extras as Record<string, any>
      return {
        id: studySet.id,
        title: studySet.title,
        status: studySet.status,
        createdAt: studySet.createdAt.toISO(),
        updatedAt: studySet.updatedAt?.toISO() || studySet.createdAt.toISO(),
        documentCount: Number(extras.document_count || 0),
        flashcardCount: Number(extras.flashcard_count || 0),
        quizCount: Number(extras.quiz_count || 0),
      }
    })

    return response.ok(formattedStudySets)
  }

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(studySetValidator)
    const user = auth.user!
    const trx = await db.transaction()
    try {
      const studySet = await StudySet.create(
        {
          ownerId: user.id,
          title: payload.title,
          description: payload.description,
          status: 'ready',
          visibility: 'private',
        },
        { client: trx }
      )
      const files = payload.files
      const disk = env.get('DRIVE_DISK')
      if (files && files.length > 0 && files[0]) {
        for (const file of files) {
          if (!file) continue

          const key = `study_sets/${user.id}/${ulid()}.pdf`
          await serviceContainer.documentService.processAndStoreDocument(
            file,
            studySet.id,
            user.id,
            key,
            disk,
            trx
          )
        }
      }
      // console.log('Committing study set')
      await trx.commit()
      // console.log('Study set created successfully')
      return response.ok(studySet)
    } catch (error) {
      await trx.rollback()
      return response.badRequest({ message: 'Failed to create study set', error: error })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response, auth }: HttpContext) {
    const user = auth.user!
    console.log('Study set id', params.id)
    const studySet = await StudySet.query()
      .where('owner_id', user.id)
      .where('id', params.id)
      .preload('studyDocuments', (studyDocumentsQuery) =>
        studyDocumentsQuery.select(
          'id',
          'study_set_id',
          'file_name',
          'processing_status',
          'page_count',
          'created_at'
        )
      )
      .preload('flashcardDecks', (query) =>
        query.select(
          'id',
          'study_set_id',
          'title',
          'description',
          'difficulty',
          'card_count',
          'created_at'
        )
      )
      .preload('quizzes', (query) => {
        query.preload('questions')
      })
      .preload('gameSessions', (query) => {
        query.whereNot('status', 'cancelled').preload('participants')
      })
      .firstOrFail()

    // Get counts for StudySet base fields (using loaded relationships)
    const documentCount = studySet.studyDocuments.length
    const quizCount = studySet.quizzes.length
    const flashcardDecksCount = studySet.flashcardDecks.length

    // Transform documents
    const documents = studySet.studyDocuments.map((doc) => ({
      id: String(doc.id),
      studySetId: doc.studySetId,
      filename: doc.fileName,
      status:
        doc.processingStatus === 'failed'
          ? 'error'
          : (doc.processingStatus as 'uploaded' | 'extracting' | 'extracted' | 'error' | 'queued'),
      pageCount: doc.pageCount || 0,
      url: doc.url || '',
      uploadedAt: doc.createdAt.toISO(),
    }))

    // Transform quizzes
    const quizzes = studySet.quizzes.map((quiz) => ({
      id: quiz.id,
      studySetId: quiz.studySetId,
      title: quiz.title,
      questionsCount: quiz.questions.length || quiz.questionCount || 0,
      createdAt: quiz.createdAt.toISO(),
      ...(quiz.timeLimitSeconds && { timeLimit: quiz.timeLimitSeconds }),
    }))

    const games = studySet.gameSessions.map((game) => ({
      id: String(game.id),
      hostUserId: game.hostUserId,
      quizId: game.quizId,
      title: game.title,
      code: game.code,
      studySetId: game.studySetId,
      status: game.status,
      playersCount: game.participants.length || game.playerCount || 0,
      ...(game.totalQuestions && { totalQuestions: game.totalQuestions }),
      createdAt: game.createdAt.toISO(),
      ...(game.startedAt && { startedAt: game.startedAt.toISO() }),
      ...(game.completedAt && { endedAt: game.completedAt.toISO() }),
    }))

    const flashcardDecks = studySet.flashcardDecks.map((flashcardDeck) => ({
      id: flashcardDeck.id,
      studySetId: flashcardDeck.studySetId,
      title: flashcardDeck.title,
      description: flashcardDeck.description,
      difficulty: flashcardDeck.difficulty,
      cardCount: flashcardDeck.cardCount,
      createdAt: flashcardDeck.createdAt.toISO(),
    }))

    // Build StudySetDetail response
    const studySetDetail = {
      id: studySet.id,
      title: studySet.title,
      description: studySet.description || '',
      status: studySet.status,
      createdAt: studySet.createdAt.toISO(),
      updatedAt: studySet.updatedAt?.toISO() || studySet.createdAt.toISO(),
      documentCount,
      flashcardDecksCount,
      quizCount,
      documents,
      quizzes,
      games,
      flashcardDecks,
    }
    console.log('Study set detail')

    return response.ok(studySetDetail)
  }

  /**
   * Handle form submission for the edit action
   */
  async update({ params, request, response }: HttpContext) {
    const payload = await request.validateUsing(studySetValidator)
    const studySet = await StudySet.query().where('id', params.id).preload('owner').firstOrFail()
    try {
      studySet.title = payload.title || 'Untitled'
      studySet.description = payload.description || null
      await studySet.save()
      return response.ok({ studySet })
    } catch (error) {
      return response.badRequest({ message: 'Failed to update study set' })
    }
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const studySet = await StudySet.query().where('id', params.id).firstOrFail()
    await studySet.delete()
    return response.ok({ message: 'Study set deleted' })
  }
}
