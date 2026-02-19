import type { HttpContext } from '@adonisjs/core/http'

import { serviceContainer } from '#services/service_container'
import StudyDocument from '#models/study_document'
import { ulid } from 'ulid'
import { documentValidator } from '../validators/document.js'
import db from '@adonisjs/lucid/services/db'
import StudySet from '../models/study_set.js'

export default class DocumentsController {
  /**
   * Display a list of resource
   */
  async index({ response }: HttpContext) {
    const query = StudyDocument.query().preload('studySet')

    const documents = await query.orderBy('created_at', 'desc')

    return response.ok({ documents })
  }

  /**
   * Display form to create a new record
   */
  async create({}: HttpContext) {}

  /**
   * Handle form submission for the create action
   * Uploads a document (file or text), parses it if needed, and generates flashcards
   */
  async store({ request, response, auth }: HttpContext) {
    const payload = await request.validateUsing(documentValidator)
    const files = payload.files
    const user = auth.user!
    const trx = await db.transaction()
    const studySet = await StudySet.findOrFail(payload.studySetId)
    if (user.id !== studySet.ownerId) {
      return response.internalServerError({
        message: 'Failed to upload documents',
      })
    }
    try {
      if (files && files.length > 0 && files[0]) {
        for (const file of files) {
          if (!file) continue
          const key = `study_sets/${payload.studySetId}/${ulid()}.pdf`
          await serviceContainer.documentService.processAndStoreDocument(
            file,
            payload.studySetId,
            user.id,
            key,
            'local',
            trx
          )
        }
      }
      await trx.commit()
      return response.ok({ message: 'Documents uploaded successfully' })
    } catch (error) {
      await trx.rollback()
      return response.badRequest({ message: 'Failed to upload documents', error: error })
    }
  }

  /**
   * Show individual record
   */
  async show({ params, response }: HttpContext) {
    const document = await StudyDocument.query()
      .where('id', params.id)
      .preload('studySet', (query) => {
        query.preload('owner')
      })
      .preload('uploader')
      .preload('documentChunks')
      .preload('flashcardDecks', (query) => {
        query.preload('flashcards')
      })
      .firstOrFail()

    return response.ok({ document })
  }

  /**
   * Edit individual record
   */
  async edit({}: HttpContext) {}

  /**
   * Handle form submission for the edit action
   */
  async update({}: HttpContext) {}

  /**
   * Delete record
   */
  async destroy({}: HttpContext) {}

  /**
   * Split text into chunks for storage
   */
}
