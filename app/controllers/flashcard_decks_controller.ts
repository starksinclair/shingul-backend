import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import StudySet from '../models/study_set.js'
import { flashcardDeckValidator } from '#validators/flashcard_deck'
import FlashcardDeck from '../models/flashcard_deck.js'
import DocumentChunk from '../models/document_chunk.js'
import { serviceContainer } from '#services/service_container'
import Flashcard from '../models/flashcard.js'
import FlashcardDeckDocument from '../models/flashcard_deck_document.js'

export default class FlashcardDecksController {
  /**
   * Display a list of resource
   */
  async index({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   */
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(flashcardDeckValidator)
    const user = auth.user!
    const trx = await db.transaction()
    const studySet = await StudySet.findOrFail(payload.studySetId)
    if (user.id !== studySet.ownerId) {
      return response.internalServerError({
        message: 'Failed to create flashcard deck',
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

    const { flashcards, summary, title } =
      await serviceContainer.flashcardDeckService.generateFlashcards(
        payload.description,
        payload.count,
        payload.difficulty,
        {
          customPrompt: payload.text,
          pdfText,
        }
      )
    if (!summary || !title || flashcards.length === 0) {
      return response.badRequest({
        message: 'Failed to create flashcard deck',
        errors: {
          summary: summary ? undefined : 'Summary is required',
          title: title ? undefined : 'Title is required',
          flashcards: flashcards.length > 0 ? undefined : 'Flashcards are required',
        },
      })
    }
    try {
      const flashcardDeck = await FlashcardDeck.create(
        {
          studySetId: payload.studySetId,
          title: title || '',
          description: summary || '',
          difficulty: payload.difficulty || 'medium',
          cardCount: flashcards.length,
          createdBy: 'ai',
        },
        { client: trx }
      )

      // Attach documents to flashcard deck if provided
      if (payload.documentIds && payload.documentIds.length > 0) {
        // Create pivot records directly to ensure timestamps are set
        const pivotRecords = payload.documentIds.map((documentId) => ({
          flashcardDeckId: flashcardDeck.id,
          studyDocumentId: documentId,
        }))
        await FlashcardDeckDocument.createMany(pivotRecords, { client: trx })
      }

      for (const [index, flashcard] of flashcards.entries()) {
        await Flashcard.create(
          {
            flashcardDeckId: flashcardDeck.id,
            question: flashcard.question,
            answer: flashcard.answer,
            hint: flashcard.hint || '',
            tags: flashcard.tags?.join(',') || '',
            position: index + 1,
          },
          { client: trx }
        )
      }
      await trx.commit()
      return response.created({
        message: 'Flashcard deck created successfully',
        data: flashcardDeck,
      })
    } catch (error) {
      await trx.rollback()
      return response.internalServerError({
        message: 'Failed to create flashcard deck',
        error: error,
      })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response, auth }: HttpContext) {
    const flashcardDeck = await FlashcardDeck.query()
      .where('id', params.id)
      .preload('studySet', (query) => {
        query.select('id', 'owner_id')
      })
      .preload('flashcards')
      .firstOrFail()

    if (flashcardDeck.studySet.ownerId !== auth.user!.id) {
      return response.unauthorized({
        message: 'You are not authorized to view this flashcard deck',
      })
    }

    // Structure response to match interface
    const flashcardDeckResponse = {
      id: flashcardDeck.id,
      studySetId: flashcardDeck.studySetId,
      title: flashcardDeck.title,
      description: flashcardDeck.description || undefined,
      cardCount: flashcardDeck.cardCount || 0,
      createdAt: flashcardDeck.createdAt.toISO(),
      flashcards: flashcardDeck.flashcards.map((flashcard) => ({
        id: String(flashcard.id),
        flashcardDeckId: flashcard.flashcardDeckId,
        front: flashcard.question,
        back: flashcard.answer,
        difficulty: flashcardDeck.difficulty,
        ...(flashcard.lastReviewedAt && {
          lastReviewed: flashcard.lastReviewedAt.toISO(),
        }),
      })),
    }

    return response.ok(flashcardDeckResponse)
  }

  /**
   * Delete record
   */
  async destroy({ params, response }: HttpContext) {
    const flashcardDeck = await FlashcardDeck.query().where('id', params.id).firstOrFail()
    await flashcardDeck.delete()
    return response.ok({ message: 'Flashcard deck deleted' })
  }
}
