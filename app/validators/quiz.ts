import vine from '@vinejs/vine'

export const quizValidator = vine.compile(
  vine.object({
    studySetId: vine.string().exists({ table: 'study_sets', column: 'id' }),
    documentIds: vine
      .array(vine.number().exists({ table: 'study_documents', column: 'id' }))
      .optional(),
    text: vine.string().optional(),
    description: vine.string().optional(),
    difficulty: vine.enum(['easy', 'medium', 'hard']),
    count: vine.number().optional(),
  })
)
